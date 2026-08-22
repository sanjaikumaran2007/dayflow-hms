USE dayflow_hrms;

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NULL,

    action VARCHAR(100) NOT NULL,

    table_name VARCHAR(100),

    record_id BIGINT UNSIGNED NULL,

    old_data JSON NULL,

    new_data JSON NULL,

    ip_address VARCHAR(45),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;