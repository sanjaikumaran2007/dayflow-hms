import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SalarySlipModal } from '../components/ui/SalarySlipModal';
import {
  Clock,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Receipt,
  DollarSign,
  Briefcase,
  Building2,
  Calendar,
  ArrowRight,
  PlusCircle,
  FileText,
  Megaphone,
  Sparkles,
} from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import { leaveService } from '../services/leaveService';
import { salaryService } from '../services/salaryService';
import { announcementService } from '../services/announcementService';
import {
  AttendanceRecord,
  LeaveBalance,
  LeaveRequest,
  SalaryStructure,
  SalarySlip,
  Announcement,
} from '../types/hrms';

export const EmployeeDashboard: React.FC = () => {
  const { user, employeeProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [salaryStructure, setSalaryStructure] = useState<SalaryStructure | null>(null);
  const [latestSalarySlip, setLatestSalarySlip] = useState<SalarySlip | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
  const [isCheckAction, setIsCheckAction] = useState(false);
  const [checkInRemark, setCheckInRemark] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const employeeId = user?.employeeId || employeeProfile?.id || 'emp-101';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [todayAtt, balance, requests, structure, slips, anns] = await Promise.all([
        attendanceService.getTodayRecordForEmployee(employeeId),
        leaveService.getLeaveBalance(employeeId),
        leaveService.getLeaveRequests({ employeeId }),
        salaryService.getStructureByEmployeeId(employeeId),
        salaryService.getSalarySlips(employeeId),
        announcementService.getAnnouncements('EMPLOYEE'),
      ]);

      setTodayAttendance(todayAtt || null);
      setLeaveBalance(balance);
      const safeRequests = Array.isArray(requests) ? requests : [];
      const safeSlips = Array.isArray(slips) ? slips : [];
      const safeAnns = Array.isArray(anns) ? anns : [];
      setPendingLeaves(safeRequests.filter((r) => r && r.status === 'PENDING'));
      setSalaryStructure(structure || null);
      setLatestSalarySlip(safeSlips[0] || null);
      setAnnouncements(safeAnns.slice(0, 3));
    } catch (err) {
      console.error('Failed to load employee dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [employeeId]);

  const handleCheckIn = async () => {
    setIsCheckAction(true);
    try {
      const record = await attendanceService.checkIn({
        employeeId,
        remarks: checkInRemark || 'Checked in via Employee Dashboard',
      });
      setTodayAttendance(record);
      setCheckInRemark('');
      showToast(`Checked in successfully at ${record.checkIn}!`, 'success', 'Attendance Recorded');
    } catch (err: any) {
      showToast(err.message || 'Check-in failed', 'error');
    } finally {
      setIsCheckAction(false);
    }
  };

  const handleCheckOut = async () => {
    setIsCheckAction(true);
    try {
      const record = await attendanceService.checkOut({
        employeeId,
        remarks: 'Standard shift checkout',
      });
      setTodayAttendance(record);
      showToast(`Checked out successfully at ${record.checkOut} (${record.workingHours} hrs worked)`, 'success', 'Shift Concluded');
    } catch (err: any) {
      showToast(err.message || 'Check-out failed', 'error');
    } finally {
      setIsCheckAction(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading employee workspace..." size="lg" />;
  }

  const profile = employeeProfile || {
    firstName: user?.name?.split(' ')[0] || 'John',
    lastName: user?.name?.split(' ')[1] || 'Doe',
    employeeCode: 'DF-ENG-101',
    jobTitle: 'Staff Full-Stack Architect',
    departmentName: 'Engineering',
    joiningDate: '2024-06-15',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Employee Profile Summary */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-md relative overflow-hidden dark:border-indigo-950">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={
                user?.avatarUrl ||
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
              }
              alt={user?.name || 'Employee'}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/20 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Welcome back, {profile.firstName}!
                </h1>
                <Badge variant="success" size="sm">
                  {profile.status}
                </Badge>
              </div>
              <p className="text-xs text-indigo-200 mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 font-mono">
                  <Briefcase className="w-3.5 h-3.5" />
                  {profile.employeeCode} &bull; {profile.jobTitle}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {profile.departmentName}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {profile.joiningDate}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => navigate('/leave')}
            >
              Apply Leave
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              leftIcon={<Receipt className="w-4 h-4" />}
              onClick={() => navigate('/salary-slips')}
            >
              My Payslips
            </Button>
          </div>
        </div>
      </div>

      {/* Row 1: Today's Check In/Out Widget + Attendance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-In / Check-Out Punch Clock */}
        <Card
          id="card-employee-checkin-clock"
          title="Daily Attendance & Punch Clock"
          subtitle="Record your shift arrival and departure timestamps"
          className="lg:col-span-1"
        >
          <div className="flex flex-col items-center justify-center p-4 text-center">
            {/* Live Clock Display */}
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mb-1">
              {currentTime}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>

            {/* Attendance Status Badge */}
            {todayAttendance?.checkIn ? (
              <div className="w-full space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Checked In: {todayAttendance.checkIn}
                    </span>
                    <Badge status={todayAttendance.status} size="sm">
                      {todayAttendance.status}
                    </Badge>
                  </div>
                  {todayAttendance.checkOut && (
                    <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800 flex justify-between font-mono">
                      <span>Checked Out: {todayAttendance.checkOut}</span>
                      <span>Total: {todayAttendance.workingHours} hrs</span>
                    </div>
                  )}
                </div>

                {!todayAttendance.checkOut && (
                  <Button
                    id="employee-checkout-btn"
                    variant="danger"
                    size="lg"
                    className="w-full"
                    onClick={handleCheckOut}
                    isLoading={isCheckAction}
                    leftIcon={<Clock className="w-4 h-4" />}
                  >
                    Check Out Now
                  </Button>
                )}
              </div>
            ) : (
              <div className="w-full space-y-3">
                <input
                  type="text"
                  placeholder="Optional shift notes / location..."
                  value={checkInRemark}
                  onChange={(e) => setCheckInRemark(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
                <Button
                  id="employee-checkin-btn"
                  variant="success"
                  size="lg"
                  className="w-full"
                  onClick={handleCheckIn}
                  isLoading={isCheckAction}
                  leftIcon={<Clock className="w-4 h-4" />}
                >
                  Check In for Shift
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Attendance Statistics Metrics */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-2 gap-4">
          <StatCard
            id="emp-stat-present"
            title="Present Days (Month)"
            value="18 Days"
            icon={<CheckCircle2 className="w-5 h-5" />}
            iconBgColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
            subtext="94.7% Attendance Rate"
          />

          <StatCard
            id="emp-stat-hours"
            title="Logged Hours"
            value="152.5 hrs"
            icon={<Clock className="w-5 h-5" />}
            iconBgColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
            subtext="Avg 8.4 hrs/day"
          />

          <StatCard
            id="emp-stat-leaves-taken"
            title="Leaves Used (YTD)"
            value={`${(leaveBalance?.paidLeaveUsed || 0) + (leaveBalance?.sickLeaveUsed || 0)} Days`}
            icon={<CalendarCheck className="w-5 h-5" />}
            iconBgColor="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
            subtext={`${leaveBalance?.paidLeaveRemaining || 0} Paid Days Remaining`}
            onClick={() => navigate('/leave')}
          />

          <StatCard
            id="emp-stat-net-salary"
            title="Current Net Salary"
            value={`$${(salaryStructure?.netSalary || 11000).toLocaleString()}`}
            icon={<DollarSign className="w-5 h-5" />}
            iconBgColor="bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400"
            subtext="Monthly Take-Home"
            onClick={() => navigate('/salary-slips')}
          />
        </div>
      </div>

      {/* Row 2: Leave Balances & Pending Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Balances Grid */}
        <Card
          id="card-leave-balances"
          title="My Leave Balances (2026)"
          subtitle="Track your available, utilized, and remaining quota"
          className="lg:col-span-2"
          headerAction={
            <Button size="sm" variant="ghost" onClick={() => navigate('/leave')}>
              Leave History
            </Button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Paid Leave */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 dark:bg-slate-800/40 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  Paid Annual Leave
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {leaveBalance?.paidLeaveTotal || 18} Total
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {leaveBalance?.paidLeaveRemaining ?? 12}
                </span>
                <span className="text-xs text-slate-500">days available</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-2 dark:border-slate-700">
                <span>Used: {leaveBalance?.paidLeaveUsed || 0}</span>
                <span>Pending: {leaveBalance?.paidLeavePending || 0}</span>
              </div>
            </div>

            {/* Sick Leave */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 dark:bg-slate-800/40 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                  Sick & Medical Leave
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {leaveBalance?.sickLeaveTotal || 10} Total
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {leaveBalance?.sickLeaveRemaining ?? 9}
                </span>
                <span className="text-xs text-slate-500">days available</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-2 dark:border-slate-700">
                <span>Used: {leaveBalance?.sickLeaveUsed || 0}</span>
                <span>Pending: {leaveBalance?.sickLeavePending || 0}</span>
              </div>
            </div>

            {/* Casual Leave */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 dark:bg-slate-800/40 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Casual Short Leave
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {leaveBalance?.casualLeaveTotal || 6} Total
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {leaveBalance?.casualLeaveRemaining ?? 4}
                </span>
                <span className="text-xs text-slate-500">days available</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-2 dark:border-slate-700">
                <span>Used: {leaveBalance?.casualLeaveUsed || 0}</span>
                <span>Unpaid: {leaveBalance?.unpaidLeaveUsed || 0}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Pending Requests / Latest Payslip */}
        <Card
          id="card-pending-leaves"
          title="Pending Leave Status"
          subtitle="Submissions awaiting HR review"
        >
          {pendingLeaves.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No pending leave requests.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {pendingLeaves.map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-xs dark:bg-amber-950/30 dark:border-amber-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 dark:text-amber-200">
                      {req.leaveType} Leave ({req.totalDays} days)
                    </span>
                    <Badge status={req.status} size="sm">
                      {req.status}
                    </Badge>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1 line-clamp-2">
                    {req.reason}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-500 flex justify-between font-mono">
                    <span>{req.startDate} &rarr; {req.endDate}</span>
                    <span>Applied: {req.appliedDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {latestSalarySlip && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Latest Disbursed Payslip
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                    {latestSalarySlip.payPeriod} &bull; ${latestSalarySlip.netSalary.toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<FileText className="w-3.5 h-3.5" />}
                  onClick={() => setSelectedSlip(latestSalarySlip)}
                >
                  View Slip
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Row 3: Company Announcements */}
      <Card
        id="card-employee-announcements"
        title="Company Announcements & Notice Board"
        subtitle="Important updates from HR leadership and executive management"
        headerAction={
          <Button size="sm" variant="ghost" onClick={() => navigate('/announcements')}>
            View All
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              onClick={() => navigate('/announcements')}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                  {ann.title}
                </h4>
                <Badge variant={ann.priority === 'HIGH' ? 'danger' : 'info'} size="sm">
                  {ann.priority}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                {ann.content}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                <span>By {ann.authorName}</span>
                <span>{ann.publishDate}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Salary Slip Modal */}
      <SalarySlipModal
        slip={selectedSlip}
        isOpen={Boolean(selectedSlip)}
        onClose={() => setSelectedSlip(null)}
      />
    </div>
  );
};
