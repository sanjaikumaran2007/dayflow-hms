USE dayflow_hrms;

CREATE TABLE employees (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL UNIQUE,

    employee_code VARCHAR(50) NOT NULL UNIQUE,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100),

    date_of_birth DATE,

    gender VARCHAR(30),

    phone VARCHAR(20),

    email VARCHAR(255),

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    postal_code VARCHAR(20),

    profile_image VARCHAR(500),

    status ENUM(
        'ACTIVE',
        'INACTIVE',
        'ON_LEAVE',
        'TERMINATED'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at DATETIME NULL,

    CONSTRAINT fk_employee_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;