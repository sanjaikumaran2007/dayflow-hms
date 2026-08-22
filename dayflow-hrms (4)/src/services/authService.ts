import { User, UserRole, Employee, LeaveBalance } from '../types/hrms';
import { getStoreItem, setStoreItem, STORAGE_KEYS, apiClient } from './api';
import { INITIAL_USERS, INITIAL_EMPLOYEES, INITIAL_LEAVE_BALANCES } from '../data/mockData';

interface VerificationRecord {
  email: string;
  code: string;
  expiresAt: number;
  createdAt: number;
}

export const authService = {
  /**
   * Generates a 6-digit email verification code and saves it to local database
   */
  async sendVerificationCode(email: string): Promise<{ success: boolean; code: string; message: string; expiresAt: number }> {
    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid email address.');
    }

    // Generate a 6-digit secure numeric verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

    const records = getStoreItem<VerificationRecord[]>(STORAGE_KEYS.VERIFICATION_CODES, []);
    const cleanRecords = Array.isArray(records) ? records.filter((r) => r.expiresAt > Date.now() && r.email.toLowerCase() !== email.toLowerCase()) : [];
    
    cleanRecords.push({
      email: email.toLowerCase().trim(),
      code,
      expiresAt,
      createdAt: Date.now(),
    });

    setStoreItem(STORAGE_KEYS.VERIFICATION_CODES, cleanRecords);

    return {
      success: true,
      code,
      message: `A 6-digit verification code has been sent to ${email}`,
      expiresAt,
    };
  },

  /**
   * Verifies the 6-digit code for a given email
   */
  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    if (!email || !code) return false;
    const records = getStoreItem<VerificationRecord[]>(STORAGE_KEYS.VERIFICATION_CODES, []);
    const record = Array.isArray(records)
      ? records.find((r) => r.email.toLowerCase() === email.toLowerCase().trim() && r.code === code.trim())
      : null;

    if (!record) {
      throw new Error('Invalid verification code. Please check and try again.');
    }

    if (Date.now() > record.expiresAt) {
      throw new Error('Verification code has expired. Please request a new code.');
    }

    return true;
  },

  /**
   * Registers a new user account with email verification code and creates employee profile in the database
   */
  async signUp(params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    code: string;
    jobTitle?: string;
    departmentId?: string;
    phone?: string;
  }): Promise<{ user: User; token: string }> {
    const { name, email, password, role, code, jobTitle, departmentId, phone } = params;

    // 1. Verify code
    await this.verifyEmailCode(email, code);

    // 2. Check if user already exists
    const users = getStoreItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const existing = Array.isArray(users) ? users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) : null;
    if (existing) {
      throw new Error(`An account with email ${email} already exists. Please sign in.`);
    }

    // 3. Create Employee profile
    const employees = getStoreItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const empCode = `EMP-${String((Array.isArray(employees) ? employees.length : 0) + 1).padStart(3, '0')}`;
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(' ') || 'Staff';
    const employeeId = `emp-${Date.now()}`;

    const newEmployee: Employee = {
      id: employeeId,
      employeeCode: empCode,
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      phone: phone || '+1 (555) 019-2834',
      departmentId: departmentId || 'dept-1',
      departmentName: departmentId === 'dept-2' ? 'Human Resources' : 'Engineering & Technology',
      jobTitle: jobTitle || (role === 'HR' ? 'HR Specialist' : role === 'ADMIN' ? 'System Administrator' : 'Software Engineer'),
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      joiningDate: new Date().toISOString().split('T')[0],
      basicSalary: 6500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedEmployees = Array.isArray(employees) ? [newEmployee, ...employees] : [newEmployee];
    setStoreItem(STORAGE_KEYS.EMPLOYEES, updatedEmployees);

    // 4. Create User profile
    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: email.toLowerCase().trim(),
      role: role || 'EMPLOYEE',
      name: name.trim(),
      employeeId: newEmployee.id,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    const updatedUsers = Array.isArray(users) ? [newUser, ...users] : [newUser];
    setStoreItem(STORAGE_KEYS.USERS, updatedUsers);

    // 5. Store Password
    const passwords = getStoreItem<Record<string, string>>(STORAGE_KEYS.PASSWORDS, {});
    passwords[email.toLowerCase().trim()] = password;
    setStoreItem(STORAGE_KEYS.PASSWORDS, passwords);

    // 6. Create initial Leave Balance
    const balances = getStoreItem<LeaveBalance[]>(STORAGE_KEYS.LEAVE_BALANCES, INITIAL_LEAVE_BALANCES);
    const newBalance: LeaveBalance = {
      id: `bal-${Date.now()}`,
      employeeId: newEmployee.id,
      year: 2026,
      paidLeaveTotal: 18,
      paidLeaveUsed: 0,
      paidLeavePending: 0,
      paidLeaveRemaining: 18,
      sickLeaveTotal: 12,
      sickLeaveUsed: 0,
      sickLeavePending: 0,
      sickLeaveRemaining: 12,
      casualLeaveTotal: 10,
      casualLeaveUsed: 0,
      casualLeaveRemaining: 10,
      unpaidLeaveUsed: 0,
      updatedAt: new Date().toISOString(),
    };
    setStoreItem(STORAGE_KEYS.LEAVE_BALANCES, [newBalance, ...(Array.isArray(balances) ? balances : [])]);

    // 7. Store Auth Token & Current Session
    const token = `dayflow-jwt-${newUser.id}-${Date.now()}`;
    localStorage.setItem('dayflow_auth_token', token);
    localStorage.setItem('dayflow_current_user', JSON.stringify(newUser));

    return { user: newUser, token };
  },

  async login(email: string, password?: string, verificationCode?: string): Promise<{ user: User; token: string }> {
    const hasBackend = Boolean(import.meta.env.VITE_API_BASE_URL);
    if (hasBackend) {
      try {
        const response = await apiClient.post('/auth/login', { email, password, verificationCode });
        localStorage.setItem('dayflow_auth_token', response.data.token);
        localStorage.setItem('dayflow_current_user', JSON.stringify(response.data.user));
        return response.data;
      } catch (err) {
        console.warn('Backend login failed, falling back to local store', err);
      }
    }

    // Mock / Local store login
    const users = getStoreItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const user = Array.isArray(users) ? users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) : null;

    if (!user) {
      throw new Error('No account found with this email address. Please sign up or choose a demo persona.');
    }

    // If verification code is supplied, check it
    if (verificationCode) {
      await this.verifyEmailCode(email, verificationCode);
    }

    // If password check is enforced for newly registered users
    const passwords = getStoreItem<Record<string, string>>(STORAGE_KEYS.PASSWORDS, {});
    const customPassword = passwords[email.toLowerCase().trim()];
    if (customPassword && password && customPassword !== password) {
      throw new Error('Incorrect password. Please try again or reset your password.');
    }

    const updatedUser: User = {
      ...user,
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    // Update in users store
    const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
    setStoreItem(STORAGE_KEYS.USERS, updatedUsers);

    const token = `mock-jwt-token-${user.id}-${Date.now()}`;
    localStorage.setItem('dayflow_auth_token', token);
    localStorage.setItem('dayflow_current_user', JSON.stringify(updatedUser));

    return { user: updatedUser, token };
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    await this.verifyEmailCode(email, code);
    const passwords = getStoreItem<Record<string, string>>(STORAGE_KEYS.PASSWORDS, {});
    passwords[email.toLowerCase().trim()] = newPassword;
    setStoreItem(STORAGE_KEYS.PASSWORDS, passwords);
  },

  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem('dayflow_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem('dayflow_auth_token');
    localStorage.removeItem('dayflow_current_user');
  },

  async switchRoleUser(role: UserRole): Promise<User> {
    const users = getStoreItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const targetUser = (Array.isArray(users) ? users.find((u) => u.role === role) : null) || INITIAL_USERS[0];
    localStorage.setItem('dayflow_current_user', JSON.stringify(targetUser));
    return targetUser;
  },
};
