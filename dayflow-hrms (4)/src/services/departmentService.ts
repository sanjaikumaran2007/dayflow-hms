import { Department } from '../types/hrms';
import { getStoreItem, setStoreItem, STORAGE_KEYS, apiClient } from './api';
import { INITIAL_DEPARTMENTS } from '../data/mockData';
import { auditService } from './auditService';

export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.get('/departments');
        return response.data;
      } catch (err) {
        console.warn('Backend getDepartments failed, using local store', err);
      }
    }
    const list = getStoreItem<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    return Array.isArray(list) ? list : [...INITIAL_DEPARTMENTS];
  },

  async createDepartment(deptData: Partial<Department>): Promise<Department> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.post('/departments', deptData);
        return response.data;
      } catch (err) {
        console.warn('Backend createDepartment failed, using local store', err);
      }
    }

    const depts = getStoreItem<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name: deptData.name || 'New Department',
      code: deptData.code || 'NEW',
      description: deptData.description || '',
      managerId: deptData.managerId,
      managerName: deptData.managerName,
      employeeCount: deptData.employeeCount || 0,
      budget: deptData.budget || 100000,
      location: deptData.location || 'Headquarters Floor 1',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const updated = [...depts, newDept];
    setStoreItem(STORAGE_KEYS.DEPARTMENTS, updated);

    await auditService.logAction({
      action: 'CREATE',
      tableName: 'departments',
      recordId: newDept.id,
      details: `Created new department: ${newDept.name} (${newDept.code})`,
      newValues: newDept,
    });

    return newDept;
  },

  async updateDepartment(id: string, updates: Partial<Department>): Promise<Department> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.put(`/departments/${id}`, updates);
        return response.data;
      } catch (err) {
        console.warn('Backend updateDepartment failed, using local store', err);
      }
    }

    const depts = getStoreItem<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const existing = depts.find((d) => d.id === id);
    if (!existing) throw new Error('Department not found');

    const updatedDept: Department = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const updatedList = depts.map((d) => (d.id === id ? updatedDept : d));
    setStoreItem(STORAGE_KEYS.DEPARTMENTS, updatedList);

    await auditService.logAction({
      action: 'UPDATE',
      tableName: 'departments',
      recordId: id,
      details: `Updated department: ${updatedDept.name}`,
      oldValues: existing,
      newValues: updatedDept,
    });

    return updatedDept;
  },

  async deleteDepartment(id: string): Promise<void> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        await apiClient.delete(`/departments/${id}`);
        return;
      } catch (err) {
        console.warn('Backend deleteDepartment failed, using local store', err);
      }
    }

    const depts = getStoreItem<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const existing = depts.find((d) => d.id === id);
    const updatedList = depts.filter((d) => d.id !== id);
    setStoreItem(STORAGE_KEYS.DEPARTMENTS, updatedList);

    if (existing) {
      await auditService.logAction({
        action: 'DELETE',
        tableName: 'departments',
        recordId: id,
        details: `Deleted department: ${existing.name}`,
        oldValues: existing,
      });
    }
  },
};
