/**
 * Event Catalog - Napolitan Restaurant System
 * 
 * This document defines all events in the system, their payloads, and listeners.
 * All modules communicate through the Event Bus - no direct function calls between modules.
 */

// ============ EVENT DEFINITIONS ============

export enum SystemEvent {
  // Order Events
  ORDER_CREATED = 'order.created',
  ORDER_STATUS_CHANGED = 'order.status_changed',
  
  // Payment Events
  PAYMENT_SUCCESS = 'payment.success',
  RECEIPT_ISSUED = 'receipt.issued',
  
  // Inventory Events
  INVENTORY_LOW_STOCK = 'inventory.low_stock',
  INVENTORY_UPDATED = 'inventory.updated',
  
  // Dashboard Events
  DASHBOARD_UPDATE = 'dashboard.update',
  
  // Notification Events
  NOTIFICATION_CREATED = 'notification.created',
}

// ============ EVENT PAYLOADS ============

export interface OrderCreatedPayload {
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

export interface OrderStatusChangedPayload {
  orderId: string;
  previousStatus: string;
  newStatus: string;
  tableNumber: number;
  updatedBy: string;
  updatedAt: Date;
}

export interface PaymentSuccessPayload {
  receiptId: string;
  receiptNumber: string;
  orderId: string;
  tableNumber: number;
  totalAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'ONLINE';
  paidAt: Date;
  receiptUrl: string;
}

export interface ReceiptIssuedPayload {
  receiptId: string;
  receiptNumber: string;
  orderId: string;
  totalAmount: number;
  paidAt: Date;
}

export interface InventoryLowStockPayload {
  items: string[];
  timestamp: Date;
}

export interface DashboardUpdatePayload {
  type: string;
  data: any;
}

export interface NotificationCreatedPayload {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  recipient: string;
}

// ============ EVENT LISTENERS ============

/**
 * Event Listener Map
 * 
 * Maps events to their listeners (module.service method)
 */
export const EVENT_LISTENERS: Record<string, Array<{ module: string; method: string }>> = {
  [SystemEvent.ORDER_CREATED]: [
    { module: 'OrdersGatewayListener', method: 'handleOrderCreated' },
    { module: 'OrderInventoryListener', method: 'handleOrderCreated' },
    { module: 'AnalyticsListener', method: 'handleOrderCreated' },
    { module: 'NotificationListener', method: 'handleOrderCreated' },
    { module: 'AuditLogListener', method: 'handleOrderCreated' },
  ],
  
  [SystemEvent.ORDER_STATUS_CHANGED]: [
    { module: 'OrdersGatewayListener', method: 'handleOrderStatusChanged' },
    { module: 'NotificationListener', method: 'handleOrderStatusChanged' },
    { module: 'AuditLogListener', method: 'handleOrderStatusChanged' },
  ],
  
  [SystemEvent.PAYMENT_SUCCESS]: [
    { module: 'OrdersGatewayListener', method: 'handlePaymentSuccess' },
    { module: 'AnalyticsListener', method: 'handlePaymentSuccess' },
    { module: 'NotificationListener', method: 'handlePaymentSuccess' },
    { module: 'AuditLogListener', method: 'handlePaymentSuccess' },
  ],
  
  [SystemEvent.RECEIPT_ISSUED]: [
    { module: 'NotificationListener', method: 'handleReceiptIssued' },
    { module: 'AuditLogListener', method: 'handleReceiptIssued' },
  ],
  
  [SystemEvent.INVENTORY_LOW_STOCK]: [
    { module: 'DashboardEventListener', method: 'handleInventoryLowStock' },
    { module: 'NotificationListener', method: 'handleInventoryLowStock' },
    { module: 'AuditLogListener', method: 'handleInventoryLowStock' },
  ],
  
  [SystemEvent.DASHBOARD_UPDATE]: [
    { module: 'DashboardEventListener', method: 'handleDashboardUpdate' },
  ],
};

// ============ TYPE GUARDS ============

export function isOrderCreatedPayload(data: any): data is OrderCreatedPayload {
  return data && typeof data.orderId === 'string' && Array.isArray(data.items);
}

export function isOrderStatusChangedPayload(data: any): data is OrderStatusChangedPayload {
  return data && typeof data.orderId === 'string' && typeof data.newStatus === 'string';
}

export function isPaymentSuccessPayload(data: any): data is PaymentSuccessPayload {
  return data && typeof data.receiptNumber === 'string' && typeof data.totalAmount === 'number';
}

export function isInventoryLowStockPayload(data: any): data is InventoryLowStockPayload {
  return data && Array.isArray(data.items);
}
