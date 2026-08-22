import { PayrollRecord, PayrollStatus, SalarySlip } from '../types/hrms';
import { getStoreItem, setStoreItem, STORAGE_KEYS, apiClient } from './api';
import { INITIAL_PAYROLL, INITIAL_SALARY_STRUCTURES, INITIAL_SALARY_SLIPS, INITIAL_EMPLOYEES } from '../data/mockData';
import { auditService } from './auditService';
import { notificationService } from './notificationService';

export const payrollService = {
  async getPayrollRecords(filters?: {
    payPeriod?: string;
    status?: PayrollStatus;
    employeeId?: string;
  }): Promise<PayrollRecord[]> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.get('/payroll', { params: filters });
        return response.data;
      } catch (err) {
        console.warn('Backend getPayrollRecords failed, using local store', err);
      }
    }

    let records = getStoreItem<PayrollRecord[]>(STORAGE_KEYS.PAYROLL, INITIAL_PAYROLL);
    if (!Array.isArray(records)) {
      records = Array.isArray(INITIAL_PAYROLL) ? [...INITIAL_PAYROLL] : [];
    }

    if (filters) {
      if (filters.employeeId) {
        records = records.filter((r) => r && r.employeeId === filters.employeeId);
      }
      if (filters.payPeriod && filters.payPeriod !== 'ALL') {
        records = records.filter((r) => r && r.payPeriod === filters.payPeriod);
      }
      if (filters.status && (filters.status as string) !== 'ALL') {
        records = records.filter((r) => r && r.status === filters.status);
      }
    }

    return records.sort((a, b) => (b?.paymentDate || '').localeCompare(a?.paymentDate || ''));
  },

  async generatePayrollBatch(payPeriod: string, paymentDate: string): Promise<PayrollRecord[]> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.post('/payroll/generate', { payPeriod, paymentDate });
        return response.data;
      } catch (err) {
        console.warn('Backend generatePayroll failed, using local store', err);
      }
    }

    const currentRecords = getStoreItem<PayrollRecord[]>(STORAGE_KEYS.PAYROLL, INITIAL_PAYROLL);
    const structures = getStoreItem<any[]>(STORAGE_KEYS.SALARY_STRUCTURES, INITIAL_SALARY_STRUCTURES);
    const employees = getStoreItem<any[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);

    const generated: PayrollRecord[] = [];

    structures.filter((s) => s.isActive).forEach((s) => {
      const emp = employees.find((e) => e.id === s.employeeId);
      const recordId = `pay-${payPeriod.replace(/\s+/g, '-').toLowerCase()}-${s.employeeId}`;

      // Check if record already exists
      const existing = currentRecords.find((r) => r.employeeId === s.employeeId && r.payPeriod === payPeriod);
      if (!existing) {
        const newRecord: PayrollRecord = {
          id: recordId,
          employeeId: s.employeeId,
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : s.employeeName,
          employeeCode: emp?.employeeCode || s.employeeCode,
          departmentName: emp?.departmentName || s.departmentName,
          jobTitle: emp?.jobTitle || 'Associate',
          payPeriod,
          paymentDate,
          basicSalary: s.basicSalary,
          hra: s.hra,
          allowances: s.allowances,
          bonus: s.bonus,
          grossSalary: s.grossSalary,
          tax: s.tax,
          insurance: s.insurance,
          otherDeductions: s.otherDeductions,
          totalDeductions: s.totalDeductions,
          netSalary: s.netSalary,
          status: 'PROCESSING',
          paymentMethod: 'BANK_TRANSFER',
          remarks: `Generated payroll cycle for ${payPeriod}`,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        };
        generated.push(newRecord);
      }
    });

    const updatedPayroll = [...generated, ...currentRecords];
    setStoreItem(STORAGE_KEYS.PAYROLL, updatedPayroll);

    await auditService.logAction({
      action: 'CREATE',
      tableName: 'payroll_records',
      recordId: `batch-${payPeriod}`,
      details: `Generated payroll batch for period ${payPeriod} (${generated.length} records generated)`,
      newValues: { payPeriod, count: generated.length },
    });

    await notificationService.createNotification({
      targetRole: 'HR',
      title: 'Payroll Generated',
      message: `Payroll cycle for ${payPeriod} generated with ${generated.length} records ready for disbursement review.`,
      category: 'PAYROLL',
      actionUrl: '/payroll',
    });

    return generated;
  },

  async updatePayrollStatus(id: string, status: PayrollStatus): Promise<PayrollRecord> {
    const records = getStoreItem<PayrollRecord[]>(STORAGE_KEYS.PAYROLL, INITIAL_PAYROLL);
    const existing = records.find((r) => r.id === id);
    if (!existing) throw new Error('Payroll record not found');

    const updated: PayrollRecord = {
      ...existing,
      status,
      transactionReference: status === 'PAID' ? (existing.transactionReference || `TXN-DF-${Date.now().toString().slice(-6)}`) : existing.transactionReference,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const updatedList = records.map((r) => (r.id === id ? updated : r));
    setStoreItem(STORAGE_KEYS.PAYROLL, updatedList);

    // If marked PAID, ensure a Salary Slip exists
    if (status === 'PAID') {
      const slips = getStoreItem<SalarySlip[]>(STORAGE_KEYS.SALARY_SLIPS, INITIAL_SALARY_SLIPS);
      const existingSlip = slips.find((s) => s.payrollId === id);

      if (!existingSlip) {
        const newSlip: SalarySlip = {
          id: `slip-${id}`,
          slipNumber: `SLIP-${updated.payPeriod.replace(/\s+/g, '').toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          payrollId: id,
          employeeId: updated.employeeId,
          employeeName: updated.employeeName || 'Employee',
          employeeCode: updated.employeeCode || 'DF-EMP',
          departmentName: updated.departmentName || 'Engineering',
          jobTitle: updated.jobTitle || 'Associate',
          payPeriod: updated.payPeriod,
          paymentDate: updated.paymentDate,
          bankName: 'Commercial Partner Bank',
          accountNumber: '••••••••8821',
          taxId: 'US-TX-998822',
          basicSalary: updated.basicSalary,
          hra: updated.hra,
          allowances: updated.allowances,
          bonus: updated.bonus,
          grossSalary: updated.grossSalary,
          tax: updated.tax,
          insurance: updated.insurance,
          otherDeductions: updated.otherDeductions,
          totalDeductions: updated.totalDeductions,
          netSalary: updated.netSalary,
          generatedDate: new Date().toISOString().split('T')[0],
          companyName: 'Dayflow Technologies Inc.',
          companyAddress: '500 Howard Street, Suite 800, San Francisco, CA 94105',
          companyTaxNumber: 'EIN-82-4910284',
        };
        setStoreItem(STORAGE_KEYS.SALARY_SLIPS, [newSlip, ...slips]);

        await notificationService.createNotification({
          userId: updated.employeeId,
          targetRole: 'EMPLOYEE',
          title: 'Salary Disbursed',
          message: `Your net salary of $${updated.netSalary.toLocaleString()} for ${updated.payPeriod} has been paid.`,
          category: 'PAYROLL',
          actionUrl: '/salary-slips',
        });
      }
    }

    await auditService.logAction({
      action: 'STATUS_CHANGE',
      tableName: 'payroll_records',
      recordId: id,
      details: `Updated payroll status for ${existing.employeeName} (${existing.payPeriod}) to ${status}`,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  },

  async processMonthlyPayroll(payPeriod: string, processedBy?: string): Promise<any> {
    const paymentDate = new Date().toISOString().split('T')[0];
    const generated = await this.generatePayrollBatch(payPeriod, paymentDate);
    
    // Mark them as PAID and generate salary slips
    for (const rec of generated) {
      await this.updatePayrollStatus(rec.id, 'PAID');
    }

    const totalGross = generated.reduce((s, r) => s + r.grossSalary, 0);
    const totalDeductions = generated.reduce((s, r) => s + r.totalDeductions, 0);
    const totalNet = generated.reduce((s, r) => s + r.netSalary, 0);

    return {
      id: `batch-${payPeriod}`,
      monthYear: payPeriod,
      totalEmployees: generated.length,
      totalGrossSalary: totalGross,
      totalDeductions: totalDeductions,
      totalNetSalary: totalNet,
      processedBy: processedBy || 'HR Administrator',
      processedDate: paymentDate,
      status: 'PAID',
    };
  },
};
