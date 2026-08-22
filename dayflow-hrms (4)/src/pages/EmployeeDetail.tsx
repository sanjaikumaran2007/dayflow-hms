import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Employee,
  AttendanceRecord,
  LeaveRequest,
  LeaveBalance,
  SalaryStructure,
  SalarySlip,
} from '../types/hrms';
import { employeeService } from '../services/employeeService';
import { attendanceService } from '../services/attendanceService';
import { leaveService } from '../services/leaveService';
import { salaryService } from '../services/salaryService';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SalarySlipModal } from '../components/ui/SalarySlipModal';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  CreditCard,
  Receipt,
  Clock,
  CalendarCheck,
  FileSpreadsheet,
  Edit2,
  ShieldCheck,
} from 'lucide-react';

export const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { showToast } = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [salaryStructure, setSalaryStructure] = useState<SalaryStructure | null>(null);
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const emp = await employeeService.getEmployeeById(id);
        if (!emp) {
          showToast('Employee not found', 'error');
          navigate('/employees');
          return;
        }
        setEmployee(emp);

        const [attList, leaveList, balance, struct, slips] = await Promise.all([
          attendanceService.getAttendanceRecords({ employeeId: id }),
          leaveService.getLeaveRequests({ employeeId: id }),
          leaveService.getLeaveBalance(id),
          salaryService.getStructureByEmployeeId(id),
          salaryService.getSalarySlips(id),
        ]);

        setAttendance(attList);
        setLeaves(leaveList);
        setLeaveBalance(balance);
        setSalaryStructure(struct || null);
        setSalarySlips(slips);
      } catch (err: any) {
        showToast(err.message || 'Error loading employee details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeDetails();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Retrieving employee profile record..." size="lg" />;
  }

  if (!employee) {
    return <div className="p-8 text-center">Employee not found.</div>;
  }

  const tabs = [
    { id: 'overview', label: 'Overview & Profile' },
    { id: 'attendance', label: 'Attendance History', count: attendance.length },
    { id: 'leave', label: 'Leave & Time-Off', count: leaves.length },
    { id: 'salary', label: 'Compensation & Structure' },
    { id: 'slips', label: 'Salary Slips', count: salarySlips.length },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/employees')}
        >
          Back to Directory
        </Button>
      </div>

      {/* Header Profile Card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={
                employee.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
              }
              alt={employee.firstName}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {employee.firstName} {employee.lastName}
                </h1>
                <Badge status={employee.status} size="sm" dot>
                  {employee.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  {employee.employeeCode}
                </span>
                <span>&bull;</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {employee.jobTitle}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {employee.departmentName}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge status={employee.employmentType} size="md">
              {employee.employmentType.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* General Information */}
          <Card title="Personal & Contact Details">
            <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">Full Name</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {employee.firstName} {employee.lastName}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">Work Email</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-300">
                  {employee.email}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">Contact Number</dt>
                <dd className="font-mono text-slate-700 dark:text-slate-300">
                  {employee.phone || 'N/A'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">Residential Address</dt>
                <dd className="text-right text-slate-700 dark:text-slate-300 max-w-xs">
                  {employee.address || '742 Evergreen Terrace, San Francisco, CA'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">Emergency Contact</dt>
                <dd className="text-slate-700 dark:text-slate-300">
                  {employee.emergencyContact || 'Sarah Vance (+1 555-019-3321)'}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Job & Payroll Quick Summary */}
          <Card title="Organizational & Banking Profile">
            <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">Department</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {employee.departmentName}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">Joining Date</dt>
                <dd className="font-mono text-slate-700 dark:text-slate-300">
                  {employee.joiningDate}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">Disbursement Bank</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-300">
                  {employee.bankName || 'Silicon Valley Commercial Bank'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">Account Number</dt>
                <dd className="font-mono text-slate-700 dark:text-slate-300">
                  {employee.accountNumber || '•••••••• 8821'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">Tax Identification Number</dt>
                <dd className="font-mono text-slate-700 dark:text-slate-300">
                  {employee.taxId || 'TAX-US-991204'}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      )}

      {/* Tab 2: Attendance */}
      {activeTab === 'attendance' && (
        <Card title={`Attendance Logs (${attendance.length} Records)`}>
          <Table
            headers={['Date', 'Check In', 'Check Out', 'Hours', 'Status', 'Remarks']}
          >
            {attendance.map((att) => (
              <tr key={att.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="px-5 py-3 font-mono font-medium text-xs text-slate-900 dark:text-white">
                  {att.date}
                </td>
                <td className="px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                  {att.checkIn || '-'}
                </td>
                <td className="px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                  {att.checkOut || '-'}
                </td>
                <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {att.workingHours || 0} hrs
                </td>
                <td className="px-5 py-3">
                  <Badge status={att.status} size="sm" dot>
                    {att.status}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-xs text-slate-500">
                  {att.remarks || '-'}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {/* Tab 3: Leave */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          {/* Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Paid Annual Leave
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                {leaveBalance?.paidLeaveRemaining || 12} / {leaveBalance?.paidLeaveTotal || 18} Days
              </div>
              <p className="text-xs text-slate-400 mt-1">Used: {leaveBalance?.paidLeaveUsed || 0} days</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
                Sick Leave
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                {leaveBalance?.sickLeaveRemaining || 9} / {leaveBalance?.sickLeaveTotal || 10} Days
              </div>
              <p className="text-xs text-slate-400 mt-1">Used: {leaveBalance?.sickLeaveUsed || 0} days</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Casual Leave
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                {leaveBalance?.casualLeaveRemaining || 4} / {leaveBalance?.casualLeaveTotal || 6} Days
              </div>
              <p className="text-xs text-slate-400 mt-1">Used: {leaveBalance?.casualLeaveUsed || 0} days</p>
            </div>
          </div>

          <Card title="Time-Off Request History">
            <Table
              headers={['Leave Type', 'Duration', 'Days', 'Applied On', 'Status', 'Reason']}
            >
              {leaves.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-semibold text-xs text-slate-900 dark:text-white">
                    {req.leaveType}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                    {req.startDate} &rarr; {req.endDate}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    {req.totalDays}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">
                    {req.appliedDate}
                  </td>
                  <td className="px-5 py-3">
                    <Badge status={req.status} size="sm">
                      {req.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500 max-w-xs truncate">
                    {req.reason}
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      )}

      {/* Tab 4: Compensation & Salary Structure */}
      {activeTab === 'salary' && (
        <div className="space-y-6">
          {salaryStructure ? (
            <Card title="Active Compensation Structure">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Earnings Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
                  <div className="bg-slate-50 px-4 py-2 font-bold text-xs uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Monthly Earnings
                  </div>
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400">Basic Pay</td>
                        <td className="px-4 py-2 text-right font-mono font-bold">${salaryStructure.basicSalary.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400">House Rent Allowance (HRA)</td>
                        <td className="px-4 py-2 text-right font-mono font-bold">${salaryStructure.hra.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400">Special Allowances</td>
                        <td className="px-4 py-2 text-right font-mono font-bold">${salaryStructure.allowances.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400">Performance Bonus</td>
                        <td className="px-4 py-2 text-right font-mono font-bold">${salaryStructure.bonus.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-slate-50 font-bold dark:bg-slate-800">
                        <td className="px-4 py-2.5 text-slate-900 dark:text-white">Gross Salary</td>
                        <td className="px-4 py-2.5 text-right font-mono text-indigo-600 dark:text-indigo-400">
                          ${salaryStructure.grossSalary.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Deductions Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
                  <div className="bg-slate-50 px-4 py-2 font-bold text-xs uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Withholdings & Deductions
                  </div>
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400">Federal & State Tax</td>
                        <td className="px-4 py-2 text-right font-mono font-bold">${salaryStructure.taxDeduction.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400">Health / Life Insurance</td>
                        <td className="px-4 py-2 text-right font-mono font-bold">${salaryStructure.insuranceDeduction.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400">Other Deductions / 401(k)</td>
                        <td className="px-4 py-2 text-right font-mono font-bold">${salaryStructure.otherDeductions.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-slate-50 font-bold dark:bg-slate-800">
                        <td className="px-4 py-2.5 text-slate-900 dark:text-white">Total Deductions</td>
                        <td className="px-4 py-2.5 text-right font-mono text-rose-600 dark:text-rose-400">
                          ${salaryStructure.totalDeductions.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900 flex justify-between items-center">
                <div>
                  <span className="text-xs uppercase font-bold text-indigo-700 dark:text-indigo-300">Net Estimated Monthly Take-Home</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Calculated as: Gross (${salaryStructure.grossSalary.toLocaleString()}) - Deductions (${salaryStructure.totalDeductions.toLocaleString()})</p>
                </div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  ${salaryStructure.netSalary.toLocaleString()}
                </div>
              </div>
            </Card>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
              No salary structure configured for this employee.
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Salary Slips */}
      {activeTab === 'slips' && (
        <Card title="Disbursed Salary Pay Slips">
          {salarySlips.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No payslips generated yet.</div>
          ) : (
            <Table
              headers={[
                'Slip #',
                'Pay Period',
                'Payment Date',
                'Gross',
                'Deductions',
                'Net Disbursed',
                'Action',
              ]}
            >
              {salarySlips.map((slip) => (
                <tr key={slip.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    {slip.slipNumber}
                  </td>
                  <td className="px-5 py-3 font-medium text-xs text-slate-900 dark:text-white">
                    {slip.payPeriod}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">
                    {slip.paymentDate}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                    ${slip.grossSalary.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-rose-600 dark:text-rose-400">
                    ${slip.totalDeductions.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ${slip.netSalary.toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Receipt className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedSlip(slip)}
                    >
                      View Slip
                    </Button>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {/* Salary Slip Modal */}
      <SalarySlipModal
        slip={selectedSlip}
        isOpen={Boolean(selectedSlip)}
        onClose={() => setSelectedSlip(null)}
      />
    </div>
  );
};
