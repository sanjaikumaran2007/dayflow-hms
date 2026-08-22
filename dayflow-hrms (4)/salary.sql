USE dayflow_hrms;

CREATE TABLE salary_structures (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    employee_id BIGINT UNSIGNED NOT NULL,

    basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,

    hra DECIMAL(12,2) NOT NULL DEFAULT 0,

    allowances DECIMAL(12,2) NOT NULL DEFAULT 0,

    bonus DECIMAL(12,2) NOT NULL DEFAULT 0,

    tax DECIMAL(12,2) NOT NULL DEFAULT 0,

    insurance DECIMAL(12,2) NOT NULL DEFAULT 0,

    other_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,

    effective_from DATE NOT NULL,

    effective_to DATE NULL,

    created_by BIGINT UNSIGNED NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CHECK (basic_salary >= 0),
    CHECK (hra >= 0),
    CHECK (allowances >= 0),
    CHECK (bonus >= 0),
    CHECK (tax >= 0),
    CHECK (insurance >= 0),
    CHECK (other_deductions >= 0)
) ENGINE=InnoDB;