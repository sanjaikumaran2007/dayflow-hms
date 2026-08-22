USE dayflow_hrms;

CREATE TABLE employee_job_details (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    employee_id BIGINT UNSIGNED NOT NULL UNIQUE,

    department_id BIGINT UNSIGNED NOT NULL,

    job_title VARCHAR(150) NOT NULL,

    employment_type ENUM(
        'FULL_TIME',
        'PART_TIME',
        'CONTRACT',
        'INTERN',
        'TEMPORARY'
    ) NOT NULL DEFAULT 'FULL_TIME',

    joining_date DATE NOT NULL,

    reporting_manager_id BIGINT UNSIGNED NULL,

    work_location VARCHAR(150),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_job_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_job_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_job_manager
        FOREIGN KEY (reporting_manager_id)
        REFERENCES employees(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;