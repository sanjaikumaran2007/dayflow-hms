USE dayflow_hrms;

INSERT INTO departments
(name, description)
VALUES
('Engineering', 'Software development department'),
('Human Resources', 'HR and employee management'),
('Finance', 'Finance and accounting'),
('Marketing', 'Marketing department'),
('Operations', 'Business operations');

INSERT INTO leave_types
(name, description, default_days, is_paid)
VALUES
('Paid Leave', 'Annual paid leave', 20, TRUE),
('Sick Leave', 'Medical and health leave', 10, TRUE),
('Unpaid Leave', 'Unpaid employee leave', 30, FALSE);