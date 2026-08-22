SELECT *
FROM users;
SELECT *
FROM employees;

SELECT
    e.employee_code,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    d.name AS department,
    j.job_title
FROM employees e

JOIN employee_job_details j
    ON e.id = j.employee_id

JOIN departments d
    ON j.department_id = d.id;

SELECT
    e.employee_code,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    a.check_in,
    a.check_out,
    a.working_hours,
    a.status
FROM attendance a

JOIN employees e
    ON a.employee_id = e.id

WHERE a.attendance_date = CURDATE();

SELECT
    lr.id,
    e.employee_code,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    lt.name AS leave_type,
    lr.start_date,
    lr.end_date,
    lr.number_of_days,
    lr.status
FROM leave_requests lr

JOIN employees e
    ON lr.employee_id = e.id

JOIN leave_types lt
    ON lr.leave_type_id = lt.id

WHERE lr.status = 'PENDING';