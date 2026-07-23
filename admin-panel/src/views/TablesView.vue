<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Tables</h1>
        <p class="text-gray-600">Manage restaurant tables</p>
      </div>
      <button
        v-if="authStore.canManageTables"
        @click="showModal = true"
        class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        Add Table
      </button>
    </div>

    <!-- Table Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div
        v-for="table in tables"
        :key="table.id"
        class="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition"
        :class="getTableClass(table.status)"
        @click="selectTable(table)"
      >
        <div class="text-center">
          <span class="text-2xl font-bold">{{ table.tableNumber }}</span>
          <p class="text-sm text-gray-500">Capacity: {{ table.capacity }}</p>
          <span
            class="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full"
            :class="getStatusClass(table.status)"
          >
            {{ table.status }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="tables.length === 0" class="text-center text-gray-500 py-8">
      No tables found
    </div>

    <!-- Table Modal -->
    <div v-if="selectedTable" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-screen items-center justify-center p-4">
        <div class="fixed inset-0 bg-black opacity-25" @click="selectedTable = null" />
        <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-medium mb-4">Table {{ selectedTable.tableNumber }}</h3>
          
          <div class="space-y-4">
            <div class="flex justify-between">
              <span class="text-gray-500">Capacity</span>
              <span class="font-medium">{{ selectedTable.capacity }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Status</span>
              <span class="px-2 py-1 text-xs font-medium rounded-full" :class="getStatusClass(selectedTable.status)">
                {{ selectedTable.status }}
              </span>
            </div>
          </div>

          <div class="mt-6 flex space-x-3">
            <button
              v-if="selectedTable.status === 'AVAILABLE' && authStore.canManageTables"
              @click="reserveTable(selectedTable.id)"
              class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Reserve
            </button>
            <button
              v-if="selectedTable.status === 'RESERVED' && authStore.canManageTables"
              @click="releaseTable(selectedTable.id)"
              class="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Occupy
            </button>
            <button
              v-if="selectedTable.status === 'OCCUPIED' && authStore.canManageTables"
              @click="releaseTable(selectedTable.id)"
              class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Release
            </button>
            <button
              @click="selectedTable = null"
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
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { tablesApi } from '../api';
import type { Table } from '../api/types';

const authStore = useAuthStore();
const tables = ref<Table[]>([]);
const selectedTable = ref<Table | null>(null);
const showModal = ref(false);

async function fetchTables() {
  try {
    const response = await tablesApi.list();
    tables.value = response.data;
  } catch (error) {
    console.error('Failed to fetch tables:', error);
  }
}

async function reserveTable(id: string) {
  try {
    await tablesApi.reserve(id, { customerName: 'Walk-in', guests: 2 });
    await fetchTables();
    selectedTable.value = null;
  } catch (error) {
    console.error('Failed to reserve table:', error);
  }
}

async function releaseTable(id: string) {
  try {
    await tablesApi.release(id);
    await fetchTables();
    selectedTable.value = null;
  } catch (error) {
    console.error('Failed to release table:', error);
  }
}

function selectTable(table: Table) {
  selectedTable.value = table;
}

function getTableClass(status: string) {
  const classes: Record<string, string> = {
    AVAILABLE: 'border-green-500',
    RESERVED: 'border-yellow-500',
    OCCUPIED: 'border-red-500',
    CLEANING: 'border-gray-300',
  };
  return classes[status] || 'border-gray-300';
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-800',
    RESERVED: 'bg-yellow-100 text-yellow-800',
    OCCUPIED: 'bg-red-100 text-red-800',
    CLEANING: 'bg-gray-100 text-gray-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}

onMounted(fetchTables);
</script>
