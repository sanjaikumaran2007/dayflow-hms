// src/db/schema.ts
import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  date,
  decimal,
  integer,
  json,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'HR', 'EMPLOYEE']);
export const genderEnum = pgEnum('gender', ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']);
export const employeeStatusEnum = pgEnum('employee_status', ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']);
export const employmentTypeEnum = pgEnum('employment_type', ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMPORARY']);
export const documentTypeEnum = pgEnum('document_type', ['ID_PROOF', 'EMPLOYMENT_DOCUMENT', 'CERTIFICATE', 'RESUME', 'SALARY_DOCUMENT', 'OTHER']);
export const payrollStatusEnum = pgEnum('payroll_status', ['DRAFT', 'PROCESSING', 'PROCESSED', 'PAID', 'CANCELLED']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE']);
export const attendanceEventTypeEnum = pgEnum('attendance_event_type', ['CHECK_IN', 'CHECK_OUT', 'MANUAL_ADJUSTMENT']);
export const leaveRequestStatusEnum = pgEnum('leave_request_status', ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);
export const leaveApprovalActionEnum = pgEnum('leave_approval_action', ['SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED']);
export const notificationTypeEnum = pgEnum('notification_type', ['LEAVE', 'ATTENDANCE', 'PAYROLL', 'PROFILE', 'SYSTEM', 'ANNOUNCEMENT']);
export const targetRoleEnum = pgEnum('target_role', ['ALL', 'ADMIN', 'HR', 'EMPLOYEE']);

// Tables
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: varchar('uid', { length: 255 }).unique(), // Firebase Auth UID
  employeeId: integer('employee_id'),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: userRoleEnum('role').notNull().default('EMPLOYEE'),
  profileImage: varchar('profile_image', { length: 512 }),
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').notNull().default(true),
  emailVerified: boolean('email_verified').notNull().default(false),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  managerId: integer('manager_id'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  employeeCode: varchar('employee_code', { length: 50 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  dateOfBirth: date('date_of_birth'),
  gender: genderEnum('gender').default('OTHER'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }).notNull(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  profileImage: varchar('profile_image', { length: 512 }),
  status: employeeStatusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const employeeJobDetails = pgTable('employee_job_details', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  departmentId: integer('department_id').notNull(),
  jobTitle: varchar('job_title', { length: 150 }).notNull(),
  employmentType: employmentTypeEnum('employment_type').notNull().default('FULL_TIME'),
  joiningDate: date('joining_date').notNull(),
  reportingManagerId: integer('reporting_manager_id'),
  workLocation: varchar('work_location', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const employeeDocuments = pgTable('employee_documents', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  documentType: documentTypeEnum('document_type').notNull(),
  documentName: varchar('document_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 512 }).notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  uploadedBy: integer('uploaded_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const salaryStructures = pgTable('salary_structures', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  basicSalary: decimal('basic_salary', { precision: 12, scale: 2 }).notNull(),
  hra: decimal('hra', { precision: 12, scale: 2 }).notNull().default('0.00'),
  allowances: decimal('allowances', { precision: 12, scale: 2 }).notNull().default('0.00'),
  bonus: decimal('bonus', { precision: 12, scale: 2 }).notNull().default('0.00'),
  tax: decimal('tax', { precision: 12, scale: 2 }).notNull().default('0.00'),
  insurance: decimal('insurance', { precision: 12, scale: 2 }).notNull().default('0.00'),
  otherDeductions: decimal('other_deductions', { precision: 12, scale: 2 }).notNull().default('0.00'),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const payroll = pgTable('payroll', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  payPeriodStart: date('pay_period_start').notNull(),
  payPeriodEnd: date('pay_period_end').notNull(),
  basicSalary: decimal('basic_salary', { precision: 12, scale: 2 }).notNull(),
  allowances: decimal('allowances', { precision: 12, scale: 2 }).notNull(),
  bonus: decimal('bonus', { precision: 12, scale: 2 }).notNull(),
  grossSalary: decimal('gross_salary', { precision: 12, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 12, scale: 2 }).notNull(),
  insurance: decimal('insurance', { precision: 12, scale: 2 }).notNull(),
  otherDeductions: decimal('other_deductions', { precision: 12, scale: 2 }).notNull(),
  totalDeductions: decimal('total_deductions', { precision: 12, scale: 2 }).notNull(),
  netSalary: decimal('net_salary', { precision: 12, scale: 2 }).notNull(),
  status: payrollStatusEnum('status').default('DRAFT').notNull(),
  processedBy: integer('processed_by'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const salarySlips = pgTable('salary_slips', {
  id: serial('id').primaryKey(),
  payrollId: integer('payroll_id').notNull(),
  employeeId: integer('employee_id').notNull(),
  slipNumber: varchar('slip_number', { length: 100 }).notNull().unique(),
  filePath: varchar('file_path', { length: 512 }).notNull(),
  generatedBy: integer('generated_by'),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
});

export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  attendanceDate: date('attendance_date').notNull(),
  checkIn: timestamp('check_in'),
  checkOut: timestamp('check_out'),
  workingHours: decimal('working_hours', { precision: 5, scale: 2 }),
  status: attendanceStatusEnum('status').notNull().default('PRESENT'),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const attendanceLogs = pgTable('attendance_logs', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  attendanceId: integer('attendance_id').notNull(),
  eventType: attendanceEventTypeEnum('event_type').notNull(),
  eventTime: timestamp('event_time').defaultNow().notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  deviceInfo: text('device_info'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leaveTypes = pgTable('leave_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  defaultDays: integer('default_days').notNull(),
  isPaid: boolean('is_paid').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leaveBalances = pgTable('leave_balances', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  leaveTypeId: integer('leave_type_id').notNull(),
  year: integer('year').notNull(),
  allocatedDays: integer('allocated_days').notNull(),
  usedDays: integer('used_days').notNull().default(0),
  pendingDays: integer('pending_days').notNull().default(0),
  remainingDays: integer('remaining_days').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leaveRequests = pgTable('leave_requests', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  leaveTypeId: integer('leave_type_id').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  numberOfDays: integer('number_of_days').notNull(),
  remarks: text('remarks'),
  status: leaveRequestStatusEnum('status').default('PENDING').notNull(),
  approvedBy: integer('approved_by'),
  approvedAt: timestamp('approved_at'),
  adminComment: text('admin_comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leaveApprovalHistory = pgTable('leave_approval_history', {
  id: serial('id').primaryKey(),
  leaveRequestId: integer('leave_request_id').notNull(),
  action: leaveApprovalActionEnum('action').notNull(),
  actionBy: integer('action_by').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  notificationType: notificationTypeEnum('notification_type').notNull(),
  referenceId: integer('reference_id'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  createdBy: integer('created_by'),
  authorName: varchar('author_name', { length: 150 }),
  targetRole: targetRoleEnum('target_role').notNull().default('ALL'),
  isActive: boolean('is_active').notNull().default(true),
  publishAt: timestamp('publish_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  userName: varchar('user_name', { length: 150 }),
  action: varchar('action', { length: 255 }).notNull(),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: varchar('record_id', { length: 100 }),
  oldData: json('old_data'),
  newData: json('new_data'),
  ipAddress: varchar('ip_address', { length: 45 }),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  employee: one(employees, {
    fields: [users.employeeId],
    references: [employees.id],
  }),
  notifications: many(notifications),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  jobDetails: many(employeeJobDetails),
  documents: many(employeeDocuments),
  salaryStructures: many(salaryStructures),
  payrolls: many(payroll),
  attendances: many(attendance),
  leaveBalances: many(leaveBalances),
  leaveRequests: many(leaveRequests),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  manager: one(employees, {
    fields: [departments.managerId],
    references: [employees.id],
  }),
  jobDetails: many(employeeJobDetails),
}));

export const employeeJobDetailsRelations = relations(employeeJobDetails, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeJobDetails.employeeId],
    references: [employees.id],
  }),
  department: one(departments, {
    fields: [employeeJobDetails.departmentId],
    references: [departments.id],
  }),
  manager: one(employees, {
    fields: [employeeJobDetails.reportingManagerId],
    references: [employees.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one, many }) => ({
  employee: one(employees, {
    fields: [leaveRequests.employeeId],
    references: [employees.id],
  }),
  leaveType: one(leaveTypes, {
    fields: [leaveRequests.leaveTypeId],
    references: [leaveTypes.id],
  }),
  approvalHistory: many(leaveApprovalHistory),
}));
