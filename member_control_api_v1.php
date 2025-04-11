<?php
// 限定連線
header("Access-Control-Allow-Origin: https://shawn-2007.github.io/");

// header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// mysqli_report(flags: MYSQLI_REPORT_OFF); //關閉異常拋出模式

const DB_SERVER   = "XXX";
const DB_USERNAME = "XXX";
const DB_PASSWORD = "XXX";
const DB_NAME     = "XXX";

//建立連線
function create_connection()
{
    $conn = mysqli_connect(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);
    if (! $conn) {
        echo json_encode(["state" => false, "message" => "連線失敗"]);
        exit;
    }
    return $conn;
}

//取得JSON的資料
function get_json_input()
{
    $data = file_get_contents("php://input");
    // true是陣列 false是物件
    return json_decode($data, true);
}

//回復JSON訊息
// state:狀態(成功或失敗) message:訊息內容 data:回傳資料(可有可無)
function respond($state, $message, $data = null)
{
    echo json_encode(["state" => $state, "message" => $message, "data" => $data]);
}

// 會員註冊
function register_user()
{
    $input = get_json_input();

    if (isset($input["username"], $input["password"], $input["email"])) {
        $username = trim($input["username"]);
        $password = password_hash(trim($input["password"]), PASSWORD_DEFAULT);
        $email    = trim($input["email"]);
        if ($username && $password && $email) {

            $conn = create_connection();

            $stmt = $conn->prepare("INSERT INTO member (Username,Password,Email) VALUES (?,?,?)");
            $stmt->bind_param("sss", $username, $password, $email); //一定要傳遞變數

            if ($stmt->execute()) {
                respond(true, "註冊成功");
            } else {
                respond(false, "註冊失敗");
            }
            $stmt->close();
            $conn->close();
        } else {
            respond(false, "欄位不得為空白");
        }
    } else {
        respond(false, "欄位錯誤");
    }
}

// 會員登入
function login_user()
{
    $input = get_json_input();
    if (isset($input["username"], $input["password"])) {
        $username = trim($input["username"]);
        $password = trim($input["password"]);
        if ($username && $password) {
            $conn = create_connection();
            $stmt = $conn->prepare("SELECT * FROM member WHERE Username = ?");
            // s是字串 i是整數
            $stmt->bind_param("s", $username); //一定要傳遞變數
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result->num_rows === 1) {
                // 抓取密碼執行password_verify比對
                $row = $result->fetch_assoc();
                if (password_verify($password, $row["Password"])) {
                    // 產生UID並更新至資料庫
                    $uid01       = substr(hash('sha256', time()), 12, 4) . substr(hash('sha512', time()), 59, 4);
                    $update_stmt = $conn->prepare("UPDATE member SET Uid01 = ? WHERE Username = ?");
                    $update_stmt->bind_param("ss", $uid01, $username); //一定要傳遞變數
                    if ($update_stmt->execute()) {

                        $user_stmt = $conn->prepare("SELECT * FROM member WHERE Username = ?");
                        $user_stmt->bind_param("s", $username); //一定要傳遞變數
                        $user_stmt->execute();
                        $user_data = $user_stmt->get_result()->fetch_assoc();
                        unset($user_data["Password"]);

                        respond(true, "登入成功", $user_data);
                    } else {
                    }
                } else {
                    // 比對失敗
                    respond(false, "登入失敗，密碼錯誤");
                }
            } else {
                respond(false, "登入失敗，此帳號不存在");
            }
            $stmt->close();
            $conn->close();
        } else {
            respond(false, "欄位不得為空白");
        }
    } else {
        respond(false, "欄位錯誤");
    }
}
// 便利貼上傳
function nodes_upload()
{
    $input = get_json_input();
    if (isset($input["nodes"]) && isset($input["userId"]) && isset($input["boardId"])) {
        $nodes    = $input["nodes"];
        $user_id  = $input["userId"];
        $board_id = $input["boardId"];

        if (is_array($nodes)) {
            $conn      = create_connection();
            $json_data = json_encode($nodes); // 只傳 nodes 陣列給預存程序
            $stmt      = $conn->prepare("CALL sync_nodes(?, ?, ?)");
            $stmt->bind_param("sss", $json_data, $user_id, $board_id);
            if ($stmt->execute()) {
                respond(true, "同步成功");
            } else {
                respond(false, "同步失敗: " . $conn->error);
            }
            $stmt->close();
            $conn->close();
        } else {
            respond(false, "nodes 必須是陣列");
        }
    } else {
        respond(false, "缺少必要欄位 (nodes, userId, boardId)");
    }
}
// 便利貼上傳

