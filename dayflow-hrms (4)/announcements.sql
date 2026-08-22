USE dayflow_hrms;

CREATE TABLE announcements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(255) NOT NULL,

    content TEXT NOT NULL,

    created_by BIGINT UNSIGNED NOT NULL,

    target_role ENUM(
        'ALL',
        'ADMIN',
        'HR',
        'EMPLOYEE'
    ) DEFAULT 'ALL',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    publish_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    expires_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;