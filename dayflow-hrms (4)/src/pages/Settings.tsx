import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Settings as SettingsIcon,
  Building,
  Clock,
  Calendar,
  Database,
  Save,
  Server,
  ShieldCheck,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { showToast } = useToast();

  const [companyName, setCompanyName] = useState('Dayflow Technologies Inc.');
  const [fiscalYear, setFiscalYear] = useState('2026');
  const [currency, setCurrency] = useState('USD ($)');
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('17:30');
  const [paidLeaveLimit, setPaidLeaveLimit] = useState(18);
  const [sickLeaveLimit, setSickLeaveLimit] = useState(10);
  const [casualLeaveLimit, setCasualLeaveLimit] = useState(6);

  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('HRMS system configuration updated successfully', 'success');
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Organization & System Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure corporate policies, shift schedules, statutory leave allowances, and API parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Info */}
        <Card title="Company Information">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="setting-comp-name"
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
              <Input
                id="setting-fiscal-year"
                label="Active Fiscal Year"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="setting-currency"
                label="Base Payroll Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                required
              />
              <Input
                id="setting-reg-id"
                label="Tax Identification / EIN"
                value="EIN-98-7654321"
                disabled
              />
            </div>
          </div>
        </Card>

        {/* Working Hours & Shift Rules */}
        <Card title="Shift & Working Hours Rules">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="setting-work-start"
                label="Standard Shift Start Time"
                type="time"
                value={workStartTime}
                onChange={(e) => setWorkStartTime(e.target.value)}
              />
              <Input
                id="setting-work-end"
                label="Standard Shift End Time"
                type="time"
                value={workEndTime}
                onChange={(e) => setWorkEndTime(e.target.value)}
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border text-xs text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
              Shift hours are used by the automated biometric timecard engine to calculate total daily work hours, half-day triggers (&lt; 4.5 hrs), and overtime allowances.
            </div>
          </div>
        </Card>

        {/* Annual Leave Allowances */}
        <Card title="Statutory Annual Leave Allocations">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="setting-paid-leave"
              label="Paid Annual Days"
              type="number"
              value={paidLeaveLimit}
              onChange={(e) => setPaidLeaveLimit(Number(e.target.value))}
            />
            <Input
              id="setting-sick-leave"
              label="Sick / Medical Days"
              type="number"
              value={sickLeaveLimit}
              onChange={(e) => setSickLeaveLimit(Number(e.target.value))}
            />
            <Input
              id="setting-casual-leave"
              label="Casual Short Leave Days"
              type="number"
              value={casualLeaveLimit}
              onChange={(e) => setCasualLeaveLimit(Number(e.target.value))}
            />
          </div>
        </Card>

        {/* Architecture & Backend Diagnostics */}
        <Card title="System Architecture & Storage Backend">
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    REST API Backend Gateway
                  </span>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {import.meta.env.VITE_API_BASE_URL || 'Local High-Performance Storage Engine (Simulated REST)'}
                  </p>
                </div>
              </div>
              <Badge variant="success" size="sm">
                Connected
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    Relational MySQL Schema Compliance
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Tables: employees, departments, attendance, leave_requests, salary_structures, payroll, audit_logs
                  </p>
                </div>
              </div>
              <Badge variant="info" size="sm">
                Schema v2.4
              </Badge>
            </div>
          </div>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button
            id="save-system-settings-btn"
            type="submit"
            leftIcon={<Save className="w-4 h-4" />}
            isLoading={saving}
          >
            Save Organization Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
