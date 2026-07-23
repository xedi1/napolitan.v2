<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-600">Welcome back, {{ authStore.user?.firstName }}!</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Today's Revenue</p>
            <p class="text-2xl font-bold text-gray-900">${{ dashboard?.todayRevenue?.toFixed(2) || '0.00' }}</p>
            <p v-if="dashboard?.revenueComparison" class="text-xs mt-1" :class="dashboard.revenueComparison.vsYesterday >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ dashboard.revenueComparison.vsYesterday >= 0 ? '+' : '' }}{{ dashboard.revenueComparison.percentage.vsYesterday }}% vs yesterday
            </p>
          </div>
          <div class="p-3 bg-green-100 rounded-full">
            <CurrencyDollarIcon class="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Today's Orders</p>
            <p class="text-2xl font-bold text-gray-900">{{ dashboard?.todayOrders || 0 }}</p>
            <p class="text-xs text-gray-500 mt-1">Avg: ${{ dashboard?.avgOrderValue?.toFixed(2) || '0.00' }}</p>
          </div>
          <div class="p-3 bg-blue-100 rounded-full">
            <ClipboardDocumentListIcon class="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Active Orders</p>
            <p class="text-2xl font-bold text-gray-900">{{ dashboard?.activeOrders || 0 }}</p>
            <p class="text-xs text-gray-500 mt-1">In progress</p>
          </div>
          <div class="p-3 bg-orange-100 rounded-full">
            <FireIcon class="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Tables</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ dashboard?.tablesOccupied || 0 }}/{{ dashboard?.tablesTotal || 0 }}
            </p>
            <p class="text-xs text-gray-500 mt-1">{{ dashboard?.occupancyRate || 0 }}% occupied</p>
          </div>
          <div class="p-3 bg-purple-100 rounded-full">
            <TableCellsIcon class="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>

    <!-- Alerts -->
    <div v-if="dashboard?.lowStockItems" class="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div class="flex items-center">
        <ExclamationTriangleIcon class="w-5 h-5 text-yellow-600 mr-2" />
        <span class="text-sm text-yellow-800">
          {{ dashboard.lowStockItems }} item(s) are running low on stock
        </span>
        <router-link to="/inventory" class="ml-2 text-sm text-yellow-600 hover:text-yellow-800 font-medium">
          View Inventory →
        </router-link>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Orders -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="text-lg font-medium text-gray-900">Recent Orders</h2>
          <router-link to="/orders" class="text-sm text-indigo-600 hover:text-indigo-800">
            View all →
          </router-link>
        </div>
        <div class="divide-y">
          <div
            v-for="order in dashboard?.recentOrders"
            :key="order.id"
            class="p-4 flex justify-between items-center"
          >
            <div>
              <span class="font-medium">Table {{ order.tableNumber }}</span>
              <span class="text-sm text-gray-500 ml-2">${{ order.totalAmount.toFixed(2) }}</span>
            </div>
            <span
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="getStatusClass(order.status)"
            >
              {{ order.status }}
            </span>
          </div>
          <div v-if="!dashboard?.recentOrders?.length" class="p-8 text-center text-gray-500">
            No orders today
          </div>
        </div>
      </div>

      <!-- Top Selling Items -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="text-lg font-medium text-gray-900">Top Selling Items</h2>
          <router-link to="/reports" class="text-sm text-indigo-600 hover:text-indigo-800">
            View Reports →
          </router-link>
        </div>
        <div class="divide-y">
          <div
            v-for="(item, index) in dashboard?.topSellingItems"
            :key="index"
            class="p-4 flex justify-between items-center"
          >
            <div class="flex items-center">
              <span class="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-medium mr-3">
                {{ index + 1 }}
              </span>
              <span class="font-medium">{{ item.name }}</span>
            </div>
            <span class="text-sm text-gray-500">{{ item.quantitySold }} sold</span>
          </div>
          <div v-if="!dashboard?.topSellingItems?.length" class="p-8 text-center text-gray-500">
            No data yet
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useWebSocket } from '../composables/useWebSocket';
import { reportsApi } from '../api';
import type { DashboardData } from '../api/types';
import {
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  FireIcon,
  TableCellsIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/solid';

const authStore = useAuthStore();
const { joinDashboard } = useWebSocket();

const dashboard = ref<DashboardData | null>(null);

async function fetchDashboard() {
  try {
    const response = await reportsApi.dashboard();
    dashboard.value = response.data;
  } catch (error) {
    console.error('Failed to fetch dashboard:', error);
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

onMounted(() => {
  fetchDashboard();
  joinDashboard();
});

onUnmounted(() => {
  // Cleanup
});
</script>
