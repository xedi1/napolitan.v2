import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from '../dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInventoryItemDto) {
    const item = await this.prisma.inventoryItem.create({
      data: {
        name: dto.name,
        unit: dto.unit,
        currentStock: dto.currentStock,
        alertLevel: dto.alertLevel,
      },
    });

    return this.formatItem(item);
  }

  async findAll(params?: { search?: string; isActive?: boolean; lowStock?: boolean }) {
    const where: Prisma.InventoryItemWhereInput = {};

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params?.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }

    const items = await this.prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Filter low stock in memory
    let result = items.map((item) => this.formatItem(item));
    
    if (params?.lowStock) {
      result = result.filter((item) => item.isLowStock);
    }

    return result;
  }

  async findById(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return this.formatItem(item);
  }

  async update(id: string, dto: UpdateInventoryItemDto) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    const updated = await this.prisma.inventoryItem.update({
      where: { id },
      data: dto,
    });

    return this.formatItem(updated);
  }

  async addStock(id: string, quantity: number) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    const updated = await this.prisma.inventoryItem.update({
      where: { id },
      data: {
        currentStock: Number(item.currentStock) + quantity,
      },
    });

    return this.formatItem(updated);
  }

  async consumeStock(inventoryItemId: string, quantity: number): Promise<{ success: boolean; newStock: number; belowAlert: boolean }> {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    const newStock = Number(item.currentStock) - quantity;

    if (newStock < 0) {
      throw new BadRequestException(`Insufficient stock for ${item.name}. Available: ${item.currentStock}`);
    }

    const updated = await this.prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { currentStock: newStock },
    });

    const belowAlert = newStock < Number(updated.alertLevel);

    return {
      success: true,
      newStock,
      belowAlert,
    };
  }

  async getLowStockItems() {
    const items = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM inventory_items 
      WHERE is_active = true AND current_stock < alert_level
      ORDER BY current_stock ASC
    `;

    return items.map((item) => this.formatItem(item));
  }

  private formatItem(item: any) {
    return {
      id: item.id,
      name: item.name,
      unit: item.unit,
      currentStock: Number(item.currentStock),
      alertLevel: Number(item.alertLevel),
      isActive: item.isActive,
      isLowStock: Number(item.currentStock) < Number(item.alertLevel),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
