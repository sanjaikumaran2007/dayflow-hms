import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Employee, Department, EmploymentType, EmployeeStatus } from '../types/hrms';
import { employeeService } from '../services/employeeService';
import { departmentService } from '../services/departmentService';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoadingSpinner, TableSkeleton } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Mail,
  SlidersHorizontal,
} from 'lucide-react';

export const Employees: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    jobTitle: '',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    joiningDate: new Date().toISOString().split('T')[0],
    basicSalary: 6000,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Confirm delete/deactivate
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isHRorAdmin = role === 'ADMIN' || role === 'HR';

  const loadData = async () => {
    setLoading(true);
    try {
      const [empList, deptList] = await Promise.all([
        employeeService.getEmployees(),
        departmentService.getDepartments(),
      ]);
      setEmployees(Array.isArray(empList) ? empList : []);
      setDepartments(Array.isArray(deptList) ? deptList : []);
      if (Array.isArray(deptList) && deptList.length > 0 && !formData.departmentId) {
        setFormData((prev) => ({ ...prev, departmentId: deptList[0].id }));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      fullName.includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      emp.employeeCode.toLowerCase().includes(query) ||
      emp.jobTitle.toLowerCase().includes(query);

    const matchesDept = selectedDept === 'ALL' || emp.departmentId === selectedDept;
    const matchesStatus = selectedStatus === 'ALL' || emp.status === selectedStatus;
    const matchesType = selectedType === 'ALL' || emp.employmentType === selectedType;

    return matchesSearch && matchesDept && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      departmentId: departments[0]?.id || '',
      jobTitle: '',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      joiningDate: new Date().toISOString().split('T')[0],
      basicSalary: 6000,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      departmentId: emp.departmentId,
      jobTitle: emp.jobTitle,
      employmentType: emp.employmentType,
      status: emp.status,
      joiningDate: emp.joiningDate,
      basicSalary: emp.basicSalary,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.jobTitle) {
      showToast('Please fill all required fields', 'warning');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingEmployee) {
        const updated = await employeeService.updateEmployee(editingEmployee.id, formData);
        setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        showToast('Employee profile updated successfully', 'success', 'Saved');
      } else {
        const created = await employeeService.createEmployee(formData as any);
        setEmployees((prev) => [created, ...prev]);
        showToast('New employee onboarded successfully', 'success', 'Added');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEmployee) return;
    setIsDeleting(true);
    try {
      await employeeService.deleteEmployee(deletingEmployee.id);
      setEmployees((prev) => prev.filter((e) => e.id !== deletingEmployee.id));
      showToast('Employee record deleted from system', 'info', 'Removed');
      setDeletingEmployee(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to remove employee', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner (Image 3 style) */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Employee Directory
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your workforce of {employees.length > 0 ? employees.length : 248} employees
        </p>
      </div>

      {/* Search & Filter Toolbar (Image 3 style) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:bg-slate-900 dark:border-slate-800">
        {/* Search input with pill style */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="employee-search-bar"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, role, or ID..."
            className="w-full bg-[#F8F9FA] hover:bg-[#F1F3F5] focus:bg-white text-xs sm:text-sm text-black font-medium placeholder-slate-400 rounded-xl pl-10 pr-4 py-2 border border-slate-300 focus:border-[#2563EB] focus:outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-black"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl pl-8 pr-7 py-2 border border-slate-200 focus:outline-none focus:border-[#2563EB] cursor-pointer dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            >
              <option value="ALL">Department: All</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Role / Employment Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-[#2563EB] cursor-pointer dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
          >
            <option value="ALL">Role: All</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERN">Intern</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-[#2563EB] cursor-pointer dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
          >
            <option value="ALL">Status: All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Remote / Inactive</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>

          {/* Add Employee Button (Image 3 style) */}
          {isHRorAdmin && (
            <Button
              id="add-employee-btn"
              onClick={handleOpenAddModal}
              leftIcon={<UserPlus className="w-4 h-4" />}
              className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm py-2 px-4 shadow-xs"
            >
              Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* Employee Data Table (Image 3 style) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  EMPLOYEE
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  DEPARTMENT
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  JOB TITLE
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  EMAIL
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <LoadingSpinner message="Fetching employees directory..." />
                  </td>
                </tr>
              ) : paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No employees found matching the filters.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => {
                  const dept = departments.find((d) => d.id === emp.departmentId);
                  const isRemote = emp.employmentType === 'CONTRACT';
                  const statusVariant =
                    emp.status === 'ACTIVE'
                      ? isRemote
                        ? 'remote'
                        : 'active'
                      : emp.status === 'ON_LEAVE'
                      ? 'on_leave'
                      : 'neutral';

                  const statusLabel =
                    emp.status === 'ACTIVE'
                      ? isRemote
                        ? 'Remote'
                        : 'Active'
                      : emp.status === 'ON_LEAVE'
                      ? 'On Leave'
                      : emp.status;

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Employee Column (Avatar + Name + ID) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3.5">
                          {emp.avatarUrl ? (
                            <img
                              src={emp.avatarUrl}
                              alt={`${emp.firstName} ${emp.lastName}`}
                              className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold text-xs dark:bg-slate-800 dark:text-slate-200">
                              {emp.firstName[0]}
                              {emp.lastName[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5 font-mono">
                              ID: {emp.employeeCode}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {dept?.name || 'General'}
                      </td>

                      {/* Job Title */}
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {emp.jobTitle}
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs dark:text-slate-400">
                        {emp.email}
                      </td>

                      {/* Status Pill (Image 3 style) */}
                      <td className="px-6 py-4">
                        <Badge variant={statusVariant} dot={true}>
                          {statusLabel}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => navigate(`/employees/${emp.id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isHRorAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(emp)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingEmployee(emp)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer (Image 3 style) */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-900 dark:text-white">1</span> to{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {Math.min(filteredEmployees.length, itemsPerPage)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {filteredEmployees.length}
            </span>{' '}
            results
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                  currentPage === pageNum
                    ? 'bg-[#2563EB] text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingEmployee ? 'Edit Employee Record' : 'Onboard New Employee'}
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name *"
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address *"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Phone Number"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department *
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  required
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Job Title *"
                value={formData.jobTitle || ''}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="e.g. Senior Frontend Dev"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employment Type
                </label>
                <select
                  value={formData.employmentType}
                  onChange={(e) =>
                    setFormData({ ...formData, employmentType: e.target.value as EmploymentType })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract / Remote</option>
                  <option value="INTERN">Intern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as EmployeeStatus })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <Input
                label="Basic Salary ($/mo)"
                type="number"
                value={formData.basicSalary || 6000}
                onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={formSubmitting}
                className="bg-[#2563EB] hover:bg-blue-700"
              >
                {editingEmployee ? 'Save Changes' : 'Create Employee'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deletingEmployee && (
        <ConfirmDialog
          isOpen={!!deletingEmployee}
          onClose={() => setDeletingEmployee(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Employee"
          message={`Are you sure you want to remove ${deletingEmployee.firstName} ${deletingEmployee.lastName}? This action cannot be undone.`}
          confirmLabel="Delete Record"
          isDanger={true}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
