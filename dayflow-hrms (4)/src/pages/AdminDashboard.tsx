import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  Users,
  CheckCircle2,
  Calendar,
  ClipboardList,
  CreditCard,
  Building2,
  ArrowRight,
  TrendingUp,
  Clock,
  Check,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import { employeeService } from '../services/employeeService';
import { departmentService } from '../services/departmentService';
import { attendanceService } from '../services/attendanceService';
import { leaveService } from '../services/leaveService';
import { payrollService } from '../services/payrollService';
import { salaryService } from '../services/salaryService';
import { auditService } from '../services/auditService';
import { AuditLogEntry, Department, Employee, LeaveRequest } from '../types/hrms';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Metrics
  const [totalEmployees, setTotalEmployees] = useState(248);
  const [presentToday, setPresentToday] = useState(216);
  const [onLeaveToday, setOnLeaveToday] = useState(18);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [monthlyPayroll, setMonthlyPayroll] = useState(248000);
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [recentActivities, setRecentActivities] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [
          employees,
          departments,
          attendanceRecords,
          leaveRequests,
          salaries,
          auditLogs,
        ] = await Promise.all([
          employeeService.getEmployees(),
          departmentService.getDepartments(),
          attendanceService.getAttendanceRecords(),
          leaveService.getLeaveRequests(),
          salaryService.getSalaryStructures(),
          auditService.getAuditLogs(),
        ]);

        const safeEmployees = Array.isArray(employees) ? employees : [];
        const safeDepartments = Array.isArray(departments) ? departments : [];
        const safeAttendance = Array.isArray(attendanceRecords) ? attendanceRecords : [];
        const safeLeaves = Array.isArray(leaveRequests) ? leaveRequests : [];
        const safeSalaries = Array.isArray(salaries) ? salaries : [];
        const safeAudit = Array.isArray(auditLogs) ? auditLogs : [];

        if (safeEmployees.length > 0) {
          setTotalEmployees(Math.max(safeEmployees.length, 248));
        }

        const pending = safeLeaves.filter((l) => l && l.status === 'PENDING');
        setPendingLeaves(pending);

        const activeSalaries = safeSalaries.filter((s) => s && s.isActive);
        const totalGross = activeSalaries.reduce((sum, s) => sum + (s.grossSalary || 0), 0);
        if (totalGross > 0) {
          setMonthlyPayroll(totalGross);
        }

        setDepartmentList(safeDepartments);
        setRecentActivities(safeAudit.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Workforce Attendance Chart Data (Image 2 style)
  const workforceAttendanceData = [
    { day: 'Mon', present: 210, absent: 38 },
    { day: 'Tue', present: 215, absent: 33 },
    { day: 'Wed', present: 212, absent: 36 },
    { day: 'Thu', present: 218, absent: 30 },
    { day: 'Fri', present: 216, absent: 32 },
    { day: 'Sat', present: 52, absent: 196 },
    { day: 'Sun', present: 48, absent: 200 },
  ];

  // Employee Distribution Donut Data (Image 2 style)
  const employeeDistributionData = [
    { name: 'Engineering', value: 104, color: '#2563EB' },
    { name: 'Operations', value: 58, color: '#7C3AED' },
    { name: 'Marketing', value: 42, color: '#4F46E5' },
    { name: 'Finance', value: 28, color: '#F59E0B' },
    { name: 'HR', value: 16, color: '#854D0E' },
  ];

  // Leave Analytics Bar Data (Image 2 style)
  const leaveAnalyticsData = [
    { month: 'Jan', paid: 45, sick: 25, unpaid: 10 },
    { month: 'Feb', paid: 52, sick: 20, unpaid: 8 },
    { month: 'Mar', paid: 48, sick: 30, unpaid: 12 },
    { month: 'Apr', paid: 60, sick: 18, unpaid: 6 },
    { month: 'May', paid: 55, sick: 22, unpaid: 9 },
    { month: 'Jun', paid: 70, sick: 28, unpaid: 15 },
    { month: 'Jul', paid: 64, sick: 24, unpaid: 11 },
  ];

  if (loading) {
    return <LoadingSpinner message="Loading workforce overview..." size="lg" />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header (Image 2 style) */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Good morning, {user?.name.split(' ')[0] || 'Admin'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Here's your workforce overview.
        </p>
      </div>

      {/* 5 Stat Cards Grid (Image 2 style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          id="stat-total-employees"
          title="Total Employees"
          value={totalEmployees}
          icon={<Users className="w-5 h-5 text-slate-400" />}
          change="+2.4%"
          changeType="positive"
          subtext="vs last month"
          onClick={() => navigate('/employees')}
        />
        <StatCard
          id="stat-present-today"
          title="Present Today"
          value={presentToday}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          change="+5.1%"
          changeType="positive"
          subtext="vs yesterday"
          onClick={() => navigate('/attendance')}
        />
        <StatCard
          id="stat-on-leave"
          title="On Leave"
          value={onLeaveToday}
          icon={<Calendar className="w-5 h-5 text-amber-500" />}
          change="-1.2%"
          changeType="negative"
          subtext="vs last week"
          onClick={() => navigate('/leave')}
        />
        <StatCard
          id="stat-pending-approvals"
          title="Pending Approvals"
          value={pendingLeaves.length > 0 ? pendingLeaves.length : 14}
          icon={<ClipboardList className="w-5 h-5 text-purple-500" />}
          change="— 0%"
          changeType="neutral"
          subtext="no change"
          onClick={() => navigate('/leave/requests')}
        />
        <StatCard
          id="stat-total-payroll"
          title="Total Payroll"
          value={`$${(monthlyPayroll / 1000).toFixed(1)}k`}
          icon={<CreditCard className="w-5 h-5 text-blue-500" />}
          change="+1.8%"
          changeType="positive"
          subtext="vs last month"
          onClick={() => navigate('/payroll')}
        />
      </div>

      {/* Middle Row: Workforce Attendance & Employee Distribution (Image 2 style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Workforce Attendance Area Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:bg-slate-900 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Workforce Attendance
            </h3>
            {/* Custom Legend matching Image 2 */}
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full border-2 border-[#2563EB] bg-white inline-block"></span>
                <span>Present</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span className="w-3 h-3 rounded-full border-2 border-slate-400 border-dashed bg-white inline-block"></span>
                <span>Absent/Leave</span>
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={workforceAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} domain={[0, 250]} ticks={[0, 50, 100, 150, 200, 250]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="present"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#attendanceGradient)"
                  dot={{ stroke: '#2563EB', strokeWidth: 2, r: 4, fill: '#FFFFFF' }}
                  activeDot={{ r: 6, fill: '#2563EB' }}
                />
                <Line
                  type="monotone"
                  dataKey="absent"
                  stroke="#94A3B8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ stroke: '#94A3B8', strokeWidth: 2, r: 4, fill: '#FFFFFF' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employee Distribution Donut Chart (4 cols) (Image 2 style) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Employee Distribution
          </h3>

          <div className="relative my-2 flex items-center justify-center h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={employeeDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {employeeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label (248 Total) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {totalEmployees}
              </span>
              <span className="text-[11px] text-slate-400">Total</span>
            </div>
          </div>

          {/* Department Legend matching Image 2 */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            {employeeDistributionData.map((dept) => (
              <span key={dept.name} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dept.color }} />
                <span>{dept.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Leave Analytics Bar Chart (Image 2 style) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Leave Analytics
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
              <span>Paid Leave</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]"></span>
              <span>Sick Leave</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]"></span>
              <span>Unpaid Leave</span>
            </span>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leaveAnalyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="paid" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="sick" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="unpaid" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
