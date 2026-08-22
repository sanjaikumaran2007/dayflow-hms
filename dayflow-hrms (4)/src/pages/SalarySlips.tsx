import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SalarySlip } from '../types/hrms';
import { salaryService } from '../services/salaryService';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SalarySlipModal } from '../components/ui/SalarySlipModal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Receipt,
  Search,
  Filter,
  Printer,
  Download,
  Calendar,
  Building2,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';

export const SalarySlips: React.FC = () => {
  const { user, role, employeeProfile } = useAuth();
  const { showToast } = useToast();

  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);

  const isHRorAdmin = role === 'ADMIN' || role === 'HR';
  const myEmployeeId = user?.employeeId || employeeProfile?.id || 'emp-101';

  const loadSlips = async () => {
    setLoading(true);
    try {
      const list = await salaryService.getSalarySlips(
        !isHRorAdmin ? myEmployeeId : undefined
      );
      setSlips(Array.isArray(list) ? list : []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load salary slips', 'error');
      setSlips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlips();
  }, [role, myEmployeeId]);

  const safeSlips = Array.isArray(slips) ? slips : [];
  const filteredSlips = safeSlips.filter((s) => {
    if (!s) return false;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (s.slipNumber || '').toLowerCase().includes(q) ||
      (s.employeeName || '').toLowerCase().includes(q) ||
      (s.employeeCode || '').toLowerCase().includes(q) ||
      (s.departmentName && s.departmentName.toLowerCase().includes(q));

    const matchesPeriod = selectedPeriod === 'ALL' || s.payPeriod === selectedPeriod;

    return matchesSearch && matchesPeriod;
  });

  const uniquePeriods = Array.from(new Set(slips.map((s) => s.payPeriod)));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isHRorAdmin ? 'Salary Slips & Payslip Ledger' : 'My Disbursed Payslips'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official cryptographically generated compensation receipts with earnings & deduction breakdowns.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="slip-search-input"
              type="text"
              placeholder="Search by slip #, employee name, code, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white text-black font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-black"
            />
          </div>

          <select
            id="slip-period-filter"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full sm:w-48 text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="ALL">All Pay Periods</option>
            {uniquePeriods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Slips Table */}
      {loading ? (
        <LoadingSpinner message="Retrieving salary payslips..." />
      ) : filteredSlips.length === 0 ? (
        <EmptyState
          title="No salary slips found"
          description="Processed monthly payroll cycles automatically generate verifiable employee payslips here."
        />
      ) : (
        <Table
          id="salary-slips-table"
          headers={[
            'Slip Number',
            'Employee',
            'Department',
            'Pay Period',
            'Disbursed Date',
            'Gross Salary',
            'Deductions',
            'Net Disbursed',
            'Actions',
          ]}
        >
          {filteredSlips.map((slip) => (
            <tr key={slip.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
              <td className="px-5 py-3.5 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                {slip.slipNumber}
              </td>

              <td className="px-5 py-3.5">
                <div className="font-semibold text-xs text-slate-900 dark:text-white">
                  {slip.employeeName}
                </div>
                <div className="font-mono text-[10px] text-slate-400">
                  {slip.employeeCode}
                </div>
              </td>

              <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                {slip.departmentName}
              </td>

              <td className="px-5 py-3.5 whitespace-nowrap font-medium text-xs text-slate-800 dark:text-slate-200">
                {slip.payPeriod}
              </td>

              <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-slate-500">
                {slip.paymentDate}
              </td>

              <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-slate-700 dark:text-slate-300">
                ${slip.grossSalary.toLocaleString()}
              </td>

              <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-rose-600 dark:text-rose-400">
                ${slip.totalDeductions.toLocaleString()}
              </td>

              <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ${slip.netSalary.toLocaleString()}
              </td>

              <td className="px-5 py-3.5 whitespace-nowrap">
                <Button
                  id={`view-slip-${slip.id}`}
                  size="sm"
                  variant="outline"
                  leftIcon={<Receipt className="w-3.5 h-3.5" />}
                  onClick={() => setSelectedSlip(slip)}
                >
                  View Payslip
                </Button>
              </td>
            </tr>
          ))}
        </Table>
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
