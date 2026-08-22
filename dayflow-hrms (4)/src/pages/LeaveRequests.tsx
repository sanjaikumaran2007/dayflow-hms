import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LeaveRequest, LeaveStatus } from '../types/hrms';
import { leaveService } from '../services/leaveService';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import {
  CalendarCheck,
  Check,
  X,
  Clock,
  Building2,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

export const LeaveRequests: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');

  // Reject Modal State
  const [rejectingRequest, setRejectingRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const list = await leaveService.getLeaveRequests();
      setRequests(list);
    } catch (err: any) {
      showToast(err.message || 'Failed to load leave requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (req: LeaveRequest) => {
    try {
      const updated = await leaveService.approveLeaveRequest(req.id, user?.name);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast(`Approved leave request for ${req.employeeName} (${req.totalDays} days)`, 'success', 'Leave Approved');
    } catch (err: any) {
      showToast(err.message || 'Failed to approve request', 'error');
    }
  };

  const handleOpenRejectModal = (req: LeaveRequest) => {
    setRejectingRequest(req);
    setRejectionReason('Operational headcount constraints / Critical project milestone');
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    setIsRejecting(true);
    try {
      const updated = await leaveService.rejectLeaveRequest(
        rejectingRequest.id,
        rejectionReason,
        user?.name
      );
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast(`Rejected leave request for ${rejectingRequest.employeeName}`, 'info', 'Leave Rejected');
      setRejectingRequest(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to reject request', 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  const safeRequests = Array.isArray(requests) ? requests : [];
  const pendingCount = safeRequests.filter((r) => r && r.status === 'PENDING').length;
  const approvedCount = safeRequests.filter((r) => r && r.status === 'APPROVED').length;
  const rejectedCount = safeRequests.filter((r) => r && r.status === 'REJECTED').length;

  const tabs = [
    { id: 'PENDING', label: 'Pending Review', count: pendingCount },
    { id: 'APPROVED', label: 'Approved', count: approvedCount },
    { id: 'REJECTED', label: 'Rejected', count: rejectedCount },
    { id: 'ALL', label: 'All Requests', count: safeRequests.length },
  ];

  const filteredRequests = safeRequests.filter((r) => {
    if (!r) return false;
    if (activeTab === 'ALL') return true;
    return r.status === activeTab;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Leave Requests & Approvals
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review, approve, or reject employee time-off applications with real-time audit recording.
          </p>
        </div>

        {pendingCount > 0 && (
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {pendingCount} Pending Approval
          </span>
        )}
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Requests Table */}
      {loading ? (
        <LoadingSpinner message="Loading leave applications..." />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title={`No ${activeTab.toLowerCase()} leave requests found`}
          description="When employees submit time-off requests, they will appear here for management action."
        />
      ) : (
        <Table
          id="leave-approvals-table"
          headers={[
            'Employee',
            'Department',
            'Leave Type',
            'Dates & Duration',
            'Applied Date',
            'Reason',
            'Status',
            'Actions',
          ]}
        >
          {filteredRequests.map((req) => (
            <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
              <td className="px-5 py-3">
                <div className="font-semibold text-xs text-slate-900 dark:text-white">
                  {req.employeeName}
                </div>
                <div className="font-mono text-[10px] text-slate-400">
                  {req.employeeCode}
                </div>
              </td>

              <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                {req.departmentName || 'Engineering'}
              </td>

              <td className="px-5 py-3 whitespace-nowrap text-xs font-semibold text-slate-800 dark:text-slate-200">
                {req.leaveType}
              </td>

              <td className="px-5 py-3 whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-300">
                <div>{req.startDate} &rarr; {req.endDate}</div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  ({req.totalDays} Days)
                </span>
              </td>

              <td className="px-5 py-3 whitespace-nowrap font-mono text-xs text-slate-500">
                {req.appliedDate}
              </td>

              <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                {req.reason}
                {req.rejectionReason && (
                  <span className="block text-rose-500 text-[10px] mt-0.5">
                    Reason: {req.rejectionReason}
                  </span>
                )}
              </td>

              <td className="px-5 py-3 whitespace-nowrap">
                <Badge status={req.status} size="sm" dot>
                  {req.status}
                </Badge>
              </td>

              <td className="px-5 py-3 whitespace-nowrap">
                {req.status === 'PENDING' ? (
                  <div className="flex items-center gap-1.5">
                    <Button
                      id={`approve-leave-${req.id}`}
                      size="sm"
                      variant="success"
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                      onClick={() => handleApprove(req)}
                    >
                      Approve
                    </Button>
                    <Button
                      id={`reject-leave-${req.id}`}
                      size="sm"
                      variant="danger"
                      leftIcon={<X className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenRejectModal(req)}
                    >
                      Reject
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-mono">
                    {req.reviewedBy ? `Reviewed by ${req.reviewedBy}` : 'Completed'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Reject Reason Modal */}
      <Modal
        isOpen={Boolean(rejectingRequest)}
        onClose={() => setRejectingRequest(null)}
        title="Reject Leave Application"
        description={`Provide mandatory rejection justification for ${rejectingRequest?.employeeName}.`}
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setRejectingRequest(null)}>
              Cancel
            </Button>
            <Button
              id="confirm-reject-leave-btn"
              variant="danger"
              size="sm"
              onClick={handleConfirmReject}
              isLoading={isRejecting}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Employee: <strong className="text-slate-800 dark:text-white">{rejectingRequest?.employeeName}</strong> ({rejectingRequest?.totalDays} days of {rejectingRequest?.leaveType} leave)
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for Rejection *
            </label>
            <textarea
              id="rejection-reason-input"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="State reason why this leave cannot be granted at this time..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              required
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
