USE dayflow_hrms;

CREATE TABLE attendance (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    employee_id BIGINT UNSIGNED NOT NULL,

    attendance_date DATE NOT NULL,

    check_in DATETIME NULL,

    check_out DATETIME NULL,

    working_hours DECIMAL(5,2) DEFAULT 0,

    status ENUM(
        'PRESENT',
        'ABSENT',
        'HALF_DAY',
        'LEAVE'
    ) NOT NULL DEFAULT 'PRESENT',

    remarks TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_employee_date
        (employee_id, attendance_date),

    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE attendance_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    employee_id BIGINT UNSIGNED NOT NULL,

    attendance_id BIGINT UNSIGNED NOT NULL,

    event_type ENUM(
        'CHECK_IN',
        'CHECK_OUT',
        'MANUAL_ADJUSTMENT'
    ) NOT NULL,

    event_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    ip_address VARCHAR(45),

    device_info VARCHAR(500),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (attendance_id)
        REFERENCES attendance(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;