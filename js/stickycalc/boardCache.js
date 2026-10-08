// 貼板的本機暫存：每個貼板一個 key，存便利貼、連線、群組
// storage 預設是 localStorage，測試時可傳入假的 storage

const LEGACY_KEYS = ['nodes', 'connections', 'groups'];

export function cacheKey(boardId) {
    return 'stickycalc:board:' + (boardId || 'guest');
}

// 回傳 { data, migrated }；data 為 null 代表沒有暫存
export function loadBoardCache(boardId, storage = globalThis.localStorage) {
    const saved = readJson(storage, cacheKey(boardId));
    if (saved && Array.isArray(saved.nodes)) {
        return { data: normalize(saved), migrated: false };
    }
    const legacy = readLegacyCache(boardId, storage);
    return { data: legacy, migrated: !!legacy };
}

// 寫入成功回傳 true；容量已滿或瀏覽器禁止存取時回傳 false
export function saveBoardCache(boardId, { nodes, connections, groups }, storage = globalThis.localStorage) {
    try {
        storage.setItem(cacheKey(boardId), JSON.stringify({ nodes, connections, groups, savedAt: Date.now() }));
        return true;
    } catch (e) {
        return false;
    }
}

export function removeLegacyCache(storage = globalThis.localStorage) {
    try {
        LEGACY_KEYS.forEach(key => storage.removeItem(key));
    } catch (e) { }
}

// 舊版把所有貼板存在共用的 nodes / connections / groups 三個 key
// 只有便利貼的 boardId 全部是這個貼板時才算數，避免拿到別的貼板的資料
function readLegacyCache(boardId, storage) {
    const nodes = readJson(storage, 'nodes');
    if (!boardId || !Array.isArray(nodes) || nodes.length === 0) return null;
    if (!nodes.every(node => node.boardId === boardId)) return null;
    return normalize({
        nodes,
        connections: readJson(storage, 'connections'),
        groups: readJson(storage, 'groups'),
    });
}

function normalize(saved) {
    return {
        nodes: saved.nodes,
        connections: Array.isArray(saved.connections) ? saved.connections : [],
        groups: Array.isArray(saved.groups) ? saved.groups : [],
    };
}

function readJson(storage, key) {
    try {
        return JSON.parse(storage.getItem(key) || 'null');
    } catch (e) {
        return null;
    }
}
