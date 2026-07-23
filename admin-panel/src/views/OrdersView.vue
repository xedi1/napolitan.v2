<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Orders</h1>
        <p class="text-gray-600">Manage restaurant orders</p>
      </div>
      <button
        v-if="authStore.canManageOrders"
        @click="showNewOrderModal = true"
        class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        New Order
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <select
          v-model="filters.status"
          class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PREPARING">Preparing</option>
          <option value="READY">Ready</option>
          <option value="SERVED">Served</option>
          <option value="PAID">Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <input
          v-model="filters.search"
          type="text"
          placeholder="Search orders..."
          class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        <button
          @click="fetchOrders"
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Filter
        </button>
      </div>
    </div>

    <!-- Orders List -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm font-medium text-gray-900">#{{ order.id.slice(0, 8) }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">Table {{ order.table?.tableNumber || '-' }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ order.items?.length || 0 }} items</td>
            <td class="px-6 py-4 text-sm text-gray-900">${{ order.totalAmount?.toFixed(2) }}</td>
            <td class="px-6 py-4">
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="getStatusClass(order.status)"
              >
                {{ order.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ formatTime(order.createdAt) }}</td>
            <td class="px-6 py-4 text-sm">
              <div class="flex space-x-2">
                <button
                  @click="viewOrder(order)"
                  class="text-indigo-600 hover:text-indigo-900"
                >
                  View
                </button>
                <select
                  v-if="authStore.canManageOrders && order.status !== 'PAID' && order.status !== 'CANCELLED'"
                  :value="order.status"
                  @change="updateStatus(order.id, ($event.target as HTMLSelectElement).value)"
                  class="text-sm border-gray-300 rounded focus:border-indigo-500"
                >
                  <option v-for="status in getNextStatuses(order.status)" :key="status" :value="status">
                    → {{ status }}
                  </option>
                </select>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="orders.length === 0" class="p-8 text-center text-gray-500">
        No orders found
      </div>
    </div>

    <!-- Order Detail Modal -->
    <div v-if="selectedOrder" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-screen items-center justify-center p-4">
        <div class="fixed inset-0 bg-black opacity-25" @click="selectedOrder = null" />
        <div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          <h3 class="text-lg font-medium mb-4">Order #{{ selectedOrder.id.slice(0, 8) }}</h3>
          <div class="space-y-4">
            <div class="flex justify-between">
              <span class="text-gray-500">Table</span>
              <span class="font-medium">{{ selectedOrder.table?.tableNumber }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Status</span>
              <span class="px-2 py-1 text-xs font-medium rounded-full" :class="getStatusClass(selectedOrder.status)">
                {{ selectedOrder.status }}
              </span>
            </div>
            <div class="border-t pt-4">
              <h4 class="font-medium mb-2">Items</h4>
              <div v-for="item in selectedOrder.items" :key="item.id" class="flex justify-between text-sm py-1">
                <span>{{ item.quantity }}x {{ item.menuItem?.name }}</span>
                <span>${{ (item.unitPrice * item.quantity).toFixed(2) }}</span>
              </div>
            </div>
            <div class="border-t pt-4 flex justify-between font-bold">
              <span>Total</span>
              <span>${{ selectedOrder.totalAmount?.toFixed(2) }}</span>
            </div>
          </div>
          <div class="mt-6 flex justify-end">
            <button
              @click="selectedOrder = null"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useWebSocket } from '../composables/useWebSocket';
import { ordersApi } from '../api';
import type { Order } from '../api/types';

const authStore = useAuthStore();
const { events, joinDashboard } = useWebSocket();

const orders = ref<Order[]>([]);
const selectedOrder = ref<Order | null>(null);
const showNewOrderModal = ref(false);
const filters = ref({
  status: '',
  search: '',
});

async function fetchOrders() {
  try {
    const params: any = {};
    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.search) params.search = filters.value.search;
    
    const response = await ordersApi.list(params);
    orders.value = response.data;
  } catch (error) {
    console.error('Failed to fetch orders:', error);
  }
}

function viewOrder(order: Order) {
  selectedOrder.value = order;
}

async function updateStatus(orderId: string, status: string) {
  try {
    await ordersApi.updateStatus(orderId, status);
    await fetchOrders();
  } catch (error) {
    console.error('Failed to update order status:', error);
  }
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PREPARING: 'bg-orange-100 text-orange-800',
    READY: 'bg-green-100 text-green-800',
    SERVED: 'bg-purple-100 text-purple-800',
    PAID: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}

function getNextStatuses(currentStatus: string): string[] {
  const flow: Record<string, string[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY', 'CANCELLED'],
    READY: ['SERVED'],
    SERVED: ['PAID'],
  };
  return flow[currentStatus] || [];
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Real-time updates
watch(() => events.value.orderCreated, (data) => {
  if (data) {
    fetchOrders();
  }
});

watch(() => events.value.orderUpdated, (data) => {
  if (data) {
    fetchOrders();
  }
});

onMounted(() => {
  fetchOrders();
  joinDashboard();
});
</script>
