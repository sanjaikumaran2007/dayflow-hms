import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { AuditLogEntry } from '../types/hrms';
import { auditService } from '../services/auditService';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  Lock,
  Download,
  Terminal,
  Activity,
} from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const { showToast } = useToast();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');

  // Inspect Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const list = await auditService.getAuditLogs();
      setLogs(Array.isArray(list) ? list : []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load audit logs', 'error');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const safeLogs = Array.isArray(logs) ? logs : [];
  const filteredLogs = safeLogs.filter((l) => {
    if (!l) return false;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (l.userName || '').toLowerCase().includes(q) ||
      (l.details || '').toLowerCase().includes(q) ||
      (l.action || '').toLowerCase().includes(q) ||
      ((l as any).entityType || l.tableName || '').toLowerCase().includes(q);

    const matchesEntity = selectedEntity === 'ALL' || (l as any).entityType === selectedEntity || l.tableName === selectedEntity;
    const matchesAction = selectedAction === 'ALL' || l.action === selectedAction;

    return matchesSearch && matchesEntity && matchesAction;
  });

  const exportLogs = () => {
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dayflow-audit-trail-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast('Audit trail exported successfully as JSON', 'info');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              System Audit Trails & Governance
            </h1>
            <Badge variant="purple" size="sm">
              ADMIN EXCLUSIVE
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable tracking of user authentication, employee mutations, leave decisions, and payroll execution.
          </p>
        </div>

        <Button
          id="export-audit-trail-btn"
          variant="outline"
          size="sm"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={exportLogs}
        >
          Export Compliance Trail
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="audit-search-input"
              type="text"
              placeholder="Search by actor, description, action type, or entity ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white text-black font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-black"
            />
          </div>

          <select
            id="audit-entity-filter"
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="w-full sm:w-44 text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="ALL">All Entities</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="DEPARTMENT">Department</option>
            <option value="LEAVE">Leave Request</option>
            <option value="PAYROLL">Payroll</option>
            <option value="SALARY">Salary Structure</option>
            <option value="ANNOUNCEMENT">Announcement</option>
            <option value="AUTH">Authentication</option>
          </select>

          <select
            id="audit-action-filter"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full sm:w-40 text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="APPROVE">Approve</option>
            <option value="REJECT">Reject</option>
            <option value="PROCESS">Process</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Scanning audit event ledger..." />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          title="No audit entries matched"
          description="System events are recorded automatically whenever data mutations occur."
        />
      ) : (
        <Table
          id="audit-logs-table"
          headers={[
            'Timestamp',
            'Actor / Operator',
            'Action',
            'Entity Type',
            'Entity Reference',
            'Details & Mutation',
            'Inspect',
          ]}
        >
          {filteredLogs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
              <td className="px-5 py-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                {log.timestamp}
              </td>

              <td className="px-5 py-3 whitespace-nowrap">
                <span className="font-semibold text-xs text-slate-900 dark:text-white">
                  {log.userName}
                </span>
                <span className="block text-[10px] font-mono text-slate-400">
                  IP: {log.ipAddress || '127.0.0.1'}
                </span>
              </td>

              <td className="px-5 py-3 whitespace-nowrap">
                <Badge status={log.action} size="sm">
                  {log.action}
                </Badge>
              </td>

              <td className="px-5 py-3 whitespace-nowrap text-xs font-medium text-slate-700 dark:text-slate-300">
                {log.entityType}
              </td>

              <td className="px-5 py-3 whitespace-nowrap font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                {log.entityId}
              </td>

              <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300 max-w-sm truncate">
                {log.details}
              </td>

              <td className="px-5 py-3 whitespace-nowrap">
                <Button
                  id={`inspect-audit-${log.id}`}
                  size="sm"
                  variant="ghost"
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => setSelectedLog(log)}
                >
                  Inspect
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Inspect Audit Log Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-600" />
            <span>Audit Event Payload: {selectedLog?.id}</span>
          </div>
        }
        size="md"
        footer={
          <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
            Close
          </Button>
        }
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border dark:bg-slate-800 dark:border-slate-700">
              <div>
                <span className="text-slate-400 font-medium">Actor:</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {selectedLog.userName} ({selectedLog.userId})
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Timestamp:</span>
                <p className="font-mono text-slate-900 dark:text-white mt-0.5">
                  {selectedLog.timestamp}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Operation:</span>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {selectedLog.action} on {selectedLog.entityType}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Reference ID:</span>
                <p className="font-mono text-slate-900 dark:text-white mt-0.5">
                  {selectedLog.entityId}
                </p>
              </div>
            </div>

            <div>
              <span className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Summary Description:
              </span>
              <p className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                {selectedLog.details}
              </p>
            </div>

            {selectedLog.metadata && (
              <div>
                <span className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Extended Metadata / State Diff:
                </span>
                <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
