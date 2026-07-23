import axios from 'axios';
import type { User } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  refresh: (token: string) => api.post('/auth/refresh', { token }),
};

// Users API
export const usersApi = {
  list: () => api.get('/users'),
  get: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Menu API
export const menuApi = {
  categories: {
    list: () => api.get('/categories'),
    create: (data: any) => api.post('/categories', data),
    update: (id: string, data: any) => api.patch(`/categories/${id}`, data),
    delete: (id: string) => api.delete(`/categories/${id}`),
  },
  items: {
    list: (params?: any) => api.get('/menu', { params }),
    get: (id: string) => api.get(`/menu/${id}`),
    create: (data: any) => api.post('/menu', data),
    update: (id: string, data: any) => api.patch(`/menu/${id}`, data),
    delete: (id: string) => api.delete(`/menu/${id}`),
  },
};

// Tables API
export const tablesApi = {
  list: () => api.get('/tables'),
  get: (id: string) => api.get(`/tables/${id}`),
  create: (data: any) => api.post('/tables', data),
  update: (id: string, data: any) => api.patch(`/tables/${id}`, data),
  delete: (id: string) => api.delete(`/tables/${id}`),
  reserve: (id: string, data: any) => api.post(`/tables/${id}/reserve`, data),
  release: (id: string) => api.post(`/tables/${id}/release`),
};

// Orders API
export const ordersApi = {
  list: (params?: any) => api.get('/orders', { params }),
  get: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
  cancel: (id: string) => api.delete(`/orders/${id}`),
  kitchen: {
    list: () => api.get('/kitchen/orders'),
    update: (id: string, data: any) => api.patch(`/kitchen/orders/${id}`, data),
  },
};

// Receipts/Payments API
export const receiptsApi = {
  create: (orderId: string, paymentMethod: string) =>
    api.post('/receipts', { orderId, paymentMethod }),
  list: (params?: any) => api.get('/receipts', { params }),
  get: (id: string) => api.get(`/receipts/${id}`),
};

// Inventory API
export const inventoryApi = {
  items: {
    list: () => api.get('/inventory'),
    get: (id: string) => api.get(`/inventory/${id}`),
    create: (data: any) => api.post('/inventory', data),
    update: (id: string, data: any) => api.patch(`/inventory/${id}`, data),
    addStock: (id: string, quantity: number) =>
      api.post(`/inventory/${id}/add-stock`, { quantity }),
  },
  recipes: {
    list: () => api.get('/inventory/recipes'),
    create: (data: any) => api.post('/inventory/recipes', data),
    update: (id: string, data: any) => api.patch(`/inventory/recipes/${id}`, data),
  },
};

// Employees API
export const employeesApi = {
  list: () => api.get('/employees'),
  get: (id: string) => api.get(`/employees/${id}`),
  create: (data: any) => api.post('/employees', data),
  update: (id: string, data: any) => api.patch(`/employees/${id}`, data),
  updateShift: (id: string, status: string) =>
    api.patch(`/employees/${id}/shift`, { status }),
  onDuty: () => api.get('/employees/on-duty'),
};

// Reports API
export const reportsApi = {
  sales: (params?: any) => api.get('/reports/sales', { params }),
  topItems: (params?: any) => api.get('/reports/top-items', { params }),
  peakHours: (params?: any) => api.get('/reports/peak-hours', { params }),
  dashboard: () => api.get('/analytics/dashboard'),
};

// Notifications API
export const notificationsApi = {
  list: (params?: any) => api.get('/notifications', { params }),
  unread: () => api.get('/notifications/unread'),
  unreadCount: () => api.get('/notifications/unread/count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Audit Logs API
export const auditLogsApi = {
  list: (params?: any) => api.get('/logs', { params }),
  recent: (limit?: number) => api.get('/logs/recent', { params: { limit } }),
  byEntity: (type: string, id: string) =>
    api.get(`/logs/entity/${type}/${id}`),
};

// Integrations API
export const integrationsApi = {
  apiKeys: {
    list: () => api.get('/integrations/api-keys'),
    create: (data: any) => api.post('/integrations/api-keys', data),
    revoke: (id: string) => api.delete(`/integrations/api-keys/${id}`),
  },
  webhooks: {
    list: (apiKeyId: string) =>
      api.get('/integrations/webhooks', { params: { apiKeyId } }),
    create: (data: any) =>
      api.post('/integrations/webhooks', data, {
        params: { apiKeyId: data.apiKeyId },
      }),
    update: (id: string, data: any) =>
      api.patch(`/integrations/webhooks/${id}`, data),
    delete: (id: string) => api.delete(`/integrations/webhooks/${id}`),
    logs: (id: string, params?: any) =>
      api.get(`/integrations/webhooks/${id}/logs`, { params }),
  },
};

// Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