// 連線上傳
function connections_upload()
{
    $input = get_json_input();
    if (isset($input["connections"]) && isset($input["userId"]) && isset($input["boardId"])) {
        $connections = $input["connections"];
        $user_id     = $input["userId"];
        $board_id    = $input["boardId"];

        if (is_array($connections)) {
            $conn      = create_connection();
            $json_data = json_encode($connections); // 只傳 connections 陣列給預存程序
            $stmt      = $conn->prepare("CALL sync_connections(?, ?, ?)");
            $stmt->bind_param("sss", $json_data, $user_id, $board_id);
            if ($stmt->execute()) {
                respond(true, "同步成功");
            } else {
                respond(false, "同步失敗: " . $conn->error);
            }
            $stmt->close();
            $conn->close();
        } else {
            respond(false, "connections 必須是陣列");
        }
    } else {
        respond(false, "缺少必要欄位 (connections, userId, boardId)");
    }
}
// 連線上傳

// 貼板上傳
function board_upload()
{
    $input = get_json_input();
    if (isset($input["userId"], $input["boardId"])) {
        $userId    = trim($input["userId"]);
        $boardId   = trim($input["boardId"]);
        $alterTime = trim($input["alterTime"]);
        $boardName = trim($input["boardName"]);

        if ($userId && $boardId) {
            $conn = create_connection();
            $stmt = $conn->prepare("
                INSERT INTO Board (UserId, BoardId, AlterTime,BoardName)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                AlterTime = VALUES(AlterTime),
                BoardName = VALUES(BoardName);
            ");

            $stmt->bind_param("ssss", $userId, $boardId, $alterTime, $boardName);

            if ($stmt->execute()) {
                respond(true, "上傳成功 (新增或更新)");
            } else {
                respond(false, "上傳失敗");
            }

            $stmt->close();
            $conn->close();
        } else {
            respond(false, "欄位不得為空白");
        }
    } else {
        respond(false, "欄位錯誤");
    }
}
// 貼板上傳

// 取得便利貼
function get_Nodes()
{
    // 開啟錯誤日誌以便除錯
    ini_set('log_errors', 1);
    ini_set('error_log', '/var/log/php_errors.log');

    $input = get_json_input();

    // 檢查 JSON 輸入
    if ($input === null) {
        respond(false, "無效的 JSON 輸入");
        return;
    }

    if (isset($input["userId"]) && isset($input["boardId"])) {
        $userId  = trim($input["userId"]);
        $boardId = trim($input["boardId"]);
        if ($userId && $boardId) {
            $conn = null;
            $stmt = null;
            try {
                $conn = create_connection();
                if (! $conn) {
                    throw new Exception("無法建立資料庫連線");
                }

                $stmt = $conn->prepare("SELECT * FROM Nodes WHERE UserId = ? AND BoardId = ?");
                if (! $stmt) {
                    throw new Exception("SQL 準備失敗: " . $conn->error);
                }

                $stmt->bind_param("ss", $userId, $boardId);
                $stmt->execute();
                $result = $stmt->get_result();

                if ($result->num_rows > 0) {
                    $mydata = [];
                    while ($row = $result->fetch_assoc()) {
                        $row['ConnectionsOut'] = ! empty($row['ConnectionsOut']) ? json_decode($row['ConnectionsOut'], true) ?: [] : [];
                        $row['ConnectionsIn']  = ! empty($row['ConnectionsIn']) ? json_decode($row['ConnectionsIn'], true) ?: [] : [];
                        $row['Connections']    = ! empty($row['Connections']) ? json_decode($row['Connections'], true) ?: [] : [];
                        $mydata[]              = $row;
                    }
                    respond(true, "取得所有便利貼成功", $mydata);
                } else {
                    respond(false, "取得所有便利貼資料失敗");
                }
            } catch (Exception $e) {
                error_log("get_Nodes 錯誤: " . $e->getMessage());
                respond(false, "伺服器錯誤: " . $e->getMessage());
            } finally {
                // 確保資源關閉
                if ($stmt instanceof mysqli_stmt) {
                    $stmt->close();
                }
                if ($conn instanceof mysqli) {
                    $conn->close();
                }
            }
        } else {
            respond(false, "欄位不得為空白");
        }
    } else {
        respond(false, "欄位錯誤");
    }
}
// 取得便利貼

// 取得便利貼
function get_Connections()
{
    // 開啟錯誤日誌
    ini_set('log_errors', 1);
    ini_set('error_log', '/var/log/php_errors.log');

    $input = get_json_input();

    // 檢查 JSON 輸入
    if ($input === null) {
        respond(false, "無效的 JSON 輸入");
        return;
    }

    if (isset($input["userId"]) && isset($input["boardId"])) {
        $userId  = trim($input["userId"]);
        $boardId = trim($input["boardId"]);
        if ($userId && $boardId) {
            $conn = null;
            $stmt = null;
            try {
                $conn = create_connection();
                if (! $conn) {
                    throw new Exception("無法建立資料庫連線");
                }

                $stmt = $conn->prepare("SELECT * FROM connections WHERE UserId = ? AND BoardId = ?");
                if (! $stmt) {
                    throw new Exception("SQL 準備失敗: " . $conn->error);
                }

                $stmt->bind_param("ss", $userId, $boardId);
                $stmt->execute();
                $result = $stmt->get_result();

                if ($result->num_rows > 0) {
                    $mydata = [];
                    while ($row = $result->fetch_assoc()) {
                        $mydata[] = $row;
                    }
                    respond(true, "取得所有便利貼連線成功", $mydata);
                } else {
                    respond(false, "取得所有便利貼連線資料失敗");
                }
            } catch (Exception $e) {
                error_log("get_Connections 錯誤: " . $e->getMessage());
                respond(false, "伺服器錯誤: " . $e->getMessage());
            } finally {
                // 確保資源關閉
                if ($stmt instanceof mysqli_stmt) {
                    $stmt->close();
                }
                if ($conn instanceof mysqli) {
                    $conn->close();
                }
            }
        } else {
            respond(false, "欄位不得為空白");
        }
    } else {
        respond(false, "欄位錯誤");
    }
}
// 取得便利貼

// 取得所有貼版資料
function getAllUserBoard()
{
    $input = get_json_input();
    if (isset($input["userId"])) {

        $userId = trim($input["userId"]);
        $conn   = create_connection();
        // $stmt = $conn->prepare("SELECT * FROM member ORDER BY ID DESC");
        $stmt = $conn->prepare("SELECT * FROM `Board` WHERE UserId = ? ORDER BY ID DESC");
        $stmt->bind_param("s", $userId); //一定要傳遞變數
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $mydata = [];
            while ($row = $result->fetch_assoc()) {
                $mydata[] = $row;
            }
            respond(true, "取得會員所有貼版資料成功", $mydata);
        } else {
            // 查無資料
            respond(false, "取得會員所有貼版資料失敗");
        }
        $stmt->close();
        $conn->close();
    }
}

