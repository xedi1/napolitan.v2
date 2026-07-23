import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditLogService } from './audit-log.service';
import { AuditAction } from '@prisma/client';
import {
  SystemEvent,
  OrderCreatedPayload,
  OrderStatusChangedPayload,
  PaymentSuccessPayload,
  InventoryLowStockPayload,
} from '../../events/event-catalog';

@Injectable()
export class AuditLogListener implements OnModuleInit {
  private readonly logger = new Logger(AuditLogListener.name);

  constructor(private readonly auditLogService: AuditLogService) {}

  onModuleInit() {
    this.logger.log('AuditLogListener initialized');
  }

  @OnEvent(SystemEvent.ORDER_CREATED)
  async handleOrderCreated(payload: OrderCreatedPayload) {
    this.logger.debug(`Audit logging order.created: ${payload.orderId}`);

    await this.auditLogService.create({
      event: SystemEvent.ORDER_CREATED,
      action: AuditAction.ORDER_CREATE,
      entityType: 'Order',
      entityId: payload.orderId,
      metadata: {
        tableNumber: payload.tableNumber,
        itemCount: payload.items.length,
        createdBy: payload.createdBy,
        createdAt: payload.createdAt,
      },
    });
  }

  @OnEvent(SystemEvent.ORDER_STATUS_CHANGED)
  async handleOrderStatusChanged(payload: OrderStatusChangedPayload) {
    this.logger.debug(`Audit logging order.status_changed: ${payload.orderId}`);

    await this.auditLogService.create({
      event: SystemEvent.ORDER_STATUS_CHANGED,
      action: AuditAction.ORDER_UPDATE,
      entityType: 'Order',
      entityId: payload.orderId,
      userId: payload.updatedBy,
      metadata: {
        previousStatus: payload.previousStatus,
        newStatus: payload.newStatus,
        tableNumber: payload.tableNumber,
        updatedAt: payload.updatedAt,
      },
    });
  }

  @OnEvent(SystemEvent.PAYMENT_SUCCESS)
  async handlePaymentSuccess(payload: PaymentSuccessPayload) {
    this.logger.debug(`Audit logging payment.success: ${payload.receiptNumber}`);

    await this.auditLogService.create({
      event: SystemEvent.PAYMENT_SUCCESS,
      action: AuditAction.PAYMENT,
      entityType: 'Receipt',
      entityId: payload.receiptId,
      metadata: {
        receiptNumber: payload.receiptNumber,
        orderId: payload.orderId,
        totalAmount: payload.totalAmount,
        paymentMethod: payload.paymentMethod,
        paidAt: payload.paidAt,
      },
    });
  }

  @OnEvent(SystemEvent.INVENTORY_LOW_STOCK)
  async handleInventoryLowStock(payload: InventoryLowStockPayload) {
    this.logger.debug(`Audit logging inventory.low_stock: ${payload.items.join(', ')}`);

    await this.auditLogService.create({
      event: SystemEvent.INVENTORY_LOW_STOCK,
      action: AuditAction.UPDATE,
      entityType: 'InventoryItem',
      metadata: {
        lowStockItems: payload.items,
        timestamp: payload.timestamp,
      },
    });
  }

  @OnEvent(SystemEvent.RECEIPT_ISSUED)
  async handleReceiptIssued(payload: any) {
    this.logger.debug(`Audit logging receipt.issued: ${payload.receiptNumber}`);

    await this.auditLogService.create({
      event: SystemEvent.RECEIPT_ISSUED,
      action: AuditAction.CREATE,
      entityType: 'Receipt',
      entityId: payload.receiptId,
      metadata: payload,
    });
  }
}
