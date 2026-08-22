export type UserRole = 'ADMIN' | 'HR' | 'EMPLOYEE';

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';

export type LeaveType = 'PAID' | 'SICK' | 'UNPAID' | 'CASUAL' | 'MATERNITY';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type PayrollStatus = 'DRAFT' | 'PROCESSING' | 'PROCESSED' | 'PAID' | 'CANCELLED';

export type DocumentType = 'ID_PROOF' | 'EMPLOYMENT_DOCUMENT' | 'CERTIFICATE' | 'RESUME' | 'SALARY_DOCUMENT' | 'OTHER';

export type NotificationCategory = 'LEAVE' | 'ATTENDANCE' | 'PAYROLL' | 'PROFILE' | 'SYSTEM' | 'ANNOUNCEMENT';

export type TargetRole = 'ALL' | 'ADMIN' | 'HR' | 'EMPLOYEE';
export type TargetAudience = TargetRole;
export type AnnouncementPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'STATUS_CHANGE' | 'APPROVE' | 'REJECT' | 'PROCESS';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  name: string;
  avatarUrl?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  managerId?: string;
  managerName?: string;
  employeeCount: number;
  budget?: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  title: string;
  documentType: DocumentType;
  fileUrl: string;
  fileSize?: string;
  uploadedAt: string;
  expiryDate?: string;
  notes?: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  departmentId: string;
  departmentName?: string;
  jobTitle: string;
  employmentType: EmploymentType;
  joiningDate: string;
  status: EmployeeStatus;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  address?: string;
  city?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  bankName?: string;
  accountNumber?: string;
  taxId?: string;
  basicSalary?: number;
  documents?: EmployeeDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  departmentName?: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // HH:mm:ss
  checkOut?: string; // HH:mm:ss
  workingHours: number; // in hours
  status: AttendanceStatus;
  remarks?: string;
  ipAddress?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  year: number;
  paidLeaveTotal: number;
  paidLeaveUsed: number;
  paidLeavePending: number;
  paidLeaveRemaining: number;
  sickLeaveTotal: number;
  sickLeaveUsed: number;
  sickLeavePending: number;
  sickLeaveRemaining: number;
  unpaidLeaveUsed: number;
  casualLeaveTotal: number;
  casualLeaveUsed: number;
  casualLeaveRemaining: number;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  departmentName?: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
  reviewedBy?: string;
  reviewerName?: string;
  reviewComment?: string;
  reviewedAt?: string;
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  departmentName?: string;
  basicSalary: number;
  hra: number; // House Rent Allowance
  allowances: number; // Other allowances (conveyance, medical, special)
  bonus: number;
  tax: number; // Income tax TDS
  insurance: number; // Health/life insurance
  otherDeductions: number; // Provident fund, professional tax
  grossSalary: number; // Basic + HRA + Allowances + Bonus
  totalDeductions: number; // Tax + Insurance + Other Deductions
  netSalary: number; // Gross - Deductions
  effectiveFrom: string;
  effectiveTo?: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  departmentName?: string;
  jobTitle?: string;
  payPeriod: string; // e.g., "2026-07" or "July 2026"
  paymentDate: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  bonus: number;
  grossSalary: number;
  tax: number;
  insurance: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  status: PayrollStatus;
  paymentMethod?: 'BANK_TRANSFER' | 'CHEQUE' | 'CASH';
  transactionReference?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalarySlip {
  id: string;
  slipNumber: string;
  payrollId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  jobTitle: string;
  payPeriod: string;
  paymentDate: string;
  bankName?: string;
  accountNumber?: string;
  taxId?: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  bonus: number;
  grossSalary: number;
  tax: number;
  insurance: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  generatedDate: string;
  companyName: string;
  companyAddress: string;
  companyTaxNumber: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  targetRole?: TargetRole;
  title: string;
  message: string;
  category: NotificationCategory;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRole: TargetRole;
  authorId: string;
  authorName: string;
  publishDate: string;
  expiryDate?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  tableName: string;
  recordId: string;
  ipAddress: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  details: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  pendingLeaveRequests: number;
  monthlyPayrollTotal: number;
  averageSalary: number;
  departmentCounts: { department: string; count: number; budget: number }[];
  attendanceTrend: { date: string; present: number; absent: number; leave: number; rate: number }[];
  leaveTypeBreakdown: { name: string; value: number; color: string }[];
  payrollTrend: { month: string; gross: number; deductions: number; net: number }[];
  recentActivities: AuditLogEntry[];
}

export interface EmployeeDashboardMetrics {
  employee: Employee;
  todayAttendance?: AttendanceRecord;
  leaveBalance: LeaveBalance;
  pendingLeaves: LeaveRequest[];
  latestSalarySlip?: SalarySlip;
  currentSalaryStructure?: SalaryStructure;
  attendanceStats: {
    presentDaysThisMonth: number;
    absentDaysThisMonth: number;
    leaveDaysThisMonth: number;
    workingHoursThisMonth: number;
    attendanceRate: number;
  };
  recentAnnouncements: Announcement[];
  recentNotifications: NotificationItem[];
}