// 刪除指定 UserId 和 BoardId 的資料
function deleteBoard()
{
    $input = get_json_input();
    if (isset($input["userId"]) && isset($input["boardId"])) {
        $userId  = trim($input["userId"]);
        $boardId = trim($input["boardId"]);

        if ($userId && $boardId) {
            $conn = create_connection();

            // 準備刪除語句，針對三個表
            $stmt1 = $conn->prepare("DELETE FROM Board WHERE UserId = ? AND BoardId = ?");
            $stmt2 = $conn->prepare("DELETE FROM connections WHERE UserId = ? AND BoardId = ?");
            $stmt3 = $conn->prepare("DELETE FROM Nodes WHERE UserId = ? AND BoardId = ?");

            // 綁定參數
            $stmt1->bind_param("ss", $userId, $boardId); // "ss" 表示兩個字串
            $stmt2->bind_param("ss", $userId, $boardId);
            $stmt3->bind_param("ss", $userId, $boardId);

            // 執行三個刪除操作
            $success      = true;
            $affectedRows = 0;

            if ($stmt1->execute()) {
                $affectedRows += mysqli_affected_rows($conn);
            } else {
                $success = false;
            }

            if ($stmt2->execute()) {
                $affectedRows += mysqli_affected_rows($conn);
            } else {
                $success = false;
            }

            if ($stmt3->execute()) {
                $affectedRows += mysqli_affected_rows($conn);
            } else {
                $success = false;
            }

            // 根據結果回應
            if ($success) {
                if ($affectedRows > 0) {
                    respond(true, "刪除成功，影響 $affectedRows 筆資料");
                } else {
                    respond(false, "無資料被刪除");
                }
            } else {
                respond(false, "刪除失敗: " . $conn->error);
            }

            // 關閉語句和連接
            $stmt1->close();
            $stmt2->close();
            $stmt3->close();
            $conn->close();
        } else {
            respond(false, "userId 或 boardId 不得為空白");
        }
    } else {
        respond(false, "欄位錯誤，缺少 userId 或 boardId");
    }
}
// 刪除指定 UserId 和 BoardId 的資料(預存程式版)
function advanceDeleteBoard()
{
    $input = get_json_input();
    if (isset($input["userId"]) && isset($input["boardId"])) {
        $userId  = trim($input["userId"]);
        $boardId = trim($input["boardId"]);

        if ($userId && $boardId) {
            $conn = create_connection();

            // 調用預存程序
            $stmt = $conn->prepare("CALL delete_board_data(?, ?)");
            $stmt->bind_param("ss", $userId, $boardId);

            if ($stmt->execute()) {
                // 獲取預存程序的結果
                $result = $conn->query("SELECT message, affected_rows FROM DUAL");
                if ($result) {
                    $row = $result->fetch_assoc();
                    if ($row['affected_rows'] > 0) {
                        respond(true, $row['message'] . "，影響 " . $row['affected_rows'] . " 筆資料");
                    } else {
                        respond(false, $row['message']);
                    }
                } else {
                    respond(false, "無法獲取結果: " . $conn->error);
                }
            } else {
                respond(false, "執行失敗: " . $conn->error);
            }

            $stmt->close();
            $conn->close();
        } else {
            respond(false, "userId 或 boardId 不得為空白");
        }
    } else {
        respond(false, "欄位錯誤，缺少 userId 或 boardId");
    }
}

