USE dayflow_hrms;

CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    notification_type ENUM(
        'LEAVE',
        'ATTENDANCE',
        'PAYROLL',
        'PROFILE',
        'SYSTEM',
        'ANNOUNCEMENT'
    ) NOT NULL,

    reference_id BIGINT UNSIGNED NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;