// User roles
export type UserRole = 'ADMIN' | 'MANAGER' | 'CHEF' | 'WAITER' | 'CASHIER' | 'STAFF';

// User
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

// Order status
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'PAID'
  | 'CANCELLED';

// Payment method
export type PaymentMethod = 'CASH' | 'CARD' | 'ONLINE';

// Table status
export type TableStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'CLEANING';

// Menu item
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  category?: { id: string; name: string };
  isAvailable: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

// Category
export interface Category {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

// Table
export interface Table {
  id: string;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  currentReservationId?: string;
  positionX?: number;
  positionY?: number;
  createdAt: string;
}

// Order item
export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
  unitPrice: number;
  notes?: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
}

// Order
export interface Order {
  id: string;
  tableId: string;
  table?: Table;
  tableNumber?: number;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  createdById: string;
  createdBy?: { firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

// Receipt
export interface Receipt {
  id: string;
  receiptNumber: string;
  orderId: string;
  order?: Order;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
  receiptUrl?: string;
}

// Inventory item
export interface InventoryItem {
  id: string;
  name: string;
  unit: 'KG' | 'GRAM' | 'LITER' | 'ML' | 'PIECE' | 'CUP' | 'SPOON';
  currentStock: number;
  alertLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Recipe
export interface Recipe {
  id: string;
  menuItemId: string;
  menuItem?: MenuItem;
  items: RecipeItem[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeItem {
  id: string;
  inventoryItemId: string;
  inventoryItem?: InventoryItem;
  quantity: number;
}

// Employee
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  position?: string;
  hourlyRate?: number;
  isActive: boolean;
  shiftStatus: 'OFF' | 'ON_DUTY' | 'BREAK';
  hireDate: string;
  createdAt: string;
}

// Notification
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  recipient: string;
  metadata?: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// Audit log
export interface AuditLog {
  id: string;
  event: string;
  action: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  userEmail?: string;
  metadata?: any;
  createdAt: string;
}

// API Key
export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: 'READ' | 'WRITE' | 'ADMIN';
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

// Webhook
export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  apiKeyId: string;
  createdAt: string;
  updatedAt: string;
}

// Webhook log
export interface WebhookLog {
  id: string;
  event: string;
  payload: any;
  responseCode?: number;
  responseBody?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING';
  attempt: number;
  error?: string;
  duration?: number;
  createdAt: string;
}

// Dashboard data
export interface DashboardData {
  todayRevenue: number;
  todayOrders: number;
  avgOrderValue: number;
  activeOrders: number;
  tablesOccupied: number;
  tablesTotal: number;
  occupancyRate: number;
  lowStockItems: number;
  revenueComparison: {
    vsYesterday: number;
    vsLastWeek: number;
    percentage: {
      vsYesterday: number;
      vsLastWeek: number;
    };
  };
  recentOrders: Array<{
    id: string;
    tableNumber: number;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  topSellingItems: Array<{
    name: string;
    quantitySold: number;
  }>;
}

// Sales report
export interface SalesReport {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  totalItemsSold: number;
  avgOrderValue: number;
}

// Top item report
export interface TopItem {
  menuItemId: string;
  name: string;
  quantitySold: number;
  revenue: number;
  avgPrice: number;
}

// Peak hours report
export interface PeakHour {
  hour: number;
  timeLabel: string;
  orderCount: number;
  percentage: number;
}
