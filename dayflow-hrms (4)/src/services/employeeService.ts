import { Employee, EmployeeStatus, EmployeeDocument } from '../types/hrms';
import { getStoreItem, setStoreItem, STORAGE_KEYS, apiClient } from './api';
import { INITIAL_EMPLOYEES } from '../data/mockData';
import { auditService } from './auditService';

export const employeeService = {
  async getEmployees(): Promise<Employee[]> {
    try {
      const response = await apiClient.get('/employees');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (err) {
      console.warn('Backend getEmployees failed, using local store', err);
    }
    const list = getStoreItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    return Array.isArray(list) ? list : [...INITIAL_EMPLOYEES];
  },

  async getEmployeeById(id: string): Promise<Employee | undefined> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.get(`/employees/${id}`);
        return response.data;
      } catch (err) {
        console.warn('Backend getEmployeeById failed, using local store', err);
      }
    }
    const employees = getStoreItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    return employees.find((e) => e.id === id || e.userId === id);
  },

  async createEmployee(employeeData: Partial<Employee>): Promise<Employee> {
    try {
      const response = await apiClient.post('/employees', employeeData);
      if (response.data && response.data.id) {
        const current = getStoreItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
        setStoreItem(STORAGE_KEYS.EMPLOYEES, [response.data, ...current]);
        return response.data;
      }
    } catch (err) {
      console.warn('Backend createEmployee failed, using local store', err);
    }

    const employees = getStoreItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const newId = `emp-${Date.now()}`;
    const code = employeeData.employeeCode || `DF-EMP-${Math.floor(100 + Math.random() * 900)}`;

    const newEmployee: Employee = {
      id: newId,
      employeeCode: code,
      firstName: employeeData.firstName || '',
      lastName: employeeData.lastName || '',
      email: employeeData.email || '',
      phone: employeeData.phone || '',
      departmentId: employeeData.departmentId || 'dept-eng',
      departmentName: employeeData.departmentName || 'Engineering',
      jobTitle: employeeData.jobTitle || 'Associate Specialist',
      employmentType: employeeData.employmentType || 'FULL_TIME',
      joiningDate: employeeData.joiningDate || new Date().toISOString().split('T')[0],
      status: employeeData.status || 'ACTIVE',
      gender: employeeData.gender || 'OTHER',
      dateOfBirth: employeeData.dateOfBirth,
      address: employeeData.address,
      city: employeeData.city,
      country: employeeData.country,
      avatarUrl: employeeData.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      emergencyContactName: employeeData.emergencyContactName,
      emergencyContactPhone: employeeData.emergencyContactPhone,
      bankName: employeeData.bankName,
      accountNumber: employeeData.accountNumber,
      taxId: employeeData.taxId,
      documents: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newEmployee, ...employees];
    setStoreItem(STORAGE_KEYS.EMPLOYEES, updated);

    await auditService.logAction({
      action: 'CREATE',
      tableName: 'employees',
      recordId: newId,
      details: `Created new employee profile: ${newEmployee.firstName} ${newEmployee.lastName} (${newEmployee.employeeCode})`,
      newValues: newEmployee,
    });

    return newEmployee;
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.put(`/employees/${id}`, updates);
        return response.data;
      } catch (err) {
        console.warn('Backend updateEmployee failed, using local store', err);
      }
    }

    const employees = getStoreItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const existing = employees.find((e) => e.id === id);
    if (!existing) throw new Error('Employee not found');

    const updatedEmployee: Employee = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const updatedList = employees.map((e) => (e.id === id ? updatedEmployee : e));
    setStoreItem(STORAGE_KEYS.EMPLOYEES, updatedList);

    await auditService.logAction({
      action: 'UPDATE',
      tableName: 'employees',
      recordId: id,
      details: `Updated employee profile: ${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
      oldValues: existing,
      newValues: updatedEmployee,
    });

    return updatedEmployee;
  },

  async setEmployeeStatus(id: string, status: EmployeeStatus): Promise<Employee> {
    return this.updateEmployee(id, { status });
  },

  async deleteEmployee(id: string): Promise<void> {
    const employees = getStoreItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const existing = employees.find((e) => e.id === id);
    const updated = employees.filter((e) => e.id !== id);
    setStoreItem(STORAGE_KEYS.EMPLOYEES, updated);

    if (existing) {
      await auditService.logAction({
        action: 'DELETE',
        tableName: 'employees',
        recordId: id,
        details: `Deleted employee profile: ${existing.firstName} ${existing.lastName} (${existing.employeeCode})`,
        oldValues: existing,
      });
    }
  },

  async addDocument(employeeId: string, doc: Omit<EmployeeDocument, 'id' | 'employeeId' | 'uploadedAt'>): Promise<EmployeeDocument> {
    const employees = getStoreItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) throw new Error('Employee not found');

    const newDoc: EmployeeDocument = {
      id: `doc-${Date.now()}`,
      employeeId,
      title: doc.title,
      documentType: doc.documentType,
      fileUrl: doc.fileUrl || '#',
      fileSize: doc.fileSize || '1.5 MB',
      uploadedAt: new Date().toISOString().split('T')[0],
      expiryDate: doc.expiryDate,
      notes: doc.notes,
    };

    const currentDocs = emp.documents || [];
    const updatedDocs = [...currentDocs, newDoc];
    await this.updateEmployee(employeeId, { documents: updatedDocs });

    await auditService.logAction({
      action: 'CREATE',
      tableName: 'employee_documents',
      recordId: newDoc.id,
      details: `Uploaded document "${newDoc.title}" for employee ${emp.firstName} ${emp.lastName}`,
    });

    return newDoc;
  },

  async deleteDocument(employeeId: string, docId: string): Promise<void> {
    const employees = getStoreItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const updatedDocs = (emp.documents || []).filter((d) => d.id !== docId);
    await this.updateEmployee(employeeId, { documents: updatedDocs });

    await auditService.logAction({
      action: 'DELETE',
      tableName: 'employee_documents',
      recordId: docId,
      details: `Deleted document ${docId} from employee ${emp.firstName} ${emp.lastName}`,
    });
  },
};
