import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  User,
  Mail,
  Shield,
  Phone,
  Building2,
  Calendar,
  Lock,
  CheckCircle2,
  Save,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, employeeProfile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || 'Jane Smith');
  const [email, setEmail] = useState(user?.email || 'jane.smith@dayflow.com');
  const [phone, setPhone] = useState(employeeProfile?.phone || '+1 (555) 234-5678');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Profile information updated successfully', 'success');
    }, 600);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'warning');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password credentials changed securely', 'success');
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          My Account & Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage personal credentials, contact information, and role privileges.
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
            {user?.name?.slice(0, 2).toUpperCase() || 'DF'}
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user?.name}
              </h2>
              <Badge variant="purple" size="sm">
                {user?.role}
              </Badge>
            </div>

            <p className="text-xs text-slate-500 font-mono">
              Account ID: {user?.id} &bull; Employee Ref: {user?.employeeId || 'N/A'}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user?.email}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {employeeProfile?.departmentName || 'Administration'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Info Form */}
      <Card title="Personal & Contact Details">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="profile-name-input"
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              id="profile-email-input"
              label="Work Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="profile-phone-input"
              label="Contact Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              id="profile-role-input"
              label="Assigned System Role"
              value={user?.role || 'EMPLOYEE'}
              disabled
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              id="save-profile-btn"
              type="submit"
              leftIcon={<Save className="w-4 h-4" />}
              isLoading={saving}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Security & Password */}
      <Card title="Security & Authentication">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            id="current-password-input"
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="new-password-input"
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />
            <Input
              id="confirm-password-input"
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              id="change-password-btn"
              type="submit"
              variant="outline"
              leftIcon={<Lock className="w-4 h-4" />}
              isLoading={saving}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
