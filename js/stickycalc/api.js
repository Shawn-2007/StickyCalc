// 後端 API：網址、登入 token、上傳內容、送出請求
// 換網址或改驗證方式只需要改這個檔案

export const API_URL = 'https://api.shawn4x4.com/phpApi/member_control_api_v1.php';

export function apiUrl(action) {
    return `${API_URL}?action=${action}`;
}

export function readCookie(name, cookieString = globalThis.document?.cookie ?? '') {
    const prefix = name + '=';
    for (const part of cookieString.split(';')) {
        const cookie = part.trim();
        if (cookie.startsWith(prefix)) return cookie.substring(prefix.length);
    }
    return '';
}

// 附上登入 token（電腦版 Uid01、手機版 Mid），後端用它確認身分，不相信前端送的 userId
export function withAuth(payload, cookieString) {
    return {
        ...payload,
        uid01: readCookie('Uid01', cookieString),
        mid: readCookie('Mid', cookieString),
    };
}

// 上傳整個貼板要送的四個請求：[action, payload]
export function buildBoardUploads({ nodes, connections, groups, userId, boardId, boardName, alterTime }) {
    return [
        ['nodes_upload', { nodes, userId, boardId }],
        ['connections_upload', {
            connections: connections.map(conn => ({
                boardId,
                userId,
                from: conn.from,
                to: conn.to,
                color: conn.color,
                type: conn.type,
                connectionsId: conn.connectionsId,
            })),
            userId,
            boardId,
        }],
        ['group_upload', { groups, userId, boardId }],
        ['board_upload', { userId, boardId, alterTime, boardName }],
    ];
}

// 送出多個請求，全部成功才 resolve；任一失敗（含後端回 state=false）就 reject
// keepalive：關閉頁面時用，請求不會被瀏覽器中斷；合計上限約 64KB，太大就改用一般請求
export function postAll(requests, { keepalive = false, fetchImpl = globalThis.fetch, cookieString } = {}) {
    const bodies = requests.map(([action, payload]) => [action, JSON.stringify(withAuth(payload, cookieString))]);
    const totalSize = bodies.reduce((sum, [, body]) => sum + body.length, 0);
    const useKeepalive = keepalive && totalSize < 60000;
    return Promise.all(bodies.map(([action, body]) => postBody(action, body, useKeepalive, fetchImpl)));
}

function postBody(action, body, keepalive, fetchImpl) {
    return fetchImpl(apiUrl(action), {
        method: 'POST',
        // 與 jQuery 預設相同的 Content-Type，屬於簡單請求，不需要 CORS 預檢
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body,
        keepalive,
    })
        .then(res => res.json())
        .then(data => {
            if (!data.state) {
                throw new Error(data.message || `${action} 失敗`);
            }
            return data;
        });
}
