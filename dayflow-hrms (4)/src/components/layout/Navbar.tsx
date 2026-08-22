import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Search,
  CheckCircle2,
  LogOut,
  UserCircle,
  Settings,
  Clock,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { UserRole, NotificationItem, AttendanceRecord } from '../../types/hrms';
import { notificationService } from '../../services/notificationService';
import { attendanceService } from '../../services/attendanceService';

interface NavbarProps {
  onMobileMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMobileMenuClick }) => {
  const { user, role, switchRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const list = await notificationService.getNotifications(user.id, role || undefined);
      setNotifications(Array.isArray(list) ? list : []);
    } catch {
      setNotifications([]);
    }
  };

  const loadTodayAttendance = async () => {
    if (!user?.employeeId) return;
    try {
      const att = await attendanceService.getTodayRecordForEmployee(user.employeeId);
      setTodayAttendance(att || null);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    loadTodayAttendance();
  }, [user, role]);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter((n) => n && !n.isRead).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (q.includes('emp') || q.includes('staff') || q.includes('dir')) navigate('/employees');
    else if (q.includes('dept')) navigate('/departments');
    else if (q.includes('att') || q.includes('clock')) navigate('/attendance');
    else if (q.includes('leave') || q.includes('vacation')) navigate('/leave');
    else if (q.includes('pay') || q.includes('salary')) navigate('/payroll');
    else if (q.includes('slip') || q.includes('payslip')) navigate('/salary-slips');
    else if (q.includes('announc')) navigate('/announcements');
    else if (q.includes('audit') || q.includes('log')) navigate('/audit-logs');
    else navigate('/employees');
  };

  const handleQuickCheckIn = async () => {
    if (!user?.employeeId) {
      showToast('No linked employee ID found for this account', 'warning');
      return;
    }
    setIsChecking(true);
    try {
      const updated = await attendanceService.checkIn({ employeeId: user.employeeId });
      setTodayAttendance(updated);
      showToast(`Checked in successfully at ${updated.checkIn}!`, 'success', 'Attendance Marked');
    } catch (err: any) {
      showToast(err.message || 'Check-in failed', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleQuickCheckOut = async () => {
    if (!user?.employeeId) return;
    setIsChecking(true);
    try {
      const updated = await attendanceService.checkOut({ employeeId: user.employeeId });
      setTodayAttendance(updated);
      showToast(`Checked out successfully at ${updated.checkOut}`, 'success', 'Shift Completed');
    } catch (err: any) {
      showToast(err.message || 'Check-out failed', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('All notifications marked as read', 'info');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#EAEDF1] bg-white px-4 sm:px-8 shrink-0 dark:border-slate-800 dark:bg-slate-900 transition-colors">
      {/* Left: Mobile trigger & Portal Brand / Search */}
      <div className="flex items-center gap-4 min-w-0 flex-1 max-w-xl">
        <button
          id="mobile-menu-trigger"
          onClick={onMobileMenuClick}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Text from Image 1: "HR Connect" */}
        <span className="hidden sm:inline-block font-semibold text-[#1A202C] text-sm dark:text-white shrink-0">
          HR Connect
        </span>

        {/* Search Bar pill styled matching Image 1 & 3 */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="global-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees, policies..."
              className="w-full bg-[#F8F9FA] hover:bg-[#F1F3F5] focus:bg-white text-xs text-black font-medium placeholder-slate-500 rounded-full pl-9 pr-4 py-2 border border-slate-300 focus:border-[#2563EB] focus:outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-black dark:placeholder-slate-400"
            />
          </div>
        </form>
      </div>

      {/* Right: Actions & User Icons (Image 2 & 3 style) */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Quick Check-in / Out action */}
        {user?.employeeId && (
          <div className="hidden md:flex items-center">
            {todayAttendance?.checkIn ? (
              todayAttendance.checkOut ? (
                <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Out ({todayAttendance.workingHours}h)</span>
                </span>
              ) : (
                <button
                  id="navbar-checkout-btn"
                  onClick={handleQuickCheckOut}
                  disabled={isChecking}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-xs transition-colors cursor-pointer"
                  title="Check Out"
                >
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>Check Out ({currentTime})</span>
                </button>
              )
            ) : (
              <button
                id="navbar-checkin-btn"
                onClick={handleQuickCheckIn}
                disabled={isChecking}
                className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full bg-[#2563EB] hover:bg-blue-700 text-white font-medium shadow-xs transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Check In</span>
              </button>
            )}
          </div>
        )}

        {/* Demo Role Switcher Pill */}
        <div className="hidden lg:flex items-center bg-[#F1F3F5] dark:bg-slate-800 p-0.5 rounded-lg text-xs">
          {(['ADMIN', 'HR', 'EMPLOYEE'] as UserRole[]).map((r) => (
            <button
              key={r}
              id={`quick-role-${r.toLowerCase()}`}
              onClick={() => switchRole(r)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                role === r
                  ? 'bg-white dark:bg-slate-900 text-[#2563EB] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {r === 'ADMIN' ? 'Admin' : r === 'HR' ? 'HR' : 'Employee'}
            </button>
          ))}
        </div>

        {/* Notifications Icon (Image 2 style) */}
        <div className="relative">
          <button
            id="notifications-menu-btn"
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowProfileMenu(false);
            }}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors relative cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 stroke-[1.75]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2563EB] rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showNotifMenu && (
            <div
              id="notifications-popover"
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-50 dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-1"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    id="mark-all-read-btn"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-[#2563EB] hover:text-blue-700 cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {safeNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  safeNotifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={async () => {
                        await notificationService.markAsRead(n.id);
                        setNotifications((prev) =>
                          (Array.isArray(prev) ? prev : []).map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
                        );
                        if (n.actionUrl) {
                          navigate(n.actionUrl);
                          setShowNotifMenu(false);
                        }
                      }}
                      className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                        !n.isRead ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {n.createdAt.substring(11, 16)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-100 p-2 text-center bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifMenu(false)}
                  className="text-xs font-medium text-[#2563EB] hover:text-blue-700"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Help Circle Icon (Image 2 & 3 style) */}
        <Link
          to="/settings"
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
          title="Help & Support"
        >
          <HelpCircle className="w-5 h-5 stroke-[1.75]" />
        </Link>

        {/* User Profile Avatar / Icon (Image 2 & 3 style) */}
        {user && (
          <div className="relative">
            <button
              id="navbar-profile-btn"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifMenu(false);
              }}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200 flex items-center justify-center text-xs font-semibold dark:bg-slate-800 dark:text-slate-200">
                  <UserCircle className="w-5 h-5" />
                </div>
              )}
            </button>

            {showProfileMenu && (
              <div
                id="profile-dropdown-menu"
                className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-50 dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-1"
              >
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  <span className="mt-1.5 inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {role}
                  </span>
                </div>

                <div className="p-1">
                  <Link
                    to="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                  >
                    <UserCircle className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Settings</span>
                  </Link>
                </div>

                <div className="p-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    id="navbar-logout-btn"
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