// 確認UID
function checkuid_user()
{
    $input = get_json_input();
    if (isset($input["uid01"])) {
        $p_uid = trim($input["uid01"]);
        if ($p_uid) {
            $conn = create_connection();
            $stmt = $conn->prepare("SELECT * FROM member WHERE Uid01 = ?");
            $stmt->bind_param("s", $p_uid); //一定要傳遞變數
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result->num_rows === 1) {
                // 抓取密碼執行password_verify比對
                $userdata = $result->fetch_assoc();
                unset($userdata["Password"]);
                respond(true, "驗證成功", $userdata);
            } else {
                respond(false, "驗證失敗");
            }
            $stmt->close();
            $conn->close();
        } else {
            respond(false, "欄位不得為空白");
        }
    } else {
        respond(false, "欄位錯誤");
    }
}

// 驗證帳號
function checkuid_uni()
{
    $input = get_json_input();
    if (isset($input["username"])) {
        $p_uni = trim($input["username"]);
        if ($p_uni) {
            $conn = create_connection();
            $stmt = $conn->prepare("SELECT * FROM member WHERE Username = ?");
            $stmt->bind_param("s", $p_uni); //一定要傳遞變數
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result->num_rows === 0) {
                respond(true, "帳號不存在，可以使用");
            } else {
                respond(false, "帳號已存在，不可使用");
            }
            $stmt->close();
            $conn->close();
        } else {
            respond(false, "欄位不得為空白");
        }
    } else {
        respond(false, "欄位錯誤");
    }
}

