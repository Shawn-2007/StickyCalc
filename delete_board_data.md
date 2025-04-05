DELIMITER //

CREATE PROCEDURE delete_board_data(
    IN p_user_id VARCHAR(255),
    IN p_board_id VARCHAR(255)
)
BEGIN
    DECLARE total_affected INT DEFAULT 0;

    -- 開始事務
    START TRANSACTION;
    
    -- 刪除三個表的資料並累計影響行數
    DELETE FROM Board WHERE UserId = p_user_id AND BoardId = p_board_id;
    SET total_affected = total_affected + ROW_COUNT();
    
    DELETE FROM connections WHERE UserId = p_user_id AND BoardId = p_board_id;
    SET total_affected = total_affected + ROW_COUNT();
    
    DELETE FROM Nodes WHERE UserId = p_user_id AND BoardId = p_board_id;
    SET total_affected = total_affected + ROW_COUNT();
    
    -- 檢查是否有資料被刪除
    IF (total_affected > 0) THEN
        COMMIT;
        SELECT '刪除成功' AS message, total_affected AS affected_rows;
    ELSE
        ROLLBACK;
        SELECT '無資料被刪除' AS message, 0 AS affected_rows;
    END IF;
END //

DELIMITER ;