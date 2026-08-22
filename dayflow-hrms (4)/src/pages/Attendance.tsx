import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AttendanceRecord, Employee, AttendanceStatus } from '../types/hrms';
import { attendanceService } from '../services/attendanceService';
import { employeeService } from '../services/employeeService';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { StatCard } from '../components/ui/StatCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Filter,
  PlusCircle,
  Download,
  Building2,
} from 'lucide-react';

export const Attendance: React.FC = () => {
  const { user, role, employeeProfile } = useAuth();
  const { showToast } = useToast();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Today's record for logged-in user
  const [myTodayRecord, setMyTodayRecord] = useState<AttendanceRecord | null>(null);
  const [isPunching, setIsPunching] = useState(false);
  const [punchRemark, setPunchRemark] = useState('');

  // Manual Attendance Modal (HR/Admin)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState<Partial<AttendanceRecord>>({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:00:00',
    checkOut: '17:30:00',
    status: 'PRESENT',
    remarks: 'Manual entry by HR',
  });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const isHRorAdmin = role === 'ADMIN' || role === 'HR';
  const myEmployeeId = user?.employeeId || employeeProfile?.id || 'emp-101';

  const loadData = async () => {
    setLoading(true);
    try {
      const [attList, empList] = await Promise.all([
        attendanceService.getAttendanceRecords(
          !isHRorAdmin ? { employeeId: myEmployeeId } : undefined
        ),
        employeeService.getEmployees(),
      ]);
      setRecords(Array.isArray(attList) ? attList : []);
      setEmployees(Array.isArray(empList) ? empList : []);

      const myToday = await attendanceService.getTodayRecordForEmployee(myEmployeeId);
      setMyTodayRecord(myToday || null);

      if (Array.isArray(empList) && empList.length > 0 && !manualForm.employeeId) {
        setManualForm((prev) => ({ ...prev, employeeId: empList[0].id }));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load attendance logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, myEmployeeId]);

  const handleCheckIn = async () => {
    setIsPunching(true);
    try {
      const updated = await attendanceService.checkIn({
        employeeId: myEmployeeId,
        remarks: punchRemark || 'Standard check-in',
      });
      setMyTodayRecord(updated);
      setPunchRemark('');
      await loadData();
      showToast(`Checked in at ${updated.checkIn}!`, 'success', 'Attendance Recorded');
    } catch (err: any) {
      showToast(err.message || 'Check-in failed', 'error');
    } finally {
      setIsPunching(false);
    }
  };

  const handleCheckOut = async () => {
    setIsPunching(true);
    try {
      const updated = await attendanceService.checkOut({
        employeeId: myEmployeeId,
        remarks: 'Shift departure',
      });
      setMyTodayRecord(updated);
      await loadData();
      showToast(`Checked out at ${updated.checkOut} (${updated.workingHours} hrs)`, 'success', 'Shift Concluded');
    } catch (err: any) {
      showToast(err.message || 'Check-out failed', 'error');
    } finally {
      setIsPunching(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.employeeId || !manualForm.date) {
      showToast('Employee and Date are required', 'warning');
      return;
    }
    setIsSubmittingManual(true);
    try {
      const emp = employees.find((e) => e.id === manualForm.employeeId);
      const created = await attendanceService.markAttendance({
        ...manualForm,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : undefined,
        employeeCode: emp?.employeeCode,
        departmentName: emp?.departmentName,
      });
      setRecords((prev) => [created, ...prev]);
      showToast(`Attendance record logged for ${emp?.firstName} ${emp?.lastName}`, 'success');
      setIsManualModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to record attendance', 'error');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Filter records
  const filteredRecords = records.filter((r) => {
    const matchesEmp =
      selectedEmployeeId === 'ALL' || r.employeeId === selectedEmployeeId;
    const matchesStatus =
      selectedStatus === 'ALL' || r.status === selectedStatus;
    const matchesDate = !selectedDate || r.date === selectedDate;

    return matchesEmp && matchesStatus && (isHRorAdmin ? (selectedDate ? matchesDate : true) : true);
  });

  // Calculate stats for current view
  const presentCount = records.filter((r) => r.status === 'PRESENT' || r.status === 'HALF_DAY').length;
  const totalHours = records.reduce((sum, r) => sum + (r.workingHours || 0), 0);
  const avgHours = records.length > 0 ? (totalHours / records.length).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isHRorAdmin ? 'Workforce Attendance Logs' : 'My Daily Attendance & Timecard'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time biometric check-in/out timestamps, hours calculation, and shift logs.
          </p>
        </div>

        {isHRorAdmin && (
          <Button
            id="manual-attendance-btn"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setIsManualModalOpen(true)}
          >
            Mark Manual Attendance
          </Button>
        )}
      </div>

      {/* Quick Punch Bar for Employee */}
      <Card padding="sm" className="border-indigo-100 dark:border-indigo-950">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Today's Punch Status: {myTodayRecord?.status || 'NOT_CHECKED_IN'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {myTodayRecord?.checkIn ? `In: ${myTodayRecord.checkIn}` : 'No arrival time logged yet'}
                {myTodayRecord?.checkOut ? ` | Out: ${myTodayRecord.checkOut} (${myTodayRecord.workingHours}h)` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {myTodayRecord?.checkIn ? (
              !myTodayRecord.checkOut ? (
                <Button
                  id="page-checkout-btn"
                  variant="danger"
                  size="sm"
                  onClick={handleCheckOut}
                  isLoading={isPunching}
                >
                  Punch Out
                </Button>
              ) : (
                <Badge variant="success" size="md">
                  Shift Completed ({myTodayRecord.workingHours}h)
                </Badge>
              )
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Optional remarks..."
                  value={punchRemark}
                  onChange={(e) => setPunchRemark(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
                <Button
                  id="page-checkin-btn"
                  variant="success"
                  size="sm"
                  onClick={handleCheckIn}
                  isLoading={isPunching}
                >
                  Punch In
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Logged Records"
          value={records.length}
          icon={<Calendar className="w-5 h-5" />}
          subtext="Historical timecard logs"
        />
        <StatCard
          title="Present Entries"
          value={presentCount}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
          subtext={`${records.length - presentCount} leaves/absences`}
        />
        <StatCard
          title="Average Shift Hours"
          value={`${avgHours} hrs`}
          icon={<Clock className="w-5 h-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
          subtext="Per worked day"
        />
      </div>

      {/* Filter Toolbar */}
      <Card padding="sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Date Picker */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Date Filter
            </label>
            <input
              id="attendance-date-filter"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            />
          </div>

          {/* Employee Filter (HR only) */}
          {isHRorAdmin ? (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Employee Filter
              </label>
              <select
                id="attendance-employee-filter"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <option value="ALL">All Employees</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div />
          )}

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Status Filter
            </label>
            <select
              id="attendance-status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">On Leave</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      {loading ? (
        <LoadingSpinner message="Filtering attendance records..." />
      ) : (
        <Table
          id="attendance-log-table"
          headers={[
            'Employee',
            'Department',
            'Date',
            'Check In',
            'Check Out',
            'Hours',
            'Status',
            'Remarks',
          ]}
        >
          {filteredRecords.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-8 text-xs text-slate-400">
                No attendance logs found for the selected filters.
              </td>
            </tr>
          ) : (
            filteredRecords.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="px-5 py-3">
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    {rec.employeeName}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">
                    {rec.employeeCode}
                  </div>
                </td>

                <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                  {rec.departmentName || '-'}
                </td>

                <td className="px-5 py-3 whitespace-nowrap font-mono text-xs text-slate-700 dark:text-slate-300">
                  {rec.date}
                </td>

                <td className="px-5 py-3 whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-400">
                  {rec.checkIn || '-'}
                </td>

                <td className="px-5 py-3 whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-400">
                  {rec.checkOut || '-'}
                </td>

                <td className="px-5 py-3 whitespace-nowrap font-mono text-xs font-bold text-slate-900 dark:text-white">
                  {rec.workingHours || 0} hrs
                </td>

                <td className="px-5 py-3 whitespace-nowrap">
                  <Badge status={rec.status} size="sm" dot>
                    {rec.status}
                  </Badge>
                </td>

                <td className="px-5 py-3 text-xs text-slate-500 max-w-xs truncate">
                  {rec.remarks || '-'}
                </td>
              </tr>
            ))
          )}
        </Table>
      )}

      {/* Manual Attendance Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Mark Manual Attendance Entry"
        description="Override or insert attendance timestamp logs for employee shifts."
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsManualModalOpen(false)}>
              Cancel
            </Button>
            <Button
              id="save-manual-attendance-btn"
              variant="primary"
              size="sm"
              onClick={handleManualSubmit}
              isLoading={isSubmittingManual}
            >
              Save Record
            </Button>
          </>
        }
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Employee *
            </label>
            <select
              id="manual-form-employee"
              value={manualForm.employeeId || ''}
              onChange={(e) => setManualForm({ ...manualForm, employeeId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              required
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="manual-form-date"
              label="Shift Date *"
              type="date"
              value={manualForm.date || ''}
              onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Attendance Status
              </label>
              <select
                id="manual-form-status"
                value={manualForm.status || 'PRESENT'}
                onChange={(e) =>
                  setManualForm({ ...manualForm, status: e.target.value as AttendanceStatus })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              >
                <option value="PRESENT">Present</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="ABSENT">Absent</option>
                <option value="LEAVE">On Leave</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="manual-form-checkin"
              label="Check In Time"
              type="time"
              step="1"
              value={manualForm.checkIn || '09:00:00'}
              onChange={(e) => setManualForm({ ...manualForm, checkIn: e.target.value })}
            />
            <Input
              id="manual-form-checkout"
              label="Check Out Time"
              type="time"
              step="1"
              value={manualForm.checkOut || '17:30:00'}
              onChange={(e) => setManualForm({ ...manualForm, checkOut: e.target.value })}
            />
          </div>

          <Input
            id="manual-form-remarks"
            label="Remarks / Justification"
            value={manualForm.remarks || ''}
            onChange={(e) => setManualForm({ ...manualForm, remarks: e.target.value })}
            placeholder="e.g. Approved remote shift / Biometric reader retry"
          />
        </form>
      </Modal>
    </div>
  );
};