// 取得所有會員資料
function getAllUserData()
{

    $conn = create_connection();
    $stmt = $conn->prepare("SELECT * FROM member ORDER BY ID DESC");
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $mydata = [];
        while ($row = $result->fetch_assoc()) {
            unset($row["Password"]);
            unset($row["Uid"]);
            $mydata[] = $row;
        }
        respond(true, "取得所有會員資料成功", $mydata);
    } else {
        // 查無資料
        respond(false, "取得所有會員資料失敗");
    }
    $stmt->close();
    $conn->close();
}

// 修改Email
function updateEmail()
{
    $input = get_json_input();
    if (isset($input["id"], $input["email"])) {
        $id    = trim($input["id"]);
        $email = trim($input["email"]);
        if ($id && $email) {
            $conn = create_connection();
            $stmt = $conn->prepare("UPDATE member SET Email= ? WHERE ID = ?");
            // s是字串 i是整數
            $stmt->bind_param("si", $email, $id); //一定要傳遞變數
            if ($stmt->execute()) {
                if (mysqli_affected_rows($conn) == 1) {
                    respond(true, "更新成功");
                } else {
                    respond(false, "無資料被更新");
                }
            } else {
                respond(false, "更新失敗與相關錯誤資訊");
            }
            $stmt->close();
            $conn->close();
        } else {
            respond(false, "欄位不得為空白");
        }
    } else {
        respond(false, "欄位錯誤");
    }
}

// 會員刪除
function deleteUser()
{
    $input = get_json_input();
    if (isset($input["id"])) {
        $id = trim($input["id"]);
        if ($id) {
            $conn = create_connection();

            $stmt = $conn->prepare("DELETE FROM member WHERE ID = ?");
            // s是字串 i是整數
            $stmt->bind_param("i", $id); //一定要傳遞變數

            if ($stmt->execute()) {
                if (mysqli_affected_rows($conn) === 1) {
                    respond(true, "刪除成功");
                } else {
                    respond(false, "無資料被更新");
                }
            } else {
                respond(false, "更新失敗與相關錯誤資訊");
            }

            $stmt->close();
            $conn->close();
        } else {
            respond(false, "欄位不得為空白");
        }
    } else {
        respond(false, "欄位錯誤");
    }
}

if ($_SERVER['REQUEST_METHOD'] === "POST") {
    $action = $_GET['action'] ?? '';
    switch ($action) {
        case 'register':
            register_user();
            break;

        case 'login':
            login_user();
            break;

        case 'checkuid':
            checkuid_user();
            break;

        case 'checkuni':
            checkuid_uni();
            break;

        case 'update':
            updateEmail();
            break;

        case 'nodes_upload':
            nodes_upload();
            break;

        case 'connections_upload':
            connections_upload();
            break;

        case 'board_upload':
            board_upload();
            break;

        case 'get_nodes':
            get_nodes();
            break;

        case 'get_Connections':
            get_Connections();
            break;

        case 'getAllUserBoard':
            getAllUserBoard();
            break;

        case 'deleteBoard':
            deleteBoard();
            break;

        case 'advanceDeleteBoard':
            advanceDeleteBoard();
            break;

        default:
            respond(false, "無效的操作");
    }
} elseif ($_SERVER['REQUEST_METHOD'] === "GET") {
    $action = $_GET['action'] ?? '';
    switch ($action) {
        case 'getalldata':
            getAllUserData();
            break;

        default:
            respond(false, "無效的操作");
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $action = $_GET['action'] ?? '';
    switch ($action) {
        case 'delete':
            deleteUser();
            break;

        default:
            respond(false, "無效的操作");
    }
} else {
    respond(false, "無效的請求方法");
}
