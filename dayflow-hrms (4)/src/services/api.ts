import axios from 'axios';
import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVE_BALANCES,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_SALARY_STRUCTURES,
  INITIAL_PAYROLL,
  INITIAL_SALARY_SLIPS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_AUDIT_LOGS,
} from '../data/mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('dayflow_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Local Database Storage Helper (Fallback when REST backend is offline or VITE_API_BASE_URL is not set)
const STORAGE_KEYS = {
  USERS: 'dayflow_users',
  EMPLOYEES: 'dayflow_employees',
  DEPARTMENTS: 'dayflow_departments',
  ATTENDANCE: 'dayflow_attendance',
  LEAVE_BALANCES: 'dayflow_leave_balances',
  LEAVE_REQUESTS: 'dayflow_leave_requests',
  SALARY_STRUCTURES: 'dayflow_salary_structures',
  PAYROLL: 'dayflow_payroll',
  SALARY_SLIPS: 'dayflow_salary_slips',
  NOTIFICATIONS: 'dayflow_notifications',
  ANNOUNCEMENTS: 'dayflow_announcements',
  AUDIT_LOGS: 'dayflow_audit_logs',
  VERIFICATION_CODES: 'dayflow_verification_codes',
  PASSWORDS: 'dayflow_passwords',
};

// Initialize Storage with Seed Data if empty
export const initLocalStorageStore = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(INITIAL_DEPARTMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
  }
  if (!localStorage.getItem(STORAGE_KEYS.LEAVE_BALANCES)) {
    localStorage.setItem(STORAGE_KEYS.LEAVE_BALANCES, JSON.stringify(INITIAL_LEAVE_BALANCES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS)) {
    localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(INITIAL_LEAVE_REQUESTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SALARY_STRUCTURES)) {
    localStorage.setItem(STORAGE_KEYS.SALARY_STRUCTURES, JSON.stringify(INITIAL_SALARY_STRUCTURES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYROLL)) {
    localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(INITIAL_PAYROLL));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SALARY_SLIPS)) {
    localStorage.setItem(STORAGE_KEYS.SALARY_SLIPS, JSON.stringify(INITIAL_SALARY_SLIPS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
  }
};

export const getStoreItem = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    if (parsed === null || parsed === undefined) return fallback;
    
    // If fallback is an array, strictly ensure parsed is an array
    if (Array.isArray(fallback)) {
      if (!Array.isArray(parsed)) {
        try {
          localStorage.setItem(key, JSON.stringify(fallback));
        } catch {
          // ignore
        }
        return fallback;
      }
    }
    return parsed as T;
  } catch {
    return fallback;
  }
};

export const setStoreItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to persist to localStorage', err);
  }
};

export { STORAGE_KEYS };
