DELIMITER //

CREATE PROCEDURE sync_nodes(IN json_data TEXT, IN user_id VARCHAR(255), IN board_id VARCHAR(255))

BEGIN
    -- 開始事務
    START TRANSACTION;

    -- 創建臨時表
    CREATE TEMPORARY TABLE temp_connections (
        BoardId VARCHAR(255),
        UserId VARCHAR(255),
        C_from VARCHAR(255),
        C_to VARCHAR(255),
        connectionsId VARCHAR(255)
    );

    -- 如果 json_data 不是空陣列，解析並插入資料
    IF JSON_LENGTH(json_data) > 0 THEN
        INSERT INTO temp_connections (connectionsId, BoardId, UserId, C_from, C_to)
        SELECT 
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.connectionsId')),
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.boardId')),
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.userId')),
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.from')),
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.to'))
        FROM JSON_TABLE(json_data, '$[*]' COLUMNS (json_row JSON PATH '$')) AS jt;
    END IF;

    -- 刪除不在 temp_connections 中的記錄
    DELETE n FROM connections n
    LEFT JOIN temp_connections t ON n.connectionsId = t.connectionsId AND n.UserId = t.UserId AND n.BoardId = t.BoardId
    WHERE n.UserId = user_id AND n.BoardId = board_id AND t.connectionsId IS NULL;

    -- 如果有資料，執行更新和插入
    IF JSON_LENGTH(json_data) > 0 THEN
        -- 更新現有記錄（只更新可能變動的欄位）
        UPDATE connections n
        JOIN temp_connections t ON n.connectionsId = t.connectionsId AND n.UserId = t.UserId AND n.BoardId = t.BoardId
        SET 
            n.C_from = t.C_from,
            n.C_to = t.C_to;

        -- 插入新記錄
        INSERT INTO connections (connectionsId, BoardId, UserId, C_from, C_to)
        SELECT t.connectionsId, t.BoardId, t.UserId, t.C_from, t.C_to
        FROM temp_connections t
        LEFT JOIN connections n ON t.connectionsId = n.connectionsId AND t.UserId = n.UserId AND t.BoardId = n.BoardId
        WHERE n.connectionsId IS NULL;
    END IF;

    -- 提交事務
    COMMIT;

    -- 清理臨時表
    DROP TEMPORARY TABLE IF EXISTS temp_connections;
END //

DELIMITER ;

