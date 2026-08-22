USE dayflow_hrms;

DELIMITER $$

CREATE PROCEDURE employee_check_in(
    IN p_employee_id BIGINT
)
BEGIN

    DECLARE v_count INT;

    SELECT COUNT(*)
    INTO v_count
    FROM attendance
    WHERE employee_id = p_employee_id
      AND attendance_date = CURDATE();

    IF v_count > 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Already checked in today';

    ELSE

        INSERT INTO attendance (
            employee_id,
            attendance_date,
            check_in,
            status
        )
        VALUES (
            p_employee_id,
            CURDATE(),
            CURRENT_TIMESTAMP,
            'PRESENT'
        );

    END IF;

END$$

DELIMITER ;