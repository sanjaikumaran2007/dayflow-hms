USE dayflow_hrms;

CREATE TABLE payroll (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    employee_id BIGINT UNSIGNED NOT NULL,

    pay_period_start DATE NOT NULL,

    pay_period_end DATE NOT NULL,

    basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,

    allowances DECIMAL(12,2) NOT NULL DEFAULT 0,

    bonus DECIMAL(12,2) NOT NULL DEFAULT 0,

    gross_salary DECIMAL(12,2) NOT NULL DEFAULT 0,

    tax DECIMAL(12,2) NOT NULL DEFAULT 0,

    insurance DECIMAL(12,2) NOT NULL DEFAULT 0,

    other_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,

    total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,

    net_salary DECIMAL(12,2) NOT NULL DEFAULT 0,

    status ENUM(
        'DRAFT',
        'PROCESSING',
        'PROCESSED',
        'PAID',
        'CANCELLED'
    ) NOT NULL DEFAULT 'DRAFT',

    processed_by BIGINT UNSIGNED NULL,

    processed_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_employee_pay_period
        (employee_id, pay_period_start, pay_period_end),

    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (processed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE salary_slips (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    payroll_id BIGINT UNSIGNED NOT NULL UNIQUE,

    employee_id BIGINT UNSIGNED NOT NULL,

    slip_number VARCHAR(100) NOT NULL UNIQUE,

    file_path VARCHAR(1000),

    generated_by BIGINT UNSIGNED NOT NULL,

    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (payroll_id)
        REFERENCES payroll(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (generated_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;