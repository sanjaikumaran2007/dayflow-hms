import { Announcement, TargetRole } from '../types/hrms';
import { getStoreItem, setStoreItem, STORAGE_KEYS, apiClient } from './api';
import { INITIAL_ANNOUNCEMENTS } from '../data/mockData';
import { auditService } from './auditService';
import { notificationService } from './notificationService';

export const announcementService = {
  async getAnnouncements(role?: string): Promise<Announcement[]> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.get('/announcements', { params: { role } });
        return response.data;
      } catch (err) {
        console.warn('Backend getAnnouncements failed, using local store', err);
      }
    }

    let list = getStoreItem<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    if (!Array.isArray(list)) {
      list = Array.isArray(INITIAL_ANNOUNCEMENTS) ? [...INITIAL_ANNOUNCEMENTS] : [];
    }

    if (role && role !== 'ADMIN') {
      list = list.filter((a) => a && a.isPublished && (a.targetRole === 'ALL' || a.targetRole === role));
    }

    return list.sort((a, b) => (b?.publishDate || '').localeCompare(a?.publishDate || ''));
  },

  async createAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.post('/announcements', data);
        return response.data;
      } catch (err) {
        console.warn('Backend createAnnouncement failed, using local store', err);
      }
    }

    const list = getStoreItem<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    const currentUserStr = localStorage.getItem('dayflow_current_user');
    let authorName = 'Corporate Communications';
    let authorId = 'usr-admin-1';
    if (currentUserStr) {
      try {
        const u = JSON.parse(currentUserStr);
        authorName = u.name;
        authorId = u.id;
      } catch {}
    }

    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: data.title || 'New Company Announcement',
      content: data.content || '',
      targetRole: (data.targetRole as TargetRole) || 'ALL',
      authorId,
      authorName,
      publishDate: data.publishDate || new Date().toISOString().split('T')[0],
      expiryDate: data.expiryDate,
      priority: data.priority || 'MEDIUM',
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newAnn, ...list];
    setStoreItem(STORAGE_KEYS.ANNOUNCEMENTS, updated);

    await auditService.logAction({
      action: 'CREATE',
      tableName: 'announcements',
      recordId: newAnn.id,
      details: `Published announcement: "${newAnn.title}" for ${newAnn.targetRole} audience`,
      newValues: newAnn,
    });

    if (newAnn.isPublished) {
      await notificationService.createNotification({
        targetRole: newAnn.targetRole,
        title: 'New Announcement: ' + newAnn.title,
        message: newAnn.content.slice(0, 100) + '...',
        category: 'ANNOUNCEMENT',
        actionUrl: '/announcements',
      });
    }

    return newAnn;
  },

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    const list = getStoreItem<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    const existing = list.find((a) => a.id === id);
    if (!existing) throw new Error('Announcement not found');

    const updated: Announcement = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const updatedList = list.map((a) => (a.id === id ? updated : a));
    setStoreItem(STORAGE_KEYS.ANNOUNCEMENTS, updatedList);

    await auditService.logAction({
      action: 'UPDATE',
      tableName: 'announcements',
      recordId: id,
      details: `Updated announcement: "${updated.title}"`,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  },

  async deleteAnnouncement(id: string): Promise<void> {
    const list = getStoreItem<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    const existing = list.find((a) => a.id === id);
    const updated = list.filter((a) => a.id !== id);
    setStoreItem(STORAGE_KEYS.ANNOUNCEMENTS, updated);

    if (existing) {
      await auditService.logAction({
        action: 'DELETE',
        tableName: 'announcements',
        recordId: id,
        details: `Deleted announcement: "${existing.title}"`,
        oldValues: existing,
      });
    }
  },
};
