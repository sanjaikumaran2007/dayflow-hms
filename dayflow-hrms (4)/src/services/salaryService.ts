import { SalaryStructure, SalarySlip } from '../types/hrms';
import { getStoreItem, setStoreItem, STORAGE_KEYS, apiClient } from './api';
import { INITIAL_SALARY_STRUCTURES, INITIAL_SALARY_SLIPS, INITIAL_EMPLOYEES } from '../data/mockData';
import { auditService } from './auditService';

export const salaryService = {
  calculateSalaryFigures(params: {
    basicSalary: number;
    hra: number;
    allowances: number;
    bonus: number;
    tax: number;
    insurance: number;
    otherDeductions: number;
  }) {
    const grossSalary = Number(
      ((params.basicSalary || 0) + (params.hra || 0) + (params.allowances || 0) + (params.bonus || 0)).toFixed(2)
    );
    const totalDeductions = Number(
      ((params.tax || 0) + (params.insurance || 0) + (params.otherDeductions || 0)).toFixed(2)
    );
    const netSalary = Number(Math.max(0, grossSalary - totalDeductions).toFixed(2));

    return { grossSalary, totalDeductions, netSalary };
  },

  async getSalaryStructures(): Promise<SalaryStructure[]> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.get('/salary-structures');
        return response.data;
      } catch (err) {
        console.warn('Backend getSalaryStructures failed, using local store', err);
      }
    }
    const list = getStoreItem<SalaryStructure[]>(STORAGE_KEYS.SALARY_STRUCTURES, INITIAL_SALARY_STRUCTURES);
    return Array.isArray(list) ? list : [...INITIAL_SALARY_STRUCTURES];
  },

  async getStructureByEmployeeId(employeeId: string): Promise<SalaryStructure | undefined> {
    const list = await this.getSalaryStructures();
    return list.find((s) => s.employeeId === employeeId && s.isActive);
  },

  async saveSalaryStructure(data: Partial<SalaryStructure>): Promise<SalaryStructure> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.post('/salary-structures', data);
        return response.data;
      } catch (err) {
        console.warn('Backend saveSalaryStructure failed, using local store', err);
      }
    }

    const structures = getStoreItem<SalaryStructure[]>(STORAGE_KEYS.SALARY_STRUCTURES, INITIAL_SALARY_STRUCTURES);
    const employees = getStoreItem<any[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const emp = employees.find((e) => e.id === data.employeeId);

    const { grossSalary, totalDeductions, netSalary } = this.calculateSalaryFigures({
      basicSalary: Number(data.basicSalary) || 0,
      hra: Number(data.hra) || 0,
      allowances: Number(data.allowances) || 0,
      bonus: Number(data.bonus) || 0,
      tax: Number(data.tax) || 0,
      insurance: Number(data.insurance) || 0,
      otherDeductions: Number(data.otherDeductions) || 0,
    });

    const isEdit = Boolean(data.id);
    const existingIndex = isEdit ? structures.findIndex((s) => s.id === data.id) : -1;

    const newStruct: SalaryStructure = {
      id: data.id || `sal-${Date.now()}`,
      employeeId: data.employeeId || 'emp-101',
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : (data.employeeName || 'Staff Member'),
      employeeCode: emp?.employeeCode || data.employeeCode || 'DF-EMP',
      departmentName: emp?.departmentName || data.departmentName || 'Engineering',
      basicSalary: Number(data.basicSalary) || 0,
      hra: Number(data.hra) || 0,
      allowances: Number(data.allowances) || 0,
      bonus: Number(data.bonus) || 0,
      tax: Number(data.tax) || 0,
      insurance: Number(data.insurance) || 0,
      otherDeductions: Number(data.otherDeductions) || 0,
      grossSalary,
      totalDeductions,
      netSalary,
      effectiveFrom: data.effectiveFrom || new Date().toISOString().split('T')[0],
      effectiveTo: data.effectiveTo,
      currency: data.currency || 'USD',
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    let updatedList: SalaryStructure[];
    if (existingIndex >= 0) {
      updatedList = structures.map((s, i) => (i === existingIndex ? newStruct : s));
    } else {
      updatedList = [newStruct, ...structures];
    }

    setStoreItem(STORAGE_KEYS.SALARY_STRUCTURES, updatedList);

    await auditService.logAction({
      action: isEdit ? 'UPDATE' : 'CREATE',
      tableName: 'salary_structures',
      recordId: newStruct.id,
      details: `${isEdit ? 'Updated' : 'Configured'} salary structure for ${newStruct.employeeName} (Gross: $${grossSalary}, Net: $${netSalary})`,
      newValues: newStruct,
    });

    return newStruct;
  },

  async createSalaryStructure(data: Partial<SalaryStructure>, actor?: string): Promise<SalaryStructure> {
    return this.saveSalaryStructure(data);
  },

  async updateSalaryStructure(id: string, data: Partial<SalaryStructure>, actor?: string): Promise<SalaryStructure> {
    return this.saveSalaryStructure({ ...data, id });
  },

  async getSalarySlips(employeeId?: string): Promise<SalarySlip[]> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.get('/salary-slips', { params: { employeeId } });
        return response.data;
      } catch (err) {
        console.warn('Backend getSalarySlips failed, using local store', err);
      }
    }

    let slips = getStoreItem<SalarySlip[]>(STORAGE_KEYS.SALARY_SLIPS, INITIAL_SALARY_SLIPS);
    if (employeeId) {
      slips = slips.filter((s) => s.employeeId === employeeId);
    }
    return slips.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  },
};
