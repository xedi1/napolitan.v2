import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventBus, OrderCreatedEvent, OrderStatusChangedEvent, PaymentSuccessEvent } from '../events/event-bus';
import { OrdersGateway } from './orders.gateway';

@Injectable()
export class OrdersGatewayListener implements OnModuleInit {
  private readonly logger = new Logger(OrdersGatewayListener.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  onModuleInit() {
    this.logger.log('OrdersGatewayListener initialized');
  }

  @OnEvent('order.created')
  handleOrderCreated(event: OrderCreatedEvent) {
    this.logger.log(`Processing order.created event for order ${event.orderId}`);

    // Broadcast to kitchen
    this.ordersGateway.broadcastToRoom('kitchen', 'order:new', {
      type: 'order:new',
      data: {
        orderId: event.orderId,
        tableNumber: event.tableNumber,
        items: event.items,
        createdBy: event.createdBy,
        createdAt: event.createdAt,
      },
    });

    // Broadcast to dashboard
    this.ordersGateway.broadcastToRoom('dashboard', 'order:new', {
      type: 'order:new',
      data: {
        orderId: event.orderId,
        tableNumber: event.tableNumber,
        items: event.items,
        createdBy: event.createdBy,
        createdAt: event.createdAt,
      },
    });

    // Broadcast to cashier
    this.ordersGateway.broadcastToRoom('cashier', 'order:new', {
      type: 'order:new',
      data: {
        orderId: event.orderId,
        tableNumber: event.tableNumber,
        items: event.items,
        createdBy: event.createdBy,
        createdAt: event.createdAt,
      },
    });
  }

  @OnEvent('order.status_changed')
  handleOrderStatusChanged(event: OrderStatusChangedEvent) {
    this.logger.log(
      `Processing order.status_changed event for order ${event.orderId}: ${event.previousStatus} -> ${event.newStatus}`,
    );

    const payload = {
      type: 'order:status_changed',
      data: {
        orderId: event.orderId,
        previousStatus: event.previousStatus,
        newStatus: event.newStatus,
        tableNumber: event.tableNumber,
        updatedBy: event.updatedBy,
        updatedAt: event.updatedAt,
      },
    };

    // Kitchen listens for: confirmed, preparing, ready, cancelled
    if (['PREPARING', 'READY', 'CANCELLED'].includes(event.newStatus)) {
      this.ordersGateway.broadcastToRoom('kitchen', 'order:status_changed', payload);
    }

    // Cashier listens for: ready, served, paid, cancelled
    if (['READY', 'SERVED', 'PAID', 'CANCELLED'].includes(event.newStatus)) {
      this.ordersGateway.broadcastToRoom('cashier', 'order:status_changed', payload);
    }

    // Dashboard listens for all status changes
    this.ordersGateway.broadcastToRoom('dashboard', 'order:status_changed', payload);
  }

  @OnEvent('payment.success')
  handlePaymentSuccess(event: PaymentSuccessEvent) {
    this.logger.log(
      `Processing payment.success event for receipt ${event.receiptNumber}`,
    );

    const payload = {
      type: 'payment:success',
      data: {
        receiptId: event.receiptId,
        receiptNumber: event.receiptNumber,
        orderId: event.orderId,
        tableNumber: event.tableNumber,
        totalAmount: event.totalAmount,
        paymentMethod: event.paymentMethod,
        paidAt: event.paidAt,
        receiptUrl: event.receiptUrl,
      },
    };

    // Broadcast to cashier
    this.ordersGateway.broadcastToRoom('cashier', 'payment:success', payload);

    // Broadcast to dashboard
    this.ordersGateway.broadcastToRoom('dashboard', 'payment:success', payload);
  }
}
