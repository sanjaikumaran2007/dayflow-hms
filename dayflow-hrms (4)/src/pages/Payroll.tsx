import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PayrollRecord, SalarySlip } from '../types/hrms';
import { payrollService } from '../services/payrollService';
import { salaryService } from '../services/salaryService';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { SalarySlipModal } from '../components/ui/SalarySlipModal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import {
  DollarSign,
  PlayCircle,
  Receipt,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Download,
  Calendar,
  Building2,
  Users,
} from 'lucide-react';

export const Payroll: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Process Payroll Modal
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('2026-08');
  const [isProcessing, setIsProcessing] = useState(false);

  // Selected Salary Slip for modal
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);

  const loadPayrolls = async () => {
    setLoading(true);
    try {
      const list = await payrollService.getPayrollRecords();
      setPayrolls(Array.isArray(list) ? list : []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load payroll records', 'error');
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrolls();
  }, []);

  const handleProcessPayroll = async () => {
    setIsProcessing(true);
    try {
      const record = await payrollService.processMonthlyPayroll(selectedPeriod, user?.name);
      setPayrolls((prev) => [record, ...(Array.isArray(prev) ? prev : []).filter((p) => p.monthYear !== selectedPeriod)]);
      showToast(
        `Disbursed monthly payroll for ${record.totalEmployees} employees ($${record.totalNetSalary.toLocaleString()} Net)`,
        'success',
        'Payroll Cycle Completed'
      );
      setIsProcessModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to process payroll', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewPaySlip = async (employeeId: string) => {
    try {
      const slips = await salaryService.getSalarySlips(employeeId);
      if (Array.isArray(slips) && slips.length > 0) {
        setSelectedSlip(slips[0]);
      } else {
        showToast('No generated pay slips found for this employee yet', 'info');
      }
    } catch (err: any) {
      showToast('Error loading slip', 'error');
    }
  };

  const safePayrolls = Array.isArray(payrolls) ? payrolls : [];
  const latestPayroll = safePayrolls[0];
  const totalDisbursedYTD = safePayrolls.reduce((sum, p) => sum + (p?.totalNetSalary || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Payroll Processing & Disbursements
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated salary calculations: Basic + HRA + Allowances - (Taxes + Insurance + Deductions).
          </p>
        </div>

        <Button
          id="open-process-payroll-btn"
          leftIcon={<PlayCircle className="w-4 h-4" />}
          onClick={() => setIsProcessModalOpen(true)}
        >
          Run Monthly Payroll Cycle
        </Button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="stat-latest-gross"
          title="Last Month Gross"
          value={`$${(latestPayroll?.totalGrossSalary || 68000).toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          subtext={`${latestPayroll?.monthYear || '2026-07'} Period`}
        />

        <StatCard
          id="stat-latest-net"
          title="Last Month Net Disbursed"
          value={`$${(latestPayroll?.totalNetSalary || 53400).toLocaleString()}`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
          subtext="Direct deposit transferred"
        />

        <StatCard
          id="stat-latest-tax"
          title="Taxes & Deductions"
          value={`$${(latestPayroll?.totalDeductions || 14600).toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
          subtext="Remitted to state/federal"
        />

        <StatCard
          id="stat-ytd-payroll"
          title="Total Net YTD"
          value={`$${totalDisbursedYTD.toLocaleString()}`}
          icon={<Building2 className="w-5 h-5" />}
          iconBgColor="bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400"
          subtext="Fiscal Year 2026"
        />
      </div>

      {/* Formula Explanation Card */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900/80 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider text-[11px]">
            Automated Mathematical Engine Specification:
          </span>
          <p className="text-slate-600 dark:text-slate-300 mt-1 font-mono text-[11px]">
            Gross = Basic + HRA + Allowances + Bonus | Deductions = Income Tax + Insurance + Other | Net = Gross - Deductions
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
            Database Automated SP: <code className="bg-white/80 dark:bg-slate-900 px-1.5 py-0.5 rounded">sp_process_monthly_payroll</code>
          </span>
        </div>
      </div>

      {/* Payroll History Table */}
      <Card title="Payroll Processing History">
        {loading ? (
          <LoadingSpinner message="Loading payroll records..." />
        ) : payrolls.length === 0 ? (
          <EmptyState
            title="No payroll records processed yet"
            description="Click 'Run Monthly Payroll Cycle' to compute and generate slips for all active employees."
            actionLabel="Run Payroll"
            onAction={() => setIsProcessModalOpen(true)}
          />
        ) : (
          <Table
            id="payroll-history-table"
            headers={[
              'Pay Period',
              'Headcount',
              'Total Gross',
              'Total Deductions',
              'Total Net Disbursed',
              'Processed By',
              'Status',
              'Action',
            ]}
          >
            {payrolls.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="px-5 py-3.5 font-bold text-xs text-slate-900 dark:text-white font-mono">
                  {rec.monthYear}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {rec.totalEmployees} Employees
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-slate-700 dark:text-slate-300">
                  ${rec.totalGrossSalary.toLocaleString()}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-rose-600 dark:text-rose-400">
                  ${rec.totalDeductions.toLocaleString()}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  ${rec.totalNetSalary.toLocaleString()}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500">
                  {rec.processedBy || 'System Admin'} &bull; <span className="font-mono text-[10px]">{rec.processedDate}</span>
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                  <Badge status={rec.status} size="sm" dot>
                    {rec.status}
                  </Badge>
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Receipt className="w-3.5 h-3.5" />}
                    onClick={() => handleViewPaySlip('emp-101')}
                  >
                    Sample Slip
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {/* Process Payroll Modal */}
      <Modal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        title="Execute Monthly Payroll Cycle"
        description="Compute gross earnings, statutory tax withholdings, and generate individual salary slips for all active employees."
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsProcessModalOpen(false)}>
              Cancel
            </Button>
            <Button
              id="confirm-run-payroll-btn"
              variant="primary"
              size="sm"
              onClick={handleProcessPayroll}
              isLoading={isProcessing}
              leftIcon={<PlayCircle className="w-4 h-4" />}
            >
              Confirm & Disburse Payroll
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Select Pay Period (YYYY-MM) *
            </label>
            <input
              id="payroll-period-input"
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white font-mono"
              required
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>Automated Batch Pipeline Steps:</span>
            </div>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 text-[11px] pl-1">
              <li>Pulls active salary structures for all eligible employees.</li>
              <li>Calculates Tax (12%), Insurance (4%), and Other Withholdings (2%).</li>
              <li>Generates cryptographically numbered Salary Pay Slips (<code className="font-mono">DF-SLIP-XXXX</code>).</li>
              <li>Emits notifications to employees informing them their pay slips are ready.</li>
              <li>Records immutable transaction log in System Audit Trail.</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Salary Slip Modal */}
      <SalarySlipModal
        slip={selectedSlip}
        isOpen={Boolean(selectedSlip)}
        onClose={() => setSelectedSlip(null)}
      />
    </div>
  );
};
