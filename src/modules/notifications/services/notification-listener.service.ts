import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';
import { NotificationType, NotificationRecipient } from '@prisma/client';
import {
  SystemEvent,
  OrderCreatedPayload,
  OrderStatusChangedPayload,
  PaymentSuccessPayload,
  ReceiptIssuedPayload,
  InventoryLowStockPayload,
} from '../../events/event-catalog';

@Injectable()
export class NotificationListener implements OnModuleInit {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  onModuleInit() {
    this.logger.log('NotificationListener initialized');
  }

  @OnEvent(SystemEvent.ORDER_CREATED)
  async handleOrderCreated(payload: OrderCreatedPayload) {
    this.logger.debug(`Creating notification for order.created: ${payload.orderId}`);

    await this.notificationService.create({
      type: NotificationType.ORDER_NEW,
      title: 'New Order Received',
      message: `Order #${payload.orderId.slice(0, 8)} for Table ${payload.tableNumber} - ${payload.items.length} items`,
      recipient: NotificationRecipient.KITCHEN,
      metadata: payload,
    });

    // Also notify cashier
    await this.notificationService.create({
      type: NotificationType.ORDER_NEW,
      title: 'New Order',
      message: `Table ${payload.tableNumber} - ${payload.items.length} items`,
      recipient: NotificationRecipient.CASHIER,
      metadata: payload,
    });
  }

  @OnEvent(SystemEvent.ORDER_STATUS_CHANGED)
  async handleOrderStatusChanged(payload: OrderStatusChangedPayload) {
    this.logger.debug(`Creating notification for order.status_changed: ${payload.orderId}`);

    const statusMessages: Record<string, string> = {
      CONFIRMED: 'confirmed',
      PREPARING: 'is being prepared',
      READY: 'is ready for serving',
      SERVED: 'has been served',
      PAID: 'has been paid',
      CANCELLED: 'has been cancelled',
    };

    const message = statusMessages[payload.newStatus] || `status changed to ${payload.newStatus}`;

    await this.notificationService.create({
      type: NotificationType.ORDER_STATUS_CHANGED,
      title: `Order ${message}`,
      message: `Table ${payload.tableNumber} ${message}`,
      recipient: NotificationRecipient.CASHIER,
      metadata: payload,
    });

    if (payload.newStatus === 'READY') {
      await this.notificationService.create({
        type: NotificationType.ORDER_STATUS_CHANGED,
        title: 'Order Ready',
        message: `Table ${payload.tableNumber} order is ready!`,
        recipient: NotificationRecipient.ALL,
        metadata: payload,
      });
    }
  }

  @OnEvent(SystemEvent.PAYMENT_SUCCESS)
  async handlePaymentSuccess(payload: PaymentSuccessPayload) {
    this.logger.debug(`Creating notification for payment.success: ${payload.receiptNumber}`);

    await this.notificationService.create({
      type: NotificationType.PAYMENT_SUCCESS,
      title: 'Payment Received',
      message: `Payment of $${payload.totalAmount} for Table ${payload.tableNumber} via ${payload.paymentMethod}`,
      recipient: NotificationRecipient.MANAGER,
      metadata: payload,
    });
  }

  @OnEvent(SystemEvent.RECEIPT_ISSUED)
  async handleReceiptIssued(payload: ReceiptIssuedPayload) {
    this.logger.debug(`Creating notification for receipt.issued: ${payload.receiptNumber}`);

    await this.notificationService.create({
      type: NotificationType.RECEIPT_ISSUED,
      title: 'Receipt Issued',
      message: `Receipt ${payload.receiptNumber} for $${payload.totalAmount}`,
      recipient: NotificationRecipient.ADMIN,
      metadata: payload,
    });
  }

  @OnEvent(SystemEvent.INVENTORY_LOW_STOCK)
  async handleInventoryLowStock(payload: InventoryLowStockPayload) {
    this.logger.debug(`Creating notification for inventory.low_stock: ${payload.items.join(', ')}`);

    await this.notificationService.create({
      type: NotificationType.INVENTORY_LOW_STOCK,
      title: 'Low Stock Alert',
      message: `Low stock warning: ${payload.items.join(', ')}`,
      recipient: NotificationRecipient.MANAGER,
      metadata: payload,
    });
  }
}
