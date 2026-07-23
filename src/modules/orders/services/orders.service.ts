import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { Prisma } from '@prisma/client';
import { OrderStatus } from '@prisma/client';
import { EventBus, OrderCreatedEvent, OrderStatusChangedEvent } from '../../events/event-bus';
import { OrderStateMachine } from './order-state-machine.service';

export interface CreateOrderDto {
  tableId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    notes?: string;
  }>;
  notes?: string;
  createdById: string;
}

export interface UpdateOrderDto {
  notes?: string;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async create(dto: CreateOrderDto) {
    // Verify table exists
    const table = await this.prisma.table.findUnique({
      where: { id: dto.tableId },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    // Verify all menu items exist and are available
    const menuItemIds = dto.items.map((item) => item.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new NotFoundException('Some menu items not found');
    }

    // Check availability
    const unavailableItems = menuItems.filter((item) => !item.isAvailable);
    if (unavailableItems.length > 0) {
      throw new BadRequestException(
        `Menu items not available: ${unavailableItems.map((i) => i.name).join(', ')}`,
      );
    }

    // Calculate total amount
    const totalAmount = dto.items.reduce((sum, item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId)!;
      return sum + Number(menuItem.price) * item.quantity;
    }, 0);

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        tableId: dto.tableId,
        createdById: dto.createdById,
        status: OrderStatus.PENDING,
        totalAmount,
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => {
            const menuItem = menuItems.find((mi) => mi.id === item.menuItemId)!;
            return {
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: menuItem.price,
              notes: item.notes,
            };
          }),
        },
      },
      include: {
        table: { select: { tableNumber: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        items: {
          include: { menuItem: { select: { id: true, name: true } } },
        },
      },
    });

    // Update table status to OCCUPIED
    await this.prisma.table.update({
      where: { id: dto.tableId },
      data: { status: 'OCCUPIED' },
    });

    // Emit event for WebSocket and inventory consumption
    const event: OrderCreatedEvent = {
      orderId: order.id,
      tableNumber: order.table.tableNumber,
      items: order.items.map((item) => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        menuItemId: item.menuItemId,
      })),
      createdBy: `${order.createdBy.firstName || ''} ${order.createdBy.lastName || ''}`.trim(),
      createdAt: order.createdAt,
    };
    this.eventBus.emitOrderCreated(event);

    return this.formatOrder(order);
  }

  async findAll(params?: { status?: OrderStatus; tableId?: string; includeHistory?: boolean }) {
    const where: Prisma.OrderWhereInput = {};

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.tableId) {
      where.tableId = params.tableId;
    }

    if (!params?.includeHistory) {
      where.status = {
        notIn: [OrderStatus.PAID, OrderStatus.CANCELLED],
      };
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        table: { select: { tableNumber: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        items: {
          include: { menuItem: { select: { name: true } } },
        },
      },
    });

    return orders.map((order) => this.formatOrder(order));
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        table: { select: { tableNumber: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        items: {
          include: { menuItem: { select: { name: true } } },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrder(order);
  }

  async updateStatus(id: string, newStatus: OrderStatus, updatedById: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        table: { select: { tableNumber: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate state transition
    OrderStateMachine.validateTransition(order.status, newStatus);

    const previousStatus = order.status;

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: newStatus },
      include: {
        table: { select: { tableNumber: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        items: {
          include: { menuItem: { select: { name: true } } },
        },
      },
    });

    // If order is served or paid, update table status to EMPTY
    if (newStatus === OrderStatus.SERVED || newStatus === OrderStatus.PAID) {
      await this.prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'EMPTY' },
      });
    }

    // Emit event for WebSocket
    const event: OrderStatusChangedEvent = {
      orderId: id,
      previousStatus,
      newStatus,
      tableNumber: order.table.tableNumber,
      updatedBy: updatedById,
      updatedAt: new Date(),
    };
    this.eventBus.emitOrderStatusChanged(event);

    return this.formatOrder(updatedOrder);
  }

  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!OrderStateMachine.isActiveStatus(order.status)) {
      throw new BadRequestException('Cannot update a completed or cancelled order');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: dto,
      include: {
        table: { select: { tableNumber: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        items: {
          include: { menuItem: { select: { name: true } } },
        },
      },
    });

    return this.formatOrder(updatedOrder);
  }

  async delete(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.prisma.order.delete({ where: { id } });
  }

  async findKitchenOrders() {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING] },
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        table: { select: { tableNumber: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        items: {
          include: { menuItem: { select: { name: true } } },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      tableNumber: order.table.tableNumber,
      status: order.status,
      items: order.items.map((item) => ({
        id: item.id,
        menuItemName: item.menuItem.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        notes: item.notes,
        createdAt: item.createdAt,
      })),
      createdByName: `${order.createdBy.firstName || ''} ${order.createdBy.lastName || ''}`.trim(),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));
  }

  private formatOrder(order: any) {
    return {
      id: order.id,
      tableNumber: order.table.tableNumber,
      status: order.status,
      totalAmount: order.totalAmount ? Number(order.totalAmount) : null,
      notes: order.notes,
      createdByName: `${order.createdBy.firstName || ''} ${order.createdBy.lastName || ''}`.trim(),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item: any) => ({
        id: item.id,
        menuItemName: item.menuItem.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        notes: item.notes,
        createdAt: item.createdAt,
      })),
    };
  }
}
