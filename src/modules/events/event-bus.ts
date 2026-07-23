import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface OrderCreatedEvent {
  orderId: string;
  tableNumber: number;
  items: Array<{
    name: string;
    quantity: number;
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
}
