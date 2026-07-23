<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Kitchen Display</h1>
        <p class="text-gray-600">Real-time order management</p>
      </div>
      <div class="text-sm text-gray-500">
        {{ orders.length }} active orders
      </div>
    </div>

    <!-- Orders Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="order in orders"
        :key="order.id"
        class="bg-white rounded-lg shadow-lg overflow-hidden"
        :class="getOrderClass(order)"
      >
        <div class="p-4">
          <div class="flex justify-between items-start mb-4">
            <div>
              <span class="text-2xl font-bold">#{{ order.table?.tableNumber || '-' }}</span>
              <p class="text-sm text-gray-500">{{ formatTime(order.createdAt) }}</p>
            </div>
            <span
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="getStatusClass(order.status)"
            >
              {{ order.status }}
            </span>
          </div>

          <div class="space-y-2 mb-4">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="flex justify-between items-center border-b pb-2"
              :class="{ 'line-through text-gray-400': item.status === 'SERVED' }"
            >
              <div>
                <span class="font-medium">{{ item.quantity }}x</span>
                <span class="ml-2">{{ item.menuItem?.name }}</span>
              </div>
              <button
                v-if="item.status !== 'SERVED'"
                @click="markItemReady(order.id, item.id)"
                class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Done
              </button>
            </div>
          </div>

          <div v-if="order.notes" class="text-sm text-yellow-600 bg-yellow-50 p-2 rounded mb-4">
            <strong>Note:</strong> {{ order.notes }}
          </div>

          <div class="flex space-x-2">
            <button
              v-if="order.status === 'CONFIRMED'"
              @click="updateOrderStatus(order.id, 'PREPARING')"
              class="flex-1 px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Start
            </button>
            <button
              v-if="order.status === 'PREPARING'"
              @click="updateOrderStatus(order.id, 'READY')"
              class="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Ready
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="orders.length === 0" class="text-center text-gray-500 py-16">
      <div class="text-6xl mb-4">🍳</div>
      <p class="text-xl">No orders in kitchen</p>
      <p class="text-sm">New orders will appear here automatically</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { ordersApi } from '../api';
import { useWebSocket } from '../composables/useWebSocket';
import type { Order } from '../api/types';

const { events, joinKitchen } = useWebSocket();

const orders = ref<Order[]>([]);

async function fetchOrders() {
  try {
    const response = await ordersApi.kitchen.list();
    orders.value = response.data;
  } catch (error) {
    console.error('Failed to fetch kitchen orders:', error);
  }
}

async function updateOrderStatus(orderId: string, status: string) {
  try {
    await ordersApi.updateStatus(orderId, status);
    await fetchOrders();
  } catch (error) {
    console.error('Failed to update order status:', error);
  }
}

async function markItemReady(orderId: string, itemId: string) {
  // In real app, this would call an API to update item status
  console.log('Mark item ready:', orderId, itemId);
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PREPARING: 'bg-orange-100 text-orange-800',
    READY: 'bg-green-100 text-green-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}

function getOrderClass(order: Order) {
  const now = new Date();
  const orderTime = new Date(order.createdAt);
  const diffMinutes = (now.getTime() - orderTime.getTime()) / 60000;

  if (diffMinutes > 30) return 'border-red-500 border-4';
  if (diffMinutes > 15) return 'border-yellow-500 border-4';
  return 'border-gray-300 border';
}

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
  joinKitchen();
  // Poll every 30 seconds as backup
  const interval = setInterval(fetchOrders, 30000);
  onUnmounted(() => clearInterval(interval));
});
</script>
