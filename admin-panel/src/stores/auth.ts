import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '../api';
import type { User, UserRole } from '../api/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  const isAdmin = computed(() => user.value?.role === 'ADMIN');
  const isManager = computed(() => user.value?.role === 'MANAGER' || isAdmin.value);
  const isChef = computed(() => user.value?.role === 'CHEF');
  const isCashier = computed(() => user.value?.role === 'CASHIER' || isManager.value);
  const isWaiter = computed(() => user.value?.role === 'WAITER' || isManager.value);
  const isStaff = computed(() => !!user.value?.role);

  const canAccess = (roles: UserRole[]) => {
    if (!user.value) return false;
    if (isAdmin.value) return true;
    return roles.includes(user.value.role);
  };

  const canManageOrders = computed(() => canAccess(['ADMIN', 'MANAGER', 'CHEF', 'WAITER', 'CASHIER']));
  const canManageMenu = computed(() => canAccess(['ADMIN', 'MANAGER']));
  const canManageTables = computed(() => canAccess(['ADMIN', 'MANAGER', 'WAITER']));
  const canManageInventory = computed(() => canAccess(['ADMIN', 'MANAGER']));
  const canManageEmployees = computed(() => canAccess(['ADMIN', 'MANAGER']));
  const canViewReports = computed(() => canAccess(['ADMIN', 'MANAGER']));
  const canManageIntegrations = computed(() => canAccess(['ADMIN']));
  const canManageSettings = computed(() => canAccess(['ADMIN', 'MANAGER']));

  async function login(email: string, password: string) {
    loading.value = true;
    error.value = null;

    try {
      const response = await authApi.login(email, password);
      token.value = response.data.token;
      user.value = response.data.user;
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return true;
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Login failed';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function register(data: { email: string; password: string; firstName: string; lastName: string }) {
    loading.value = true;
    error.value = null;

    try {
      const response = await authApi.register(data);
      token.value = response.data.token;
      user.value = response.data.user;
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return true;
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Registration failed';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function checkAuth() {
    if (!token.value) return false;

    loading.value = true;
    try {
      const response = await authApi.me();
      user.value = response.data;
      localStorage.setItem('user', JSON.stringify(response.data));
      return true;
    } catch {
      logout();
      return false;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Initialize from localStorage
  function init() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser);
      } catch {
        logout();
      }
    }
  }

  init();

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isManager,
    isChef,
    isCashier,
    isWaiter,
    isStaff,
    canAccess,
    canManageOrders,
    canManageMenu,
    canManageTables,
    canManageInventory,
    canManageEmployees,
    canViewReports,
    canManageIntegrations,
    canManageSettings,
    login,
    register,
    checkAuth,
    logout,
  };
});
