import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { NotificationItem } from '../types/hrms';
import { notificationService } from '../services/notificationService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Bell,
  CheckCircle2,
  CalendarCheck,
  DollarSign,
  Megaphone,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const Notifications: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const list = await notificationService.getNotifications(user?.id, role || undefined);
      setNotifications(list);
    } catch (err: any) {
      showToast(err.message || 'Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user, role]);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('All notifications marked as read', 'info');
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await notificationService.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'LEAVE':
        return <CalendarCheck className="w-5 h-5 text-amber-500" />;
      case 'PAYROLL':
        return <DollarSign className="w-5 h-5 text-emerald-500" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-5 h-5 text-indigo-500" />;
      case 'ATTENDANCE':
        return <Clock className="w-5 h-5 text-sky-500" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-500" />;
    }
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter((n) => n && !n.isRead).length;

  const tabs = [
    { id: 'ALL', label: 'All Notifications', count: safeNotifications.length },
    { id: 'UNREAD', label: 'Unread', count: unreadCount },
    { id: 'LEAVE', label: 'Leaves' },
    { id: 'PAYROLL', label: 'Payroll' },
    { id: 'ANNOUNCEMENT', label: 'Bulletins' },
  ];

  const filteredNotifications = safeNotifications.filter((n) => {
    if (!n) return false;
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UNREAD') return !n.isRead;
    return n.category === activeTab || (n as any).type === activeTab;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Notifications & Alerts Feed
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time workflow alerts, leave review status updates, and payroll receipts.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            id="mark-all-read-page-btn"
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
          >
            Mark All Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Feed List */}
      {loading ? (
        <LoadingSpinner message="Retrieving notification feed..." />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          title="No notifications in this category"
          description="You are completely up to date."
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                !n.isRead
                  ? 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/60 dark:bg-indigo-950/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
              }`}
            >
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs shrink-0 mt-0.5">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {n.title}
                    </h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {n.createdAt}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {n.message}
                </p>

                {n.actionUrl && (
                  <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    <span>Take action</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
