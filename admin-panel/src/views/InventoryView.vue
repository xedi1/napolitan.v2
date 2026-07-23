<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Inventory</h1>
        <p class="text-gray-600">Manage stock and recipes</p>
      </div>
      <button
        @click="showAddModal = true"
        class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        Add Item
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex space-x-2 mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-4 py-2 text-sm font-medium rounded-md"
        :class="activeTab === tab.id 
          ? 'bg-indigo-100 text-indigo-700' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Inventory Items -->
    <div v-if="activeTab === 'items'" class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alert Level</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ item.name }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ item.unit }}</td>
            <td class="px-6 py-4 text-sm text-gray-900">{{ item.currentStock }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ item.alertLevel }}</td>
            <td class="px-6 py-4">
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="getStockStatus(item).class"
              >
                {{ getStockStatus(item).label }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm">
              <button
                @click="addStock(item)"
                class="text-indigo-600 hover:text-indigo-900 mr-3"
              >
                Add Stock
              </button>
              <button
                @click="editItem(item)"
                class="text-gray-600 hover:text-gray-900"
              >
                Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Recipes -->
    <div v-if="activeTab === 'recipes'" class="bg-white rounded-lg shadow p-6">
      <p class="text-gray-500">Recipe management coming soon...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { inventoryApi } from '../api';
import type { InventoryItem } from '../api/types';

const items = ref<InventoryItem[]>([]);
const activeTab = ref('items');
const showAddModal = ref(false);

const tabs = [
  { id: 'items', label: 'Inventory Items' },
  { id: 'recipes', label: 'Recipes' },
];

async function fetchItems() {
  try {
    const response = await inventoryApi.items.list();
    items.value = response.data;
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
  }
}

function getStockStatus(item: InventoryItem) {
  const ratio = item.currentStock / item.alertLevel;
  if (ratio <= 0) return { label: 'Out of Stock', class: 'bg-red-100 text-red-800' };
  if (ratio <= 1) return { label: 'Low Stock', class: 'bg-yellow-100 text-yellow-800' };
  return { label: 'In Stock', class: 'bg-green-100 text-green-800' };
}

function addStock(item: InventoryItem) {
  const quantity = prompt(`Add stock for ${item.name}:`);
  if (quantity) {
    inventoryApi.items.addStock(item.id, parseFloat(quantity)).then(fetchItems);
  }
}

function editItem(item: InventoryItem) {
  console.log('Edit item:', item);
}

onMounted(fetchItems);
</script>
