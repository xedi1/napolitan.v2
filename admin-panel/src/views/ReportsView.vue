<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
      <p class="text-gray-600">View sales and performance data</p>
    </div>

    <!-- Tabs -->
    <div class="flex space-x-2 mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id; fetchData()"
        class="px-4 py-2 text-sm font-medium rounded-md"
        :class="activeTab === tab.id 
          ? 'bg-indigo-100 text-indigo-700' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            v-model="filters.startDate"
            type="date"
            class="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">End Date</label>
          <input
            v-model="filters.endDate"
            type="date"
            class="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div class="self-end">
          <button
            @click="fetchData"
            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>

    <!-- Sales Report -->
    <div v-if="activeTab === 'sales'" class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items Sold</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="row in salesData" :key="row.date" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-900">{{ row.date }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ row.totalOrders }}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${{ row.totalRevenue.toFixed(2) }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ row.totalItemsSold }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${{ row.avgOrderValue.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="salesData.length === 0" class="p-8 text-center text-gray-500">
        No sales data available
      </div>
    </div>

    <!-- Top Items -->
    <div v-if="activeTab === 'topItems'" class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Price</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="(item, index) in topItems" :key="item.menuItemId" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-500">{{ index + 1 }}</td>
            <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ item.name }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ item.quantitySold }}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${{ item.revenue.toFixed(2) }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${{ item.avgPrice.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="topItems.length === 0" class="p-8 text-center text-gray-500">
        No data available
      </div>
    </div>

    <!-- Peak Hours -->
    <div v-if="activeTab === 'peakHours'" class="bg-white rounded-lg shadow p-6">
      <div v-for="hour in peakHours" :key="hour.hour" class="flex items-center mb-4">
        <span class="w-16 text-sm font-medium text-gray-500">{{ hour.timeLabel }}</span>
        <div class="flex-1 bg-gray-200 rounded-full h-4 mr-4">
          <div
            class="bg-indigo-600 h-4 rounded-full"
            :style="{ width: `${hour.percentage}%` }"
          />
        </div>
        <span class="text-sm text-gray-600 w-32">
          {{ hour.orderCount }} orders ({{ hour.percentage.toFixed(1) }}%)
        </span>
      </div>
      <div v-if="peakHours.length === 0" class="text-center text-gray-500 py-8">
        No data available
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { reportsApi } from '../api';
import type { SalesReport, TopItem, PeakHour } from '../api/types';

const activeTab = ref('sales');
const tabs = [
  { id: 'sales', label: 'Sales Report' },
  { id: 'topItems', label: 'Top Items' },
  { id: 'peakHours', label: 'Peak Hours' },
];

const filters = ref({
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
});

const salesData = ref<SalesReport[]>([]);
const topItems = ref<TopItem[]>([]);
const peakHours = ref<PeakHour[]>([]);

async function fetchData() {
  const params = {
    startDate: filters.value.startDate,
    endDate: filters.value.endDate,
  };

  try {
    if (activeTab.value === 'sales') {
      const response = await reportsApi.sales(params);
      salesData.value = response.data;
    } else if (activeTab.value === 'topItems') {
      const response = await reportsApi.topItems(params);
      topItems.value = response.data;
    } else if (activeTab.value === 'peakHours') {
      const response = await reportsApi.peakHours(params);
      peakHours.value = response.data;
    }
  } catch (error) {
    console.error('Failed to fetch report data:', error);
  }
}

onMounted(fetchData);
</script>
