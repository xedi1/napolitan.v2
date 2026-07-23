import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentMethod } from '@prisma/client';

export interface OrderCreatedEvent {
  orderId: string;
  tableNumber: number;
  items: Array<{
    name: string;
    quantity: number;
    menuItemId: string;
  }>;
  createdBy: string;
  createdAt: Date;
}

export interface OrderStatusChangedEvent {
  orderId: string;
  previousStatus: string;
  newStatus: string;
  tableNumber: number;
  updatedBy: string;
  updatedAt: Date;
}

export interface PaymentSuccessEvent {
  receiptId: string;
  receiptNumber: string;
  orderId: string;
  tableNumber: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paidAt: Date;
  receiptUrl: string;
}

export interface InventoryLowStockEvent {
  items: string[];
  timestamp: Date;
}

@Injectable()
export class EventBus {
  private readonly logger = new Logger(EventBus.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitOrderCreated(event: OrderCreatedEvent): void {
    this.logger.debug(`Emitting order.created event for order ${event.orderId}`);
    this.eventEmitter.emit('order.created', event);
  }

  emitOrderStatusChanged(event: OrderStatusChangedEvent): void {
    this.logger.debug(
      `Emitting order.status_changed event for order ${event.orderId}: ${event.previousStatus} -> ${event.newStatus}`,
    );
    this.eventEmitter.emit('order.status_changed', event);
  }

  emitPaymentSuccess(event: PaymentSuccessEvent): void {
    this.logger.debug(
      `Emitting payment.success event for receipt ${event.receiptNumber} - $${event.totalAmount}`,
    );
    this.eventEmitter.emit('payment.success', event);
  }

  emitInventoryLowStock(event: InventoryLowStockEvent): void {
    this.logger.warn(
      `Emitting inventory.low_stock event for items: ${event.items.join(', ')}`,
    );
    this.eventEmitter.emit('inventory.low_stock', event);
  }
}
