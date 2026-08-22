import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Announcement, AnnouncementPriority, TargetAudience } from '../types/hrms';
import { announcementService } from '../services/announcementService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Megaphone,
  Plus,
  Calendar,
  User,
  AlertCircle,
  Tag,
  Search,
} from 'lucide-react';

export const Announcements: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    priority: 'MEDIUM',
    targetAudience: 'ALL',
    category: 'General',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isHRorAdmin = role === 'ADMIN' || role === 'HR';

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const list = await announcementService.getAnnouncements(role || undefined);
      setAnnouncements(Array.isArray(list) ? list : []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load announcements', 'error');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      showToast('Title and Content are required', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await announcementService.createAnnouncement({
        ...formData,
        authorName: user?.name || 'HR Team',
      });
      setAnnouncements((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
      showToast('Announcement broadcasted successfully to staff', 'success', 'Notice Published');
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to publish announcement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeAnnouncements = Array.isArray(announcements) ? announcements : [];
  const filteredAnnouncements = safeAnnouncements.filter(
    (a) =>
      a &&
      ((a.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((a as any).category && (a as any).category.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Company Bulletins & Announcements
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Stay informed with corporate broadcasts, policy adjustments, and executive memos.
          </p>
        </div>

        {isHRorAdmin && (
          <Button
            id="create-announcement-btn"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setFormData({
                title: '',
                content: '',
                priority: 'MEDIUM',
                targetAudience: 'ALL',
                category: 'General',
              });
              setIsModalOpen(true);
            }}
          >
            Post Announcement
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          id="announcement-search-input"
          type="text"
          placeholder="Search broadcasts, memos, or categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white text-black font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-black"
        />
      </div>

      {/* Announcements List / Cards */}
      {loading ? (
        <LoadingSpinner message="Loading bulletins..." />
      ) : filteredAnnouncements.length === 0 ? (
        <EmptyState
          title="No announcements published"
          description="Company notices and holidays updates will be displayed here."
          actionLabel={isHRorAdmin ? 'Post Notice' : undefined}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                      <Megaphone className="w-4 h-4" />
                    </span>
                    <Badge variant={ann.priority === 'HIGH' ? 'danger' : 'info'} size="sm">
                      {ann.priority} PRIORITY
                    </Badge>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                    Audience: {ann.targetAudience}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                  {ann.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed whitespace-pre-line">
                  {ann.content}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                  <User className="w-3.5 h-3.5" />
                  {ann.authorName}
                </span>

                <span className="flex items-center gap-1.5 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  {ann.publishDate}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Announcement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Broadcast New Announcement"
        description="Publish organization-wide notices, policy updates, and holiday calendars."
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              id="save-announcement-btn"
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              Publish Broadcast
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="ann-form-title"
            label="Announcement Title *"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Labor Day Company Holiday Schedule"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Priority Level
              </label>
              <select
                id="ann-form-priority"
                value={formData.priority || 'MEDIUM'}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as AnnouncementPriority })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High (Urgent)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Target Audience
              </label>
              <select
                id="ann-form-audience"
                value={formData.targetAudience || 'ALL'}
                onChange={(e) =>
                  setFormData({ ...formData, targetAudience: e.target.value as TargetAudience })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              >
                <option value="ALL">Entire Organization (All)</option>
                <option value="EMPLOYEE">Employees Only</option>
                <option value="HR">HR Team</option>
                <option value="ADMIN">Executive / Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Notice Content *
            </label>
            <textarea
              id="ann-form-content"
              rows={4}
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Detailed message or policy description..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
