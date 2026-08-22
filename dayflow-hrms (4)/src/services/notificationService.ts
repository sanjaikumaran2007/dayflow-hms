import { NotificationItem, NotificationCategory, TargetRole } from '../types/hrms';
import { getStoreItem, setStoreItem, STORAGE_KEYS, apiClient } from './api';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';

export const notificationService = {
  async getNotifications(userId?: string, role?: string): Promise<NotificationItem[]> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.get('/notifications', { params: { userId, role } });
        return response.data;
      } catch (err) {
        console.warn('Backend getNotifications failed, using local store', err);
      }
    }

    let list = getStoreItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    if (!Array.isArray(list)) {
      list = Array.isArray(INITIAL_NOTIFICATIONS) ? [...INITIAL_NOTIFICATIONS] : [];
    }

    if (role || userId) {
      list = list.filter((n) => {
        if (!n) return false;
        if (n.targetRole === 'ALL') return true;
        if (n.targetRole && role && n.targetRole === role) return true;
        if (n.userId && userId && n.userId === userId) return true;
        return false;
      });
    }

    return list.sort((a, b) => (b?.createdAt || '').localeCompare(a?.createdAt || ''));
  },

  async markAsRead(id: string): Promise<void> {
    let list = getStoreItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    if (!Array.isArray(list)) list = [];
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    setStoreItem(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  async markAllAsRead(): Promise<void> {
    let list = getStoreItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    if (!Array.isArray(list)) list = [];
    const updated = list.map((n) => ({ ...n, isRead: true }));
    setStoreItem(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  async deleteNotification(id: string): Promise<void> {
    let list = getStoreItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    if (!Array.isArray(list)) list = [];
    const updated = list.filter((n) => n.id !== id);
    setStoreItem(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  async createNotification(item: {
    userId?: string;
    targetRole?: TargetRole;
    title: string;
    message: string;
    category: NotificationCategory;
    actionUrl?: string;
  }): Promise<NotificationItem> {
    let list = getStoreItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    if (!Array.isArray(list)) list = [];
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: item.userId,
      targetRole: item.targetRole || 'ALL',
      title: item.title,
      message: item.message,
      category: item.category,
      isRead: false,
      actionUrl: item.actionUrl,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setStoreItem(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...list]);
    return newNotif;
  },
};
