import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { notificationsApi } from '../api';
import type { Notification } from '../api/types';

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([]);
  const unreadCount = ref(0);
  const loading = ref(false);
  const pollingInterval = ref<number | null>(null);

  const hasUnread = computed(() => unreadCount.value > 0);

  async function fetchNotifications() {
    try {
      const response = await notificationsApi.list({ limit: 50 });
      notifications.value = response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }

  async function fetchUnreadCount() {
    try {
      const response = await notificationsApi.unreadCount();
      unreadCount.value = response.data.count;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }

  async function markAsRead(id: string) {
    try {
      await notificationsApi.markRead(id);
      const notification = notifications.value.find((n) => n.id === id);
      if (notification) {
        notification.isRead = true;
        notification.readAt = new Date().toISOString();
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      await notificationsApi.markAllRead();
      notifications.value.forEach((n) => {
        n.isRead = true;
        n.readAt = new Date().toISOString();
      });
      unreadCount.value = 0;
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  function addNotification(notification: Notification) {
    notifications.value.unshift(notification);
    if (!notification.isRead) {
      unreadCount.value++;
    }
  }

  function startPolling(intervalMs = 30000) {
    stopPolling();
    fetchUnreadCount();
    pollingInterval.value = window.setInterval(() => {
      fetchUnreadCount();
    }, intervalMs);
  }

  function stopPolling() {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    hasUnread,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    startPolling,
    stopPolling,
  };
});
