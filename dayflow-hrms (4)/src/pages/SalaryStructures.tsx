import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SalaryStructure, Employee } from '../types/hrms';
import { salaryService } from '../services/salaryService';
import { employeeService } from '../services/employeeService';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import {
  FileSpreadsheet,
  Plus,
  Edit2,
  DollarSign,
  Calculator,
  Search,
  Building2,
} from 'lucide-react';

export const SalaryStructures: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStruct, setEditingStruct] = useState<SalaryStructure | null>(null);
  const [formData, setFormData] = useState<Partial<SalaryStructure>>({
    employeeId: '',
    basicSalary: 6000,
    hra: 1800,
    allowances: 800,
    bonus: 500,
    tax: 1000,
    insurance: 350,
    otherDeductions: 150,
    effectiveFrom: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [structList, empList] = await Promise.all([
        salaryService.getSalaryStructures(),
        employeeService.getEmployees(),
      ]);
      setStructures(Array.isArray(structList) ? structList : []);
      setEmployees(Array.isArray(empList) ? empList : []);
      if (Array.isArray(empList) && empList.length > 0 && !formData.employeeId) {
        setFormData((prev) => ({ ...prev, employeeId: empList[0].id }));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load salary structures', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingStruct(null);
    setFormData({
      employeeId: employees[0]?.id || '',
      basicSalary: 6500,
      hra: 1950,
      allowances: 900,
      bonus: 600,
      tax: 1200,
      insurance: 400,
      otherDeductions: 150,
      effectiveFrom: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (struct: SalaryStructure) => {
    setEditingStruct(struct);
    setFormData({ ...struct });
    setIsModalOpen(true);
  };

  // Computed values
  const gross =
    (Number(formData.basicSalary) || 0) +
    (Number(formData.hra) || 0) +
    (Number(formData.allowances) || 0) +
    (Number(formData.bonus) || 0);

  const deductions =
    (Number(formData.tax) || 0) +
    (Number(formData.insurance) || 0) +
    (Number(formData.otherDeductions) || 0);

  const net = gross - deductions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.basicSalary) {
      showToast('Employee and Basic Salary are required', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const emp = employees.find((e) => e.id === formData.employeeId);
      const payload: Partial<SalaryStructure> = {
        ...formData,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : undefined,
        employeeCode: emp?.employeeCode,
        departmentName: emp?.departmentName,
      };

      if (editingStruct) {
        const updated = await salaryService.updateSalaryStructure(editingStruct.id, payload);
        setStructures((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        showToast(`Updated compensation structure for ${updated.employeeName}`, 'success');
      } else {
        const created = await salaryService.createSalaryStructure(payload);
        setStructures((prev) => [created, ...prev]);
        showToast(`Created compensation structure for ${created.employeeName}`, 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStructures = structures.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.employeeName && s.employeeName.toLowerCase().includes(q)) ||
      (s.employeeCode && s.employeeCode.toLowerCase().includes(q)) ||
      (s.departmentName && s.departmentName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Salary Structures & Formulas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure employee earnings components (Basic, HRA, Allowances, Bonus) and statutory withholdings.
          </p>
        </div>

        <Button
          id="add-salary-structure-btn"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Add Salary Structure
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          id="salary-search-input"
          type="text"
          placeholder="Search by employee name, code, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Loading compensation packages..." />
      ) : filteredStructures.length === 0 ? (
        <EmptyState
          title="No salary structures found"
          description="Define a salary structure to enable automatic payroll disbursements."
          actionLabel="Create Structure"
          onAction={handleOpenAdd}
        />
      ) : (
        <Table
          id="salary-structures-table"
          headers={[
            'Employee',
            'Basic Pay',
            'HRA',
            'Allowances',
            'Bonus',
            'Gross Salary',
            'Deductions',
            'Net Take-Home',
            'Status',
            'Action',
          ]}
        >
          {filteredStructures.map((struct) => (
            <tr key={struct.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
              <td className="px-5 py-3">
                <div className="font-semibold text-xs text-slate-900 dark:text-white">
                  {struct.employeeName}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {struct.employeeCode} &bull; {struct.departmentName}
                </div>
              </td>

              <td className="px-5 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                ${struct.basicSalary.toLocaleString()}
              </td>

              <td className="px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                ${struct.hra.toLocaleString()}
              </td>

              <td className="px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                ${struct.allowances.toLocaleString()}
              </td>

              <td className="px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                ${struct.bonus.toLocaleString()}
              </td>

              <td className="px-5 py-3 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                ${struct.grossSalary.toLocaleString()}
              </td>

              <td className="px-5 py-3 font-mono text-xs text-rose-600 dark:text-rose-400">
                ${struct.totalDeductions.toLocaleString()}
              </td>

              <td className="px-5 py-3 font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                ${struct.netSalary.toLocaleString()}
              </td>

              <td className="px-5 py-3 whitespace-nowrap">
                <Badge status={struct.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" dot>
                  {struct.isActive ? 'Active' : 'Archived'}
                </Badge>
              </td>

              <td className="px-5 py-3 whitespace-nowrap">
                <Button
                  id={`edit-struct-${struct.id}`}
                  size="sm"
                  variant="outline"
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  onClick={() => handleOpenEdit(struct)}
                >
                  Edit
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Add / Edit Salary Structure Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStruct ? `Edit Structure: ${editingStruct.employeeName}` : 'Add Salary Structure'}
        description="Configure earnings breakdown and statutory withholdings."
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              id="save-salary-structure-btn"
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              {editingStruct ? 'Update Structure' : 'Save Structure'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Select Employee *
            </label>
            <select
              id="struct-form-employee"
              value={formData.employeeId || ''}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              required
              disabled={Boolean(editingStruct)}
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeCode}) &bull; {e.departmentName}
                </option>
              ))}
            </select>
          </div>

          {/* Earnings Grid */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Earnings Components (USD)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input
                id="struct-basic"
                label="Basic Salary *"
                type="number"
                value={formData.basicSalary || 0}
                onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                required
              />
              <Input
                id="struct-hra"
                label="House Rent (HRA)"
                type="number"
                value={formData.hra || 0}
                onChange={(e) => setFormData({ ...formData, hra: Number(e.target.value) })}
              />
              <Input
                id="struct-allowances"
                label="Allowances"
                type="number"
                value={formData.allowances || 0}
                onChange={(e) => setFormData({ ...formData, allowances: Number(e.target.value) })}
              />
              <Input
                id="struct-bonus"
                label="Monthly Bonus"
                type="number"
                value={formData.bonus || 0}
                onChange={(e) => setFormData({ ...formData, bonus: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Deductions Grid */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Withholdings & Deductions (USD)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                id="struct-tax"
                label="Income Tax (TDS)"
                type="number"
                value={formData.tax || 0}
                onChange={(e) => setFormData({ ...formData, tax: Number(e.target.value) })}
              />
              <Input
                id="struct-insurance"
                label="Insurance Premium"
                type="number"
                value={formData.insurance || 0}
                onChange={(e) => setFormData({ ...formData, insurance: Number(e.target.value) })}
              />
              <Input
                id="struct-other"
                label="Other Deductions / 401(k)"
                type="number"
                value={formData.otherDeductions || 0}
                onChange={(e) => setFormData({ ...formData, otherDeductions: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Live Computed Summary Banner */}
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-900 grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Gross Salary</span>
              <p className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
                ${gross.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Total Deductions</span>
              <p className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
                ${deductions.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Net Take-Home</span>
              <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                ${net.toLocaleString()}
              </p>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
