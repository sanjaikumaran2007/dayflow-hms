USE dayflow_hrms;

CREATE TABLE leave_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    description TEXT,

    default_days DECIMAL(5,2) NOT NULL DEFAULT 0,

    is_paid BOOLEAN NOT NULL DEFAULT TRUE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE leave_balances (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    employee_id BIGINT UNSIGNED NOT NULL,

    leave_type_id BIGINT UNSIGNED NOT NULL,

    year YEAR NOT NULL,

    allocated_days DECIMAL(5,2) NOT NULL DEFAULT 0,

    used_days DECIMAL(5,2) NOT NULL DEFAULT 0,

    pending_days DECIMAL(5,2) NOT NULL DEFAULT 0,

    remaining_days DECIMAL(5,2) NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_employee_leave_year
        (employee_id, leave_type_id, year),

    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (leave_type_id)
        REFERENCES leave_types(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE leave_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    employee_id BIGINT UNSIGNED NOT NULL,

    leave_type_id BIGINT UNSIGNED NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    number_of_days DECIMAL(5,2) NOT NULL,

    remarks TEXT,

    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PENDING',

    approved_by BIGINT UNSIGNED NULL,

    approved_at DATETIME NULL,

    admin_comment TEXT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (leave_type_id)
        REFERENCES leave_types(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (approved_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CHECK (end_date >= start_date),

    CHECK (number_of_days > 0)
) ENGINE=InnoDB;

CREATE TABLE leave_approval_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    leave_request_id BIGINT UNSIGNED NOT NULL,

    action ENUM(
        'SUBMITTED',
        'APPROVED',
        'REJECTED',
        'CANCELLED'
    ) NOT NULL,

    action_by BIGINT UNSIGNED NOT NULL,

    comment TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (leave_request_id)
        REFERENCES leave_requests(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (action_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;