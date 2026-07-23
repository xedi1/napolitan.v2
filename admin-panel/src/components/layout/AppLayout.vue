<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Top Navigation -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Logo & Nav -->
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <span class="text-xl font-bold text-indigo-600">🍕 Napolitan</span>
            </div>
            <div class="hidden sm:ml-8 sm:flex sm:space-x-4">
              <router-link
                v-for="item in filteredNavItems"
                :key="item.name"
                :to="item.path"
                class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md"
                :class="isActive(item.path) 
                  ? 'text-indigo-600 bg-indigo-50' 
                  : 'text-gray-600 hover:text-gray-900'"
              >
                <component :is="item.icon" class="w-4 h-4 ml-2" />
                {{ item.label }}
              </router-link>
            </div>
          </div>

          <!-- Right side -->
          <div class="flex items-center space-x-4">
            <!-- Notifications -->
            <button
              @click="showNotifications = !showNotifications"
              class="relative p-2 text-gray-600 hover:text-gray-900"
            >
              <BellIcon class="w-5 h-5" />
              <span
                v-if="notificationStore.unreadCount > 0"
                class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full"
              >
                {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
              </span>
            </button>

            <!-- User Menu -->
            <div class="relative">
              <button
                @click="showUserMenu = !showUserMenu"
                class="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900"
              >
                <UserCircleIcon class="w-6 h-6" />
                <span class="text-sm font-medium">{{ authStore.user?.firstName }}</span>
                <ChevronDownIcon class="w-4 h-4" />
              </button>

              <!-- Dropdown -->
              <div
                v-if="showUserMenu"
                class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
              >
                <div class="px-4 py-2 text-sm text-gray-700 border-b">
                  <div class="font-medium">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</div>
                  <div class="text-gray-500 text-xs">{{ authStore.user?.role }}</div>
                </div>
                <router-link
                  to="/settings"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  @click="showUserMenu = false"
                >
                  Settings
                </router-link>
                <button
                  @click="handleLogout"
                  class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <div class="sm:hidden border-t">
        <div class="flex flex-wrap px-2 py-2 space-x-2">
          <router-link
            v-for="item in filteredNavItems"
            :key="item.name"
            :to="item.path"
            class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md"
            :class="isActive(item.path) 
              ? 'text-indigo-600 bg-indigo-50' 
              : 'text-gray-600 hover:text-gray-900'"
          >
            <component :is="item.icon" class="w-4 h-4 mr-1" />
            {{ item.label }}
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Notifications Panel -->
    <div
      v-if="showNotifications"
      class="fixed inset-0 z-40"
      @click="showNotifications = false"
    >
      <div class="absolute inset-0 bg-black opacity-25" />
      <div class="absolute right-0 top-16 w-96 max-h-[calc(100vh-4rem)] bg-white shadow-xl overflow-hidden flex flex-col">
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-medium">Notifications</h3>
          <button
            v-if="notificationStore.hasUnread"
            @click.stop="notificationStore.markAllAsRead()"
            class="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Mark all read
          </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div
            v-for="notification in notificationStore.notifications"
            :key="notification.id"
            class="p-4 border-b hover:bg-gray-50 cursor-pointer"
            :class="{ 'bg-indigo-50': !notification.isRead }"
            @click="notificationStore.markAsRead(notification.id)"
          >
            <div class="flex items-start">
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-sm">{{ notification.title }}</span>
                  <span class="text-xs text-gray-500">{{ formatTime(notification.createdAt) }}</span>
                </div>
                <p class="text-sm text-gray-600 mt-1">{{ notification.message }}</p>
              </div>
              <div
                v-if="!notification.isRead"
                class="w-2 h-2 bg-indigo-600 rounded-full ml-2 mt-1"
              />
            </div>
          </div>
          <div
            v-if="notificationStore.notifications.length === 0"
            class="p-8 text-center text-gray-500"
          >
            No notifications
          </div>
        </div>
      </div>
    </div>

    <!-- Page Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useNotificationStore } from '../../stores/notifications';
import { useWebSocket } from '../../composables/useWebSocket';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  FireIcon,
  TableCellsIcon,
  ListBulletIcon,
  CubeIcon,
  UsersIcon,
  ChartBarIcon,
  PuzzlePieceIcon,
  Cog6ToothIcon,
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon,
} from '@heroicons/vue/24/solid';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const { joinDashboard } = useWebSocket();

const showNotifications = ref(false);
const showUserMenu = ref(false);

const navItems = [
  { name: 'dashboard', label: 'Dashboard', path: '/', icon: HomeIcon },
  { name: 'orders', label: 'Orders', path: '/orders', icon: ClipboardDocumentListIcon },
  { name: 'kitchen', label: 'Kitchen', path: '/kitchen', icon: FireIcon, roles: ['ADMIN', 'MANAGER', 'CHEF'] },
  { name: 'tables', label: 'Tables', path: '/tables', icon: TableCellsIcon },
  { name: 'menu', label: 'Menu', path: '/menu', icon: ListBulletIcon, roles: ['ADMIN', 'MANAGER'] },
  { name: 'inventory', label: 'Inventory', path: '/inventory', icon: CubeIcon, roles: ['ADMIN', 'MANAGER'] },
  { name: 'employees', label: 'Employees', path: '/employees', icon: UsersIcon, roles: ['ADMIN', 'MANAGER'] },
  { name: 'reports', label: 'Reports', path: '/reports', icon: ChartBarIcon, roles: ['ADMIN', 'MANAGER'] },
  { name: 'integrations', label: 'Integrations', path: '/integrations', icon: PuzzlePieceIcon, roles: ['ADMIN'] },
  { name: 'settings', label: 'Settings', path: '/settings', icon: Cog6ToothIcon, roles: ['ADMIN', 'MANAGER'] },
];

const filteredNavItems = computed(() => {
  return navItems.filter((item) => {
    if (!item.roles) return true;
    return authStore.canAccess(item.roles as any);
  });
});

function isActive(path: string) {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

async function handleLogout() {
  showUserMenu.value = false;
  authStore.logout();
  router.push('/login');
}

// Close menus on click outside
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.relative')) {
    showUserMenu.value = false;
  }
}

onMounted(() => {
  notificationStore.startPolling();
  joinDashboard();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  notificationStore.stopPolling();
  document.removeEventListener('click', handleClickOutside);
});
</script>
