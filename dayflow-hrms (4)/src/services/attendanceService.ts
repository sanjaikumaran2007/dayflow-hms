import { AttendanceRecord, AttendanceStatus } from '../types/hrms';
import { getStoreItem, setStoreItem, STORAGE_KEYS, apiClient } from './api';
import { INITIAL_ATTENDANCE, INITIAL_EMPLOYEES } from '../data/mockData';
import { auditService } from './auditService';

export const attendanceService = {
  async getAttendanceRecords(filters?: {
    employeeId?: string;
    departmentName?: string;
    date?: string;
    status?: AttendanceStatus;
  }): Promise<AttendanceRecord[]> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.get('/attendance', { params: filters });
        return response.data;
      } catch (err) {
        console.warn('Backend getAttendanceRecords failed, using local store', err);
      }
    }

    let records = getStoreItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    if (!Array.isArray(records)) {
      records = Array.isArray(INITIAL_ATTENDANCE) ? [...INITIAL_ATTENDANCE] : [];
    }

    if (filters) {
      if (filters.employeeId) {
        records = records.filter((r) => r && r.employeeId === filters.employeeId);
      }
      if (filters.departmentName && filters.departmentName !== 'ALL') {
        records = records.filter((r) => r && r.departmentName === filters.departmentName);
      }
      if (filters.date) {
        records = records.filter((r) => r && r.date === filters.date);
      }
      if (filters.status && (filters.status as string) !== 'ALL') {
        records = records.filter((r) => r && r.status === filters.status);
      }
    }

    return records.sort((a, b) => (b?.date || '').localeCompare(a?.date || ''));
  },

  async getTodayRecordForEmployee(employeeId: string): Promise<AttendanceRecord | undefined> {
    const today = new Date().toISOString().split('T')[0];
    let records = getStoreItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    if (!Array.isArray(records)) records = [];
    return records.find((r) => r && r.employeeId === employeeId && r.date === today);
  },

  // Simulating Database Stored Procedure: sp_EmployeeCheckIn
  async checkIn(params: {
    employeeId: string;
    remarks?: string;
    location?: string;
  }): Promise<AttendanceRecord> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.post('/attendance/check-in', params);
        return response.data;
      } catch (err) {
        console.warn('Backend checkIn failed, using local store', err);
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });
    const records = getStoreItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    const employees = getStoreItem<any[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);

    const emp = employees.find((e) => e.id === params.employeeId);
    const existing = records.find((r) => r.employeeId === params.employeeId && r.date === today);

    if (existing && existing.checkIn) {
      throw new Error('You have already checked in for today!');
    }

    let updatedRecord: AttendanceRecord;

    if (existing) {
      updatedRecord = {
        ...existing,
        checkIn: nowTime,
        status: 'PRESENT',
        remarks: params.remarks || existing.remarks || 'Checked in via Dayflow Portal',
        location: params.location || 'Office Campus',
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
    } else {
      updatedRecord = {
        id: `att-${Date.now()}`,
        employeeId: params.employeeId,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Employee',
        employeeCode: emp?.employeeCode || 'DF-EMP',
        departmentName: emp?.departmentName || 'Engineering',
        date: today,
        checkIn: nowTime,
        workingHours: 0,
        status: 'PRESENT',
        remarks: params.remarks || 'Morning Check-In',
        ipAddress: '192.168.1.108',
        location: params.location || 'San Francisco HQ',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
    }

    const newRecords = records.filter((r) => !(r.employeeId === params.employeeId && r.date === today));
    newRecords.unshift(updatedRecord);
    setStoreItem(STORAGE_KEYS.ATTENDANCE, newRecords);

    await auditService.logAction({
      action: 'CREATE',
      tableName: 'attendance',
      recordId: updatedRecord.id,
      details: `Employee ${updatedRecord.employeeName} checked in at ${nowTime}`,
      newValues: updatedRecord,
    });

    return updatedRecord;
  },

  // Simulating Database Stored Procedure: sp_EmployeeCheckOut
  async checkOut(params: {
    employeeId: string;
    remarks?: string;
  }): Promise<AttendanceRecord> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.post('/attendance/check-out', params);
        return response.data;
      } catch (err) {
        console.warn('Backend checkOut failed, using local store', err);
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });
    const records = getStoreItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    const existing = records.find((r) => r.employeeId === params.employeeId && r.date === today);

    if (!existing || !existing.checkIn) {
      throw new Error('Cannot check out without checking in first.');
    }

    // Calculate working hours
    const [inH, inM, inS] = existing.checkIn.split(':').map(Number);
    const [outH, outM, outS] = nowTime.split(':').map(Number);
    const inTotalHours = inH + (inM || 0) / 60 + (inS || 0) / 3600;
    const outTotalHours = outH + (outM || 0) / 60 + (outS || 0) / 3600;
    const diff = Math.max(0.1, Number((outTotalHours - inTotalHours).toFixed(2)));

    const status: AttendanceStatus = diff < 5 ? 'HALF_DAY' : 'PRESENT';

    const updatedRecord: AttendanceRecord = {
      ...existing,
      checkOut: nowTime,
      workingHours: diff,
      status,
      remarks: params.remarks ? `${existing.remarks ? existing.remarks + ' | ' : ''}${params.remarks}` : existing.remarks,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    const newRecords = records.map((r) => (r.id === existing.id ? updatedRecord : r));
    setStoreItem(STORAGE_KEYS.ATTENDANCE, newRecords);

    await auditService.logAction({
      action: 'UPDATE',
      tableName: 'attendance',
      recordId: updatedRecord.id,
      details: `Employee ${updatedRecord.employeeName} checked out at ${nowTime} (${diff} hrs)`,
      oldValues: existing,
      newValues: updatedRecord,
    });

    return updatedRecord;
  },

  async markManualAttendance(record: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const records = getStoreItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    const employees = getStoreItem<any[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const emp = employees.find((e) => e.id === record.employeeId);

    const newRecord: AttendanceRecord = {
      id: record.id || `att-${Date.now()}`,
      employeeId: record.employeeId || 'emp-101',
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : (record.employeeName || 'Staff Member'),
      employeeCode: emp?.employeeCode || record.employeeCode || 'DF-EMP',
      departmentName: emp?.departmentName || record.departmentName || 'Engineering',
      date: record.date || new Date().toISOString().split('T')[0],
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      workingHours: record.workingHours || 8,
      status: record.status || 'PRESENT',
      remarks: record.remarks || 'Manually logged by HR/Admin',
      ipAddress: '192.168.1.1',
      location: 'HQ Campus',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    const existingIndex = records.findIndex((r) => r.id === newRecord.id);
    let updatedList: AttendanceRecord[];
    if (existingIndex >= 0) {
      updatedList = records.map((r, i) => (i === existingIndex ? newRecord : r));
    } else {
      updatedList = [newRecord, ...records];
    }

    setStoreItem(STORAGE_KEYS.ATTENDANCE, updatedList);

    await auditService.logAction({
      action: existingIndex >= 0 ? 'UPDATE' : 'CREATE',
      tableName: 'attendance',
      recordId: newRecord.id,
      details: `HR updated attendance record for ${newRecord.employeeName} on ${newRecord.date} (${newRecord.status})`,
      newValues: newRecord,
    });

    return newRecord;
  },

  async markAttendance(record: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    return this.markManualAttendance(record);
  },
};
