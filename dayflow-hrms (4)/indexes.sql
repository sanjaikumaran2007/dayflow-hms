USE dayflow_hrms;

CREATE INDEX idx_users_role
ON users(role);

CREATE INDEX idx_users_active
ON users(is_active);

CREATE INDEX idx_employee_status
ON employees(status);

CREATE INDEX idx_employee_department
ON employee_job_details(department_id);

CREATE INDEX idx_attendance_employee
ON attendance(employee_id);

CREATE INDEX idx_attendance_date
ON attendance(attendance_date);

CREATE INDEX idx_attendance_status
ON attendance(status);

CREATE INDEX idx_leave_employee
ON leave_requests(employee_id);

CREATE INDEX idx_leave_status
ON leave_requests(status);

CREATE INDEX idx_leave_dates
ON leave_requests(start_date, end_date);

CREATE INDEX idx_payroll_employee
ON payroll(employee_id);

CREATE INDEX idx_payroll_status
ON payroll(status);

CREATE INDEX idx_notifications_user
ON notifications(user_id);

CREATE INDEX idx_notifications_read
ON notifications(is_read);

CREATE INDEX idx_audit_user
ON audit_logs(user_id);

CREATE INDEX idx_audit_table
ON audit_logs(table_name);