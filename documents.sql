USE dayflow_hrms;

CREATE TABLE employee_documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    employee_id BIGINT UNSIGNED NOT NULL,

    document_type ENUM(
        'ID_PROOF',
        'EMPLOYMENT_DOCUMENT',
        'CERTIFICATE',
        'RESUME',
        'SALARY_DOCUMENT',
        'OTHER'
    ) NOT NULL,

    document_name VARCHAR(255) NOT NULL,

    file_path VARCHAR(1000) NOT NULL,

    file_size BIGINT UNSIGNED,

    mime_type VARCHAR(100),

    uploaded_by BIGINT UNSIGNED NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;