USE dayflow_hrms;

CREATE VIEW employee_dashboard_summary AS

SELECT

    e.id AS employee_id,

    e.employee_code,

    CONCAT(
        e.first_name,
        ' ',
        COALESCE(e.last_name, '')
    ) AS employee_name,

    COUNT(
        CASE
            WHEN a.status = 'PRESENT'
            THEN 1
        END
    ) AS present_days,

    COUNT(
        CASE
            WHEN a.status = 'ABSENT'
            THEN 1
        END
    ) AS absent_days,

    COUNT(
        CASE
            WHEN a.status = 'LEAVE'
            THEN 1
        END
    ) AS leave_days

FROM employees e

LEFT JOIN attendance a
    ON e.id = a.employee_id

GROUP BY
    e.id;
    CREATE VIEW admin_dashboard_summary AS

SELECT

    (
        SELECT COUNT(*)
        FROM employees
        WHERE status != 'TERMINATED'
    ) AS total_employees,

    (
        SELECT COUNT(*)
        FROM attendance
        WHERE attendance_date = CURDATE()
        AND status = 'PRESENT'
    ) AS present_today,

    (
        SELECT COUNT(*)
        FROM attendance
        WHERE attendance_date = CURDATE()
        AND status = 'LEAVE'
    ) AS on_leave_today,

    (
        SELECT COUNT(*)
        FROM leave_requests
        WHERE status = 'PENDING'
    ) AS pending_approvals,

    (
        SELECT COALESCE(SUM(net_salary), 0)
        FROM payroll
        WHERE MONTH(pay_period_end) = MONTH(CURDATE())
        AND YEAR(pay_period_end) = YEAR(CURDATE())
    ) AS total_payroll;
