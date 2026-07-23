import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      component: () => import('../components/layout/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
        },
        {
          path: 'orders',
          name: 'orders',
          component: () => import('../views/OrdersView.vue'),
        },
        {
          path: 'kitchen',
          name: 'kitchen',
          component: () => import('../views/KitchenView.vue'),
          meta: { roles: ['ADMIN', 'MANAGER', 'CHEF'] },
        },
        {
          path: 'tables',
          name: 'tables',
          component: () => import('../views/TablesView.vue'),
        },
        {
          path: 'menu',
          name: 'menu',
          component: () => import('../views/MenuView.vue'),
          meta: { roles: ['ADMIN', 'MANAGER'] },
        },
        {
          path: 'inventory',
          name: 'inventory',
          component: () => import('../views/InventoryView.vue'),
          meta: { roles: ['ADMIN', 'MANAGER'] },
        },
        {
          path: 'employees',
          name: 'employees',
          component: () => import('../views/EmployeesView.vue'),
          meta: { roles: ['ADMIN', 'MANAGER'] },
        },
        {
          path: 'reports',
          name: 'reports',
          component: () => import('../views/ReportsView.vue'),
          meta: { roles: ['ADMIN', 'MANAGER'] },
        },
        {
          path: 'integrations',
          name: 'integrations',
          component: () => import('../views/IntegrationsView.vue'),
          meta: { roles: ['ADMIN'] },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../views/SettingsView.vue'),
          meta: { roles: ['ADMIN', 'MANAGER'] },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // Try to restore session
      const isValid = await authStore.checkAuth();
      if (!isValid) {
        return next({ name: 'login', query: { redirect: to.fullPath } });
      }
    }

    // Check role-based access
    if (to.meta.roles) {
      const roles = to.meta.roles as string[];
      if (!authStore.canAccess(roles as any)) {
        return next({ name: 'dashboard' });
      }
    }
  }

  if (to.meta.guest && authStore.isAuthenticated) {
    return next({ name: 'dashboard' });
  }

  next();
});

export default router;
