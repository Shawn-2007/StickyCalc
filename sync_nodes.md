DELIMITER //

CREATE PROCEDURE sync_nodes(IN json_data TEXT, IN user_id VARCHAR(255), IN board_id VARCHAR(255))
BEGIN
    -- 開始事務
    START TRANSACTION;

    -- 創建臨時表
    CREATE TEMPORARY TABLE temp_nodes (
        Id VARCHAR(255),
        Label TEXT,
        X DOUBLE,
        Y DOUBLE,
        Color VARCHAR(255),
        ColorTop VARCHAR(255),
        Editing VARCHAR(255),
        Selected VARCHAR(255),
        Operation VARCHAR(255),
        ConnectionsOut VARCHAR(255),
        ConnectionsIn VARCHAR(255),
        Connections VARCHAR(255),
        Total DOUBLE,
        Count DOUBLE,
        StartX DOUBLE,
        StartY DOUBLE,
        UserId VARCHAR(255),
        BoardId VARCHAR(255)
    );

    -- 如果 json_data 不是空陣列，解析並插入資料
    IF JSON_LENGTH(json_data) > 0 THEN
        INSERT INTO temp_nodes (Id, Label, X, Y, Color, ColorTop, Editing, Selected, Operation, ConnectionsOut, ConnectionsIn, Connections, Total, Count, StartX, StartY, UserId, BoardId)
        SELECT 
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.id')),
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.label')),
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.x')),
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.y')),
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.color')),
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.colorTop')),
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.editing')),
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.selected')),
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.operation')),
            JSON_EXTRACT(json_row, '$.connectionsOut'),
            JSON_EXTRACT(json_row, '$.connectionsIn'),
            JSON_EXTRACT(json_row, '$.connections'),
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.total')),
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.count')),
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.startX')),
            JSON_UNQUOTE(JSON_EXTRACT(json_row, '$.startY')),
            user_id, -- 直接使用傳入的 user_id
            board_id -- 直接使用傳入的 board_id
        FROM JSON_TABLE(json_data, '$[*]' COLUMNS (json_row JSON PATH '$')) AS jt;
    END IF;

    -- 刪除所有屬於該 UserId 和 BoardId 的記錄，且不在 temp_nodes 中的記錄
    DELETE n FROM Nodes n
    LEFT JOIN temp_nodes t ON n.Id = t.Id AND n.UserId = t.UserId AND n.BoardId = t.BoardId
    WHERE n.UserId = user_id AND n.BoardId = board_id AND t.Id IS NULL;

    -- 如果 temp_nodes 有資料，執行更新和插入
    IF (SELECT COUNT(*) FROM temp_nodes) > 0 THEN
        -- 更新現有記錄
        UPDATE Nodes n
        JOIN temp_nodes t ON n.Id = t.Id AND n.UserId = t.UserId AND n.BoardId = t.BoardId
        SET
            n.Label = t.Label,
            n.X = t.X,
            n.Y = t.Y,
            n.Color = t.Color,
            n.ColorTop = t.ColorTop,
            n.Editing = t.Editing,
            n.Selected = t.Selected,
            n.Operation = t.Operation,
            n.ConnectionsOut = t.ConnectionsOut,
            n.ConnectionsIn = t.ConnectionsIn,
            n.Connections = t.Connections,
            n.Total = t.Total,
            n.Count = t.Count,
            n.StartX = t.StartX,
            n.StartY = t.StartY;

        -- 插入新記錄（修正條件）
        INSERT INTO Nodes (Id, Label, X, Y, Color, ColorTop, Editing, Selected, Operation, ConnectionsOut, ConnectionsIn, Connections, Total, Count, StartX, StartY, UserId, BoardId)
        SELECT t.Id, t.Label, t.X, t.Y, t.Color, t.ColorTop, t.Editing, t.Selected, t.Operation, t.ConnectionsOut, t.ConnectionsIn, t.Connections, t.Total, t.Count, t.StartX, t.StartY, t.UserId, t.BoardId
        FROM temp_nodes t
        LEFT JOIN Nodes n ON n.Id = t.Id AND n.UserId = t.UserId AND n.BoardId = t.BoardId
        WHERE n.Id IS NULL AND n.UserId IS NULL AND n.BoardId IS NULL;
    END IF;

    -- 提交事務
    COMMIT;

    -- 清理臨時表
    DROP TEMPORARY TABLE IF EXISTS temp_nodes;
END //

DELIMITER ;
