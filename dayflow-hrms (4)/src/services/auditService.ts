import { AuditLogEntry, AuditAction, UserRole } from '../types/hrms';
import { getStoreItem, setStoreItem, STORAGE_KEYS, apiClient } from './api';
import { INITIAL_AUDIT_LOGS } from '../data/mockData';

export const auditService = {
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.get('/audit-logs');
        return response.data;
      } catch (err) {
        console.warn('Backend getAuditLogs failed, using local store', err);
      }
    }
    const list = getStoreItem<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    return Array.isArray(list) ? list : [...INITIAL_AUDIT_LOGS];
  },

  async logAction(params: {
    action: AuditAction;
    tableName: string;
    recordId: string;
    details: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
  }): Promise<AuditLogEntry> {
    const storedUserStr = localStorage.getItem('dayflow_current_user');
    let userId = 'usr-admin-1';
    let userName = 'System Administrator';
    let userRole: UserRole = 'ADMIN';

    if (storedUserStr) {
      try {
        const u = JSON.parse(storedUserStr);
        userId = u.id || userId;
        userName = u.name || userName;
        userRole = u.role || userRole;
      } catch {
        // ignore
      }
    }

    const log: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      userName,
      userRole,
      action: params.action,
      tableName: params.tableName,
      recordId: params.recordId,
      ipAddress: '192.168.1.' + Math.floor(10 + Math.random() * 200),
      details: params.details,
      oldValues: params.oldValues,
      newValues: params.newValues,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        await apiClient.post('/audit-logs', log);
      } catch {
        // ignore
      }
    }

    const logs = getStoreItem<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    const updated = [log, ...logs];
    setStoreItem(STORAGE_KEYS.AUDIT_LOGS, updated);

    return log;
  },
};
