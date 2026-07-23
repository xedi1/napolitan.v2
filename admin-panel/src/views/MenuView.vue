<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Menu Management</h1>
        <p class="text-gray-600">Manage categories and menu items</p>
      </div>
      <button
        @click="showModal = true"
        class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        Add Item
      </button>
    </div>

    <!-- Categories Tabs -->
    <div class="flex space-x-2 mb-6 overflow-x-auto">
      <button
        v-for="category in categories"
        :key="category.id"
        @click="selectedCategory = category"
        class="px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap"
        :class="selectedCategory?.id === category.id 
          ? 'bg-indigo-100 text-indigo-700' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
      >
        {{ category.name }}
      </button>
    </div>

    <!-- Menu Items Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="bg-white rounded-lg shadow p-4"
      >
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-medium text-gray-900">{{ item.name }}</h3>
            <p class="text-sm text-gray-500 mt-1">{{ item.description }}</p>
          </div>
          <span
            class="px-2 py-1 text-xs font-medium rounded-full"
            :class="item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
          >
            {{ item.isAvailable ? 'Available' : 'Unavailable' }}
          </span>
        </div>
        <div class="mt-4 flex justify-between items-center">
          <span class="text-lg font-bold text-indigo-600">${{ item.price.toFixed(2) }}</span>
          <div class="flex space-x-2">
            <button
              @click="editItem(item)"
              class="text-gray-500 hover:text-indigo-600"
            >
              Edit
            </button>
            <button
              @click="toggleAvailability(item)"
              class="text-sm"
              :class="item.isAvailable ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'"
            >
              {{ item.isAvailable ? 'Disable' : 'Enable' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredItems.length === 0" class="text-center text-gray-500 py-8">
      No items in this category
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { menuApi } from '../api';
import type { MenuItem, Category } from '../api/types';

const categories = ref<Category[]>([]);
const menuItems = ref<MenuItem[]>([]);
const selectedCategory = ref<Category | null>(null);
const showModal = ref(false);

const filteredItems = computed(() => {
  if (!selectedCategory.value) return menuItems.value;
  return menuItems.value.filter((item) => item.categoryId === selectedCategory.value?.id);
});

async function fetchCategories() {
  try {
    const response = await menuApi.categories.list();
    categories.value = response.data;
    if (categories.value.length > 0 && !selectedCategory.value) {
      selectedCategory.value = categories.value[0];
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }
}

async function fetchMenuItems() {
  try {
    const response = await menuApi.items.list();
    menuItems.value = response.data;
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
  }
}

function editItem(item: MenuItem) {
  // Open edit modal
  console.log('Edit item:', item);
}

async function toggleAvailability(item: MenuItem) {
  try {
    await menuApi.items.update(item.id, { isAvailable: !item.isAvailable });
    await fetchMenuItems();
  } catch (error) {
    console.error('Failed to toggle availability:', error);
  }
}

onMounted(async () => {
  await fetchCategories();
  await fetchMenuItems();
});
</script>
