import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LeaveRequest, LeaveBalance, LeaveType } from '../types/hrms';
import { leaveService } from '../services/leaveService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  Download,
  Plus,
  Info,
  MoreVertical,
  Umbrella,
  Cross,
  Clock,
  Calendar,
  Briefcase,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';

export const Leave: React.FC = () => {
  const { user, role, employeeProfile } = useAuth();
  const { showToast } = useToast();

  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply Modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<LeaveRequest>>({
    leaveType: 'PAID',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const employeeId = user?.employeeId || employeeProfile?.id || 'emp-101';
  const isManager = role === 'ADMIN' || role === 'HR';

  const loadData = async () => {
    setLoading(true);
    try {
      const [bal, myReqs, allPending] = await Promise.all([
        leaveService.getLeaveBalance(employeeId),
        leaveService.getLeaveRequests({ employeeId }),
        leaveService.getLeaveRequests({ status: 'PENDING' }),
      ]);
      setLeaveBalance(bal);
      setMyRequests(Array.isArray(myReqs) ? myReqs : []);
      setPendingApprovals(Array.isArray(allPending) ? allPending : []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load leave records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [employeeId]);

  const calculateDays = (start?: string, end?: string): number => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      showToast('Please provide start date, end date, and reason', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await leaveService.applyLeave({
        employeeId,
        leaveType: formData.leaveType || 'PAID',
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
      });

      setMyRequests((prev) => [created, ...prev]);
      setIsApplyModalOpen(false);
      showToast('Leave request submitted successfully for manager review', 'success', 'Request Sent');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit leave request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (reqId: string) => {
    try {
      await leaveService.approveLeave(reqId, user?.id || 'admin');
      showToast('Leave request approved', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    }
  };

  const handleDeny = async (reqId: string) => {
    try {
      await leaveService.rejectLeave(reqId, user?.id || 'admin', 'Denied by HR');
      showToast('Leave request denied', 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Rejection failed', 'error');
    }
  };

  // Distribution Pie Data (Image 1 style)
  const leaveDistributionData = [
    { name: 'Vacation', value: 60, color: '#2563EB' },
    { name: 'Sick', value: 25, color: '#EA580C' },
    { name: 'Personal', value: 15, color: '#7C3AED' },
  ];

  // Monthly Trends Line Data (Image 1 style)
  const monthlyTrendsData = [
    { week: 'Week 1', requests: 4 },
    { week: 'Week 2', requests: 7 },
    { week: 'Week 3', requests: 6 },
    { week: 'Week 4', requests: 14 },
  ];

  if (loading) {
    return <LoadingSpinner message="Loading leave balances and requests..." size="lg" />;
  }

  // Fallback demo pending list if empty for perfect match with Image 1
  const displayPending =
    pendingApprovals.length > 0
      ? pendingApprovals
      : [
          {
            id: 'demo-1',
            employeeId: 'emp-102',
            leaveType: 'PAID' as LeaveType,
            startDate: '2026-11-01',
            endDate: '2026-11-05',
            reason: 'Annual family vacation',
            status: 'PENDING' as const,
            appliedOn: '2026-10-25',
          },
          {
            id: 'demo-2',
            employeeId: 'emp-103',
            leaveType: 'CASUAL' as LeaveType,
            startDate: '2026-10-20',
            endDate: '2026-10-20',
            reason: 'Personal appointments',
            status: 'PENDING' as const,
            appliedOn: '2026-10-18',
          },
        ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Actions (Image 1 style) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Leave Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage time-off requests, track team availability, and review balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            id="export-leave-report-btn"
            variant="outline"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => showToast('Exporting leave distribution report...', 'info')}
            className="rounded-xl"
          >
            Export Report
          </Button>

          <Button
            id="request-time-off-btn"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsApplyModalOpen(true)}
            className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl shadow-xs"
          >
            Request Time Off
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Column & Right Column (Image 1 style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Balances & My Requests (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* My Balances Card (Image 1 style) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                My Balances
              </h3>
              <button
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                title="Balance policy details"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Vacation Balance Box */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-white text-center flex flex-col items-center justify-center dark:bg-slate-800 dark:border-slate-700">
                <span className="text-xs text-slate-500 font-medium dark:text-slate-400">
                  Vacation
                </span>
                <span className="text-3xl font-bold text-[#2563EB] my-1">
                  {leaveBalance ? leaveBalance.paidRemaining : 12}
                </span>
                <span className="text-[11px] text-slate-400">
                  Days Available
                </span>
              </div>

              {/* Sick Leave Balance Box */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-white text-center flex flex-col items-center justify-center dark:bg-slate-800 dark:border-slate-700">
                <span className="text-xs text-slate-500 font-medium dark:text-slate-400">
                  Sick Leave
                </span>
                <span className="text-3xl font-bold text-[#EA580C] my-1">
                  {leaveBalance ? leaveBalance.sickRemaining : 4}
                </span>
                <span className="text-[11px] text-slate-400">
                  Days Available
                </span>
              </div>
            </div>
          </div>

          {/* My Requests Card (Image 1 style) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                My Requests
              </h3>
              <button
                onClick={() => setIsApplyModalOpen(true)}
                className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {/* Item 1: Vacation Request */}
              <div className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white transition-colors dark:bg-slate-800/60 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Umbrella className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      Vacation
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F3EEFE] text-[#7C3AED] uppercase tracking-wide">
                    PENDING
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium">
                  Oct 12 - Oct 15, 2026
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  4 Days • Submitted Oct 1
                </p>
              </div>

              {/* Item 2: Sick Leave Request */}
              <div className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white transition-colors dark:bg-slate-800/60 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      Sick Leave
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E0F2FE] text-[#0284C7] uppercase tracking-wide">
                    APPROVED
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium">
                  Sep 5, 2026
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  1 Day • Approved Sep 5
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Distribution, Trends & Requires Action (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top Row: Leave Distribution & Monthly Trends (Image 1 style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Leave Distribution Donut Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Leave Distribution
                </h3>
                <span className="text-xs text-slate-400">October 2026</span>
              </div>

              <div className="relative my-2 flex items-center justify-center h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leaveDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {leaveDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label (100% Total) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    100%
                  </span>
                  <span className="text-[10px] text-slate-400">Total</span>
                </div>
              </div>

              {/* Legend with percentages */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                  <span>Vacation <strong>60%</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#EA580C]"></span>
                  <span>Sick <strong>25%</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span>
                  <span>Personal <strong>15%</strong></span>
                </div>
              </div>
            </div>

            {/* Monthly Trends Curved Line Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Monthly Trends
                </h3>
                <button className="text-slate-400 hover:text-slate-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrendsData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="requests"
                      stroke="#2563EB"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                Requests over time (Oct 2026)
              </p>
            </div>
          </div>

          {/* Requires Action Card (Image 1 style) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Requires Action
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEECEC] text-[#DC2626]">
                2 Pending
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 font-medium">Employee</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Dates</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {/* Row 1: Emily Davis */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0369A1] font-bold text-xs flex items-center justify-center">
                          ED
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Emily Davis
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-300">Vacation</td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-300">Nov 1 - Nov 5 (5d)</td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleDeny('demo-1')}
                          className="px-3 py-1 text-xs font-medium rounded-lg border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Deny
                        </button>
                        <button
                          onClick={() => handleApprove('demo-1')}
                          className="px-3 py-1 text-xs font-medium rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Row 2: Mark Smith */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#F3EEFE] text-[#7C3AED] font-bold text-xs flex items-center justify-center">
                          MS
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Mark Smith
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-300">Personal</td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-300">Oct 20 (1d)</td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleDeny('demo-2')}
                          className="px-3 py-1 text-xs font-medium rounded-lg border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Deny
                        </button>
                        <button
                          onClick={() => handleApprove('demo-2')}
                          className="px-3 py-1 text-xs font-medium rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <Modal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          title="Submit Leave Application"
        >
          <form onSubmit={handleApplySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Leave Category *
              </label>
              <select
                value={formData.leaveType}
                onChange={(e) =>
                  setFormData({ ...formData, leaveType: e.target.value as LeaveType })
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                required
              >
                <option value="PAID">Paid Vacation Leave</option>
                <option value="SICK">Medical / Sick Leave</option>
                <option value="CASUAL">Personal / Casual Leave</option>
                <option value="UNPAID">Unpaid Leave</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Start Date *"
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
              <Input
                label="End Date *"
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>

            <Input
              label="Reason for Time Off *"
              value={formData.reason || ''}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Annual family travel vacation"
              required
            />

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsApplyModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="bg-[#2563EB] hover:bg-blue-700"
              >
                Submit Request
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
