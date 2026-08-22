import { LeaveRequest, LeaveBalance, LeaveType, LeaveStatus } from '../types/hrms';
import { getStoreItem, setStoreItem, STORAGE_KEYS, apiClient } from './api';
import { INITIAL_LEAVE_REQUESTS, INITIAL_LEAVE_BALANCES, INITIAL_EMPLOYEES } from '../data/mockData';
import { auditService } from './auditService';
import { notificationService } from './notificationService';

export const leaveService = {
  async getLeaveRequests(filters?: {
    employeeId?: string;
    status?: LeaveStatus;
    departmentName?: string;
  }): Promise<LeaveRequest[]> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.get('/leaves', { params: filters });
        return response.data;
      } catch (err) {
        console.warn('Backend getLeaveRequests failed, using local store', err);
      }
    }

    let requests = getStoreItem<LeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
    if (!Array.isArray(requests)) {
      requests = Array.isArray(INITIAL_LEAVE_REQUESTS) ? [...INITIAL_LEAVE_REQUESTS] : [];
    }

    if (filters) {
      if (filters.employeeId) {
        requests = requests.filter((r) => r && r.employeeId === filters.employeeId);
      }
      if (filters.status && (filters.status as string) !== 'ALL') {
        requests = requests.filter((r) => r && r.status === filters.status);
      }
      if (filters.departmentName && filters.departmentName !== 'ALL') {
        requests = requests.filter((r) => r && r.departmentName === filters.departmentName);
      }
    }

    return requests.sort((a, b) => (b?.appliedDate || '').localeCompare(a?.appliedDate || ''));
  },

  async getLeaveBalance(employeeId: string, year = 2026): Promise<LeaveBalance> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.get(`/leaves/balance/${employeeId}`, { params: { year } });
        if (response.data) return response.data;
      } catch (err) {
        console.warn('Backend getLeaveBalance failed, using local store', err);
      }
    }

    let balances = getStoreItem<LeaveBalance[]>(STORAGE_KEYS.LEAVE_BALANCES, INITIAL_LEAVE_BALANCES);
    if (!Array.isArray(balances)) {
      balances = Array.isArray(INITIAL_LEAVE_BALANCES) ? [...INITIAL_LEAVE_BALANCES] : [];
    }
    const existing = balances.find((b) => b && b.employeeId === employeeId && b.year === year);

    if (existing) return existing;

    // Default balance if not found
    const newBal: LeaveBalance = {
      id: `lb-${employeeId}`,
      employeeId,
      year,
      paidLeaveTotal: 18,
      paidLeaveUsed: 0,
      paidLeavePending: 0,
      paidLeaveRemaining: 18,
      sickLeaveTotal: 10,
      sickLeaveUsed: 0,
      sickLeavePending: 0,
      sickLeaveRemaining: 10,
      unpaidLeaveUsed: 0,
      casualLeaveTotal: 6,
      casualLeaveUsed: 0,
      casualLeaveRemaining: 6,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setStoreItem(STORAGE_KEYS.LEAVE_BALANCES, [...balances, newBal]);
    return newBal;
  },

  calculateWorkingDays(startDate: string, endDate: string): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return 0;

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const dayOfWeek = cur.getDay();
      // Count Monday (1) to Friday (5) as working days
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return Math.max(1, count);
  },

  async applyLeave(data: {
    employeeId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<LeaveRequest> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.post('/leaves/apply', data);
        return response.data;
      } catch (err) {
        console.warn('Backend applyLeave failed, using local store', err);
      }
    }

    const employees = getStoreItem<any[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const emp = employees.find((e) => e.id === data.employeeId);
    const totalDays = this.calculateWorkingDays(data.startDate, data.endDate);

    const requests = getStoreItem<LeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);

    const newRequest: LeaveRequest = {
      id: `lr-${Date.now()}`,
      employeeId: data.employeeId,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Employee',
      employeeCode: emp?.employeeCode || 'DF-EMP',
      departmentName: emp?.departmentName || 'Engineering',
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays,
      reason: data.reason,
      status: 'PENDING',
      appliedDate: new Date().toISOString().split('T')[0],
    };

    const updatedRequests = [newRequest, ...requests];
    setStoreItem(STORAGE_KEYS.LEAVE_REQUESTS, updatedRequests);

    // Update pending balance
    const balances = getStoreItem<LeaveBalance[]>(STORAGE_KEYS.LEAVE_BALANCES, INITIAL_LEAVE_BALANCES);
    const bal = balances.find((b) => b.employeeId === data.employeeId);
    if (bal) {
      if (data.leaveType === 'PAID') bal.paidLeavePending += totalDays;
      if (data.leaveType === 'SICK') bal.sickLeavePending += totalDays;
      setStoreItem(STORAGE_KEYS.LEAVE_BALANCES, balances);
    }

    await auditService.logAction({
      action: 'CREATE',
      tableName: 'leave_requests',
      recordId: newRequest.id,
      details: `${newRequest.employeeName} submitted ${data.leaveType} leave request for ${totalDays} days (${data.startDate} to ${data.endDate})`,
      newValues: newRequest,
    });

    await notificationService.createNotification({
      targetRole: 'HR',
      title: 'New Leave Request',
      message: `${newRequest.employeeName} submitted a ${data.leaveType} leave request for ${totalDays} days.`,
      category: 'LEAVE',
      actionUrl: '/leave/requests',
    });

    return newRequest;
  },

  async reviewLeave(
    requestId: string,
    decision: 'APPROVED' | 'REJECTED',
    reviewComment: string
  ): Promise<LeaveRequest> {
    if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const response = await apiClient.post(`/leaves/${requestId}/review`, { decision, reviewComment });
        return response.data;
      } catch (err) {
        console.warn('Backend reviewLeave failed, using local store', err);
      }
    }

    const requests = getStoreItem<LeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
    const existing = requests.find((r) => r.id === requestId);
    if (!existing) throw new Error('Leave request not found');

    const currentUserStr = localStorage.getItem('dayflow_current_user');
    let reviewerName = 'HR Manager';
    let reviewerId = 'usr-hr-1';
    if (currentUserStr) {
      try {
        const u = JSON.parse(currentUserStr);
        reviewerName = u.name;
        reviewerId = u.id;
      } catch {}
    }

    const updatedRequest: LeaveRequest = {
      ...existing,
      status: decision,
      reviewedBy: reviewerId,
      reviewerName,
      reviewComment,
      reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    const updatedRequests = requests.map((r) => (r.id === requestId ? updatedRequest : r));
    setStoreItem(STORAGE_KEYS.LEAVE_REQUESTS, updatedRequests);

    // Update balances
    const balances = getStoreItem<LeaveBalance[]>(STORAGE_KEYS.LEAVE_BALANCES, INITIAL_LEAVE_BALANCES);
    const bal = balances.find((b) => b.employeeId === existing.employeeId);
    if (bal) {
      if (existing.leaveType === 'PAID') {
        bal.paidLeavePending = Math.max(0, bal.paidLeavePending - existing.totalDays);
        if (decision === 'APPROVED') {
          bal.paidLeaveUsed += existing.totalDays;
          bal.paidLeaveRemaining = Math.max(0, bal.paidLeaveTotal - bal.paidLeaveUsed);
        }
      } else if (existing.leaveType === 'SICK') {
        bal.sickLeavePending = Math.max(0, bal.sickLeavePending - existing.totalDays);
        if (decision === 'APPROVED') {
          bal.sickLeaveUsed += existing.totalDays;
          bal.sickLeaveRemaining = Math.max(0, bal.sickLeaveTotal - bal.sickLeaveUsed);
        }
      } else if (existing.leaveType === 'CASUAL') {
        if (decision === 'APPROVED') {
          bal.casualLeaveUsed += existing.totalDays;
          bal.casualLeaveRemaining = Math.max(0, bal.casualLeaveTotal - bal.casualLeaveUsed);
        }
      } else if (existing.leaveType === 'UNPAID') {
        if (decision === 'APPROVED') {
          bal.unpaidLeaveUsed += existing.totalDays;
        }
      }
      setStoreItem(STORAGE_KEYS.LEAVE_BALANCES, balances);
    }

    await auditService.logAction({
      action: 'UPDATE',
      tableName: 'leave_requests',
      recordId: requestId,
      details: `${reviewerName} ${decision.toLowerCase()} leave request for ${existing.employeeName}: "${reviewComment}"`,
      oldValues: existing,
      newValues: updatedRequest,
    });

    await notificationService.createNotification({
      userId: existing.employeeId,
      targetRole: 'EMPLOYEE',
      title: `Leave Request ${decision === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      message: `Your ${existing.leaveType} leave request for ${existing.startDate} has been ${decision.toLowerCase()}: ${reviewComment}`,
      category: 'LEAVE',
      actionUrl: '/leave',
    });

    return updatedRequest;
  },

  async cancelLeave(requestId: string): Promise<LeaveRequest> {
    const requests = getStoreItem<LeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
    const existing = requests.find((r) => r.id === requestId);
    if (!existing) throw new Error('Leave request not found');

    const updatedRequest: LeaveRequest = {
      ...existing,
      status: 'CANCELLED',
      reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    const updatedRequests = requests.map((r) => (r.id === requestId ? updatedRequest : r));
    setStoreItem(STORAGE_KEYS.LEAVE_REQUESTS, updatedRequests);

    // Revert pending balances
    const balances = getStoreItem<LeaveBalance[]>(STORAGE_KEYS.LEAVE_BALANCES, INITIAL_LEAVE_BALANCES);
    const bal = balances.find((b) => b.employeeId === existing.employeeId);
    if (bal) {
      if (existing.leaveType === 'PAID') {
        bal.paidLeavePending = Math.max(0, bal.paidLeavePending - existing.totalDays);
      } else if (existing.leaveType === 'SICK') {
        bal.sickLeavePending = Math.max(0, bal.sickLeavePending - existing.totalDays);
      }
      setStoreItem(STORAGE_KEYS.LEAVE_BALANCES, balances);
    }

    await auditService.logAction({
      action: 'UPDATE',
      tableName: 'leave_requests',
      recordId: requestId,
      details: `Leave request ${requestId} was cancelled by employee`,
      oldValues: existing,
      newValues: updatedRequest,
    });

    return updatedRequest;
  },

  async approveLeave(requestId: string, reviewerName?: string): Promise<LeaveRequest> {
    return this.reviewLeave(requestId, 'APPROVED', `Approved by ${reviewerName || 'HR'}`);
  },

  async rejectLeave(requestId: string, reviewerName?: string, reason?: string): Promise<LeaveRequest> {
    return this.reviewLeave(requestId, 'REJECTED', reason || `Rejected by ${reviewerName || 'HR'}`);
  },

  async approveLeaveRequest(requestId: string, reviewerName?: string): Promise<LeaveRequest> {
    return this.reviewLeave(requestId, 'APPROVED', `Approved by ${reviewerName || 'HR'}`);
  },

  async rejectLeaveRequest(requestId: string, reason: string, reviewerName?: string): Promise<LeaveRequest> {
    return this.reviewLeave(requestId, 'REJECTED', reason || `Rejected by ${reviewerName || 'HR'}`);
  },

  async cancelLeaveRequest(requestId: string, employeeId?: string): Promise<LeaveRequest> {
    return this.cancelLeave(requestId);
  },
};
