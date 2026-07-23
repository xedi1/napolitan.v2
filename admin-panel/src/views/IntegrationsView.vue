<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Integrations</h1>
      <p class="text-gray-600">Manage API Keys and Webhooks</p>
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

    <!-- API Keys -->
    <div v-if="activeTab === 'apiKeys'">
      <div class="flex justify-end mb-4">
        <button
          @click="showCreateApiKey = true"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Create API Key
        </button>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permissions</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="key in apiKeys" :key="key.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ key.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-500 font-mono">{{ key.keyPrefix }}***</td>
              <td class="px-6 py-4 text-sm">
                <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {{ key.permissions }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="key.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                >
                  {{ key.isActive ? 'Active' : 'Revoked' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm">
                <button
                  v-if="key.isActive"
                  @click="revokeApiKey(key.id)"
                  class="text-red-600 hover:text-red-900"
                >
                  Revoke
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="apiKeys.length === 0" class="p-8 text-center text-gray-500">
          No API keys found
        </div>
      </div>
    </div>

    <!-- Webhooks -->
    <div v-if="activeTab === 'webhooks'">
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Select API Key</label>
        <select
          v-model="selectedApiKeyId"
          @change="fetchWebhooks"
          class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">Select an API Key</option>
          <option v-for="key in apiKeys" :key="key.id" :value="key.id">
            {{ key.name }} ({{ key.keyPrefix }})
          </option>
        </select>
      </div>

      <div v-if="selectedApiKeyId" class="flex justify-end mb-4">
        <button
          @click="showCreateWebhook = true"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Create Webhook
        </button>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Events</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="webhook in webhooks" :key="webhook.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ webhook.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{{ webhook.url }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="event in webhook.events"
                    :key="event"
                    class="px-2 py-0.5 text-xs bg-gray-100 rounded"
                  >
                    {{ event }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="webhook.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                >
                  {{ webhook.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm">
                <button
                  @click="viewLogs(webhook)"
                  class="text-indigo-600 hover:text-indigo-900 mr-3"
                >
                  Logs
                </button>
                <button
                  @click="toggleWebhook(webhook)"
                  class="text-gray-600 hover:text-gray-900 mr-3"
                >
                  {{ webhook.isActive ? 'Disable' : 'Enable' }}
                </button>
                <button
                  @click="deleteWebhook(webhook.id)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!selectedApiKeyId" class="p-8 text-center text-gray-500">
          Select an API key to view webhooks
        </div>
        <div v-else-if="webhooks.length === 0" class="p-8 text-center text-gray-500">
          No webhooks found
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { integrationsApi } from '../api';
import type { ApiKey, Webhook, WebhookLog } from '../api/types';

const tabs = [
  { id: 'apiKeys', label: 'API Keys' },
  { id: 'webhooks', label: 'Webhooks' },
];

const activeTab = ref('apiKeys');
const apiKeys = ref<ApiKey[]>([]);
const webhooks = ref<Webhook[]>([]);
const webhookLogs = ref<WebhookLog[]>([]);
const selectedApiKeyId = ref('');
const showCreateApiKey = ref(false);
const showCreateWebhook = ref(false);

async function fetchApiKeys() {
  try {
    const response = await integrationsApi.apiKeys.list();
    apiKeys.value = response.data.data || response.data;
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
  }
}

async function fetchWebhooks() {
  if (!selectedApiKeyId.value) {
    webhooks.value = [];
    return;
  }
  try {
    const response = await integrationsApi.webhooks.list(selectedApiKeyId.value);
    webhooks.value = response.data.data || response.data;
  } catch (error) {
    console.error('Failed to fetch webhooks:', error);
  }
}

async function revokeApiKey(id: string) {
  if (confirm('Are you sure you want to revoke this API key?')) {
    try {
      await integrationsApi.apiKeys.revoke(id);
      await fetchApiKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  }
}

async function toggleWebhook(webhook: Webhook) {
  try {
    await integrationsApi.webhooks.update(webhook.id, { isActive: !webhook.isActive });
    await fetchWebhooks();
  } catch (error) {
    console.error('Failed to toggle webhook:', error);
  }
}

async function deleteWebhook(id: string) {
  if (confirm('Are you sure you want to delete this webhook?')) {
    try {
      await integrationsApi.webhooks.delete(id);
      await fetchWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  }
}

async function viewLogs(webhook: Webhook) {
  try {
    const response = await integrationsApi.webhooks.logs(webhook.id);
    webhookLogs.value = response.data.data || response.data;
    console.log('Webhook logs:', webhookLogs.value);
  } catch (error) {
    console.error('Failed to fetch webhook logs:', error);
  }
}

async function fetchData() {
  if (activeTab.value === 'apiKeys') {
    await fetchApiKeys();
  } else if (activeTab.value === 'webhooks') {
    await fetchApiKeys();
    await fetchWebhooks();
  }
}

onMounted(fetchData);
</script>
