import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Department } from '../types/hrms';
import { departmentService } from '../services/departmentService';
import { employeeService } from '../services/employeeService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Building2,
  Plus,
  Users,
  DollarSign,
  Edit2,
  Trash2,
  Search,
  UserCheck,
  Briefcase,
} from 'lucide-react';

export const Departments: React.FC = () => {
  const { role, user } = useAuth();
  const { showToast } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState<Partial<Department>>({
    name: '',
    code: '',
    description: '',
    managerName: '',
    budget: 500000,
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isHRorAdmin = role === 'ADMIN' || role === 'HR';

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const list = await departmentService.getDepartments();
      setDepartments(Array.isArray(list) ? list : []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const filteredDepts = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.managerName && d.managerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      managerName: '',
      budget: 500000,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description,
      managerName: dept.managerName,
      budget: dept.budget,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      showToast('Department Name and Code are required', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingDept) {
        const updated = await departmentService.updateDepartment(editingDept.id, formData);
        setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        showToast(`Updated department ${updated.name}`, 'success');
      } else {
        const created = await departmentService.createDepartment(formData);
        setDepartments((prev) => [...prev, created]);
        showToast(`Created department ${created.name} (${created.code})`, 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDept) return;
    setIsDeleting(true);
    try {
      await departmentService.deleteDepartment(deletingDept.id);
      setDepartments((prev) => prev.filter((d) => d.id !== deletingDept.id));
      showToast(`Removed department ${deletingDept.name}`, 'info');
      setDeletingDept(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete department', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Departments & Organizational Units
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure divisional hierarchy, manager assignments, and operational cost centers.
          </p>
        </div>

        {isHRorAdmin && (
          <Button
            id="add-dept-btn"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            Add Department
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          id="dept-search-input"
          type="text"
          placeholder="Search by department name, code, or manager..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSpinner message="Loading departments..." />
      ) : filteredDepts.length === 0 ? (
        <EmptyState
          title="No departments found"
          description="Create a department to categorize employees and allocate budgets."
          actionLabel={isHRorAdmin ? 'Create Department' : undefined}
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepts.map((dept) => (
            <div
              key={dept.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {dept.name}
                      </h3>
                      <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {dept.code}
                      </span>
                    </div>
                  </div>

                  <Badge variant="purple" size="sm">
                    {dept.employeeCount} Staff
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-4 line-clamp-3 leading-relaxed">
                  {dept.description}
                </p>

                <div className="mt-5 space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      Department Lead
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {dept.managerName || 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      Annual Budget
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      ${(dept.budget || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {isHRorAdmin && (
                <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  <Button
                    id={`edit-dept-${dept.id}`}
                    size="sm"
                    variant="outline"
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenEdit(dept)}
                  >
                    Edit
                  </Button>
                  <Button
                    id={`delete-dept-${dept.id}`}
                    size="sm"
                    variant="ghost"
                    className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => setDeletingDept(dept)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? `Edit Department: ${editingDept.code}` : 'Add New Department'}
        description="Define operational unit parameters, assigned manager, and allocated annual budget."
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              id="save-dept-modal-btn"
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              isLoading={submitting}
            >
              {editingDept ? 'Update Department' : 'Create Department'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="dept-form-name"
            label="Department Name *"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Artificial Intelligence & Labs"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="dept-form-code"
              label="Department Code *"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. AI-LABS"
              required
            />

            <Input
              id="dept-form-budget"
              label="Annual Operating Budget (USD)"
              type="number"
              value={formData.budget || 0}
              onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
            />
          </div>

          <Input
            id="dept-form-manager"
            label="Department Lead / Manager Name"
            value={formData.managerName || ''}
            onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
            placeholder="e.g. Dr. Jane Foster"
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Mission & Description
            </label>
            <textarea
              id="dept-form-description"
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of department responsibilities and objectives..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            />
          </div>
        </form>
      </Modal>

      {/* Confirm Deletion */}
      <ConfirmDialog
        isOpen={Boolean(deletingDept)}
        onClose={() => setDeletingDept(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Are you sure you want to delete ${deletingDept?.name} (${deletingDept?.code})? Ensure employees are reassigned beforehand.`}
        isLoading={isDeleting}
      />
    </div>
  );
};
