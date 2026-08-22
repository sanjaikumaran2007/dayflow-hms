import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  CalendarCheck,
  ClipboardList,
  DollarSign,
  FileSpreadsheet,
  Receipt,
  Bell,
  Megaphone,
  ShieldAlert,
  UserCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  HelpCircle,
  Waves,
} from 'lucide-react';
import { leaveService } from '../../services/leaveService';
import { notificationService } from '../../services/notificationService';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        if (role === 'ADMIN' || role === 'HR') {
          const leaves = await leaveService.getLeaveRequests({ status: 'PENDING' });
          setPendingLeaveCount(Array.isArray(leaves) ? leaves.length : 0);
        }
        const notifs = await notificationService.getNotifications(user?.id, role || undefined);
        setUnreadNotifCount(Array.isArray(notifs) ? notifs.filter((n) => n && !n.isRead).length : 0);
      } catch (err) {
        // ignore
      }
    };
    fetchBadges();
  }, [role, user, location.pathname]);

  const getDashboardPath = () => {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'HR') return '/hr/dashboard';
    return '/employee/dashboard';
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: getDashboardPath(),
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ['ADMIN', 'HR', 'EMPLOYEE'],
    },
    {
      label: 'Directory',
      path: '/employees',
      icon: <Users className="w-4 h-4" />,
      roles: ['ADMIN', 'HR'],
    },
    {
      label: 'Departments',
      path: '/departments',
      icon: <Building2 className="w-4 h-4" />,
      roles: ['ADMIN', 'HR'],
    },
    {
      label: 'Attendance',
      path: '/attendance',
      icon: <Clock className="w-4 h-4" />,
      roles: ['ADMIN', 'HR', 'EMPLOYEE'],
    },
    {
      label: 'Leave Management',
      path: '/leave',
      icon: <CalendarCheck className="w-4 h-4" />,
      roles: ['ADMIN', 'HR', 'EMPLOYEE'],
      badge: pendingLeaveCount > 0 && role !== 'EMPLOYEE' ? pendingLeaveCount : undefined,
      badgeColor: 'bg-[#2563EB] text-white',
    },
    {
      label: 'Leave Approvals',
      path: '/leave/requests',
      icon: <ClipboardList className="w-4 h-4" />,
      roles: ['ADMIN', 'HR'],
      badge: pendingLeaveCount > 0 ? pendingLeaveCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      label: 'Payroll',
      path: '/payroll',
      icon: <DollarSign className="w-4 h-4" />,
      roles: ['ADMIN', 'HR'],
    },
    {
      label: 'Salary Slips',
      path: '/salary-slips',
      icon: <Receipt className="w-4 h-4" />,
      roles: ['ADMIN', 'HR', 'EMPLOYEE'],
    },
    {
      label: 'Announcements',
      path: '/announcements',
      icon: <Megaphone className="w-4 h-4" />,
      roles: ['ADMIN', 'HR', 'EMPLOYEE'],
    },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: <Bell className="w-4 h-4" />,
      roles: ['ADMIN', 'HR', 'EMPLOYEE'],
      badge: unreadNotifCount > 0 ? unreadNotifCount : undefined,
      badgeColor: 'bg-[#2563EB] text-white',
    },
    {
      label: 'Audit Logs',
      path: '/audit-logs',
      icon: <ShieldAlert className="w-4 h-4" />,
      roles: ['ADMIN'],
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: <UserCircle className="w-4 h-4" />,
      roles: ['ADMIN', 'HR', 'EMPLOYEE'],
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: <Settings className="w-4 h-4" />,
      roles: ['ADMIN', 'HR', 'EMPLOYEE'],
    },
  ];

  const visibleItems = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          id="mobile-sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#1A1E29] text-slate-300 border-r border-[#262C3A] transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-60'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-[#262C3A]/70 shrink-0">
          <div className="flex items-center space-x-3.5 overflow-hidden">
            {/* Blue Rounded App Icon */}
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0">
              <Waves className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold tracking-tight text-white leading-tight">
                  Dayflow
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  HR Premium
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            id="toggle-sidebar-collapse"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#252C3C] transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              id={`nav-${item.path.replace(/\//g, '-').replace(/^-/, '') || 'home'}`}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all group relative ${
                  isActive
                    ? 'bg-[#232938] text-[#4A72FF] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#222836]'
                } ${collapsed ? 'justify-center px-2' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>

              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}

              {!collapsed && item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                    item.badgeColor || 'bg-[#2563EB] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {collapsed && item.badge !== undefined && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section: Support & Sign Out */}
        <div className="p-3 border-t border-[#262C3A]/70 shrink-0 space-y-1">
          <NavLink
            to="/settings"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-[#222836] transition-colors"
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Support</span>}
          </NavLink>

          <button
            id="sidebar-logout-btn"
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-[#222836] transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>

          {/* User Profile Card at bottom (Image 1 & 2 style) */}
          {user && !collapsed && (
            <div className="pt-2 mt-2 border-t border-[#262C3A]/60 flex items-center space-x-3 px-2 py-1.5">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#2563EB] ring-1 ring-blue-400/40 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {role === 'ADMIN' ? 'HR Director' : role === 'HR' ? 'HR Manager' : 'Team Member'}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
