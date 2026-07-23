<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
      <p class="text-gray-600">System configuration and preferences</p>
    </div>

    <div class="max-w-2xl">
      <!-- Profile Section -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Profile</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              :value="`${authStore.user?.firstName} ${authStore.user?.lastName}`"
              readonly
              class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              :value="authStore.user?.email"
              readonly
              class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Role</label>
            <input
              type="text"
              :value="authStore.user?.role"
              readonly
              class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
            />
          </div>
        </div>
      </div>

      <!-- Notifications Section -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h2>
        <div class="space-y-4">
          <label class="flex items-center">
            <input type="checkbox" v-model="preferences.newOrders" class="rounded border-gray-300 text-indigo-600" />
            <span class="ml-2 text-sm text-gray-700">New order notifications</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" v-model="preferences.lowStock" class="rounded border-gray-300 text-indigo-600" />
            <span class="ml-2 text-sm text-gray-700">Low stock alerts</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" v-model="preferences.dailyReport" class="rounded border-gray-300 text-indigo-600" />
            <span class="ml-2 text-sm text-gray-700">Daily sales report</span>
          </label>
        </div>
      </div>

      <!-- About Section -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">About</h2>
        <div class="space-y-2 text-sm text-gray-600">
          <p><strong>Application:</strong> Napolitan Restaurant Management</p>
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>API:</strong> {{ apiUrl }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const preferences = ref({
  newOrders: true,
  lowStock: true,
  dailyReport: false,
});
</script>
