USE dayflow_hrms;

DELIMITER $$

CREATE TRIGGER calculate_attendance_hours
BEFORE UPDATE ON attendance
FOR EACH ROW
BEGIN

    IF NEW.check_in IS NOT NULL
       AND NEW.check_out IS NOT NULL THEN

        SET NEW.working_hours =
            ROUND(
                TIMESTAMPDIFF(
                    MINUTE,
                    NEW.check_in,
                    NEW.check_out
                ) / 60,
                2
            );

    END IF;

END$$

DELIMITER ;