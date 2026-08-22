import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Employee } from '../types/hrms';
import { authService } from '../services/authService';
import { employeeService } from '../services/employeeService';
import { initLocalStorageStore } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  employeeProfile: Employee | null;
  login: (email: string, password?: string, verificationCode?: string) => Promise<void>;
  signUp: (params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    code: string;
    jobTitle?: string;
    departmentId?: string;
    phone?: string;
  }) => Promise<void>;
  sendVerificationCode: (email: string) => Promise<{ success: boolean; code: string; message: string; expiresAt: number }>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchProfile = async (currentUser: User) => {
    try {
      if (currentUser.employeeId) {
        const emp = await employeeService.getEmployeeById(currentUser.employeeId);
        if (emp) setEmployeeProfile(emp);
      } else {
        const employees = await employeeService.getEmployees();
        const emp = employees.find((e) => e.email.toLowerCase() === currentUser.email.toLowerCase());
        if (emp) setEmployeeProfile(emp);
      }
    } catch (err) {
      console.error('Failed to load employee profile', err);
    }
  };

  useEffect(() => {
    initLocalStorageStore();
    const stored = authService.getCurrentUser();
    if (stored) {
      setUser(stored);
      fetchProfile(stored).finally(() => setLoading(false));
    } else {
      // Auto login as ADMIN for immediate frictionless review if needed, or leave at login
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string, verificationCode?: string) => {
    setLoading(true);
    try {
      const { user: loggedInUser } = await authService.login(email, password, verificationCode);
      setUser(loggedInUser);
      await fetchProfile(loggedInUser);
      showToast(`Welcome back, ${loggedInUser.name}!`, 'success', 'Logged In');
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error', 'Authentication Error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    code: string;
    jobTitle?: string;
    departmentId?: string;
    phone?: string;
  }) => {
    setLoading(true);
    try {
      const { user: newUser } = await authService.signUp(params);
      setUser(newUser);
      await fetchProfile(newUser);
      showToast(`Account created and verified successfully! Welcome to Dayflow, ${newUser.name}.`, 'success', 'Registration Verified');
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error', 'Registration Error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationCode = async (email: string) => {
    try {
      const res = await authService.sendVerificationCode(email);
      showToast(res.message, 'info', 'Verification Code Sent');
      return res;
    } catch (err: any) {
      showToast(err.message || 'Could not send verification code', 'error', 'Verification Error');
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setEmployeeProfile(null);
    showToast('You have been logged out successfully.', 'info', 'Logged Out');
  };

  const switchRole = async (targetRole: UserRole) => {
    setLoading(true);
    try {
      const switchedUser = await authService.switchRoleUser(targetRole);
      setUser(switchedUser);
      await fetchProfile(switchedUser);
      showToast(`Switched view to ${switchedUser.name} (${targetRole})`, 'info', 'Role Switched');
    } catch (err: any) {
      showToast(err.message || 'Could not switch role', 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: Boolean(user),
        loading,
        employeeProfile,
        login,
        signUp,
        sendVerificationCode,
        logout,
        switchRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
