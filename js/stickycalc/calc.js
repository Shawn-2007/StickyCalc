// 便利貼文字 → 數字
// 純函式模組：不碰 Vue、不碰畫面，可以直接用 `npm test` 測試
//
// 規則：
// 1. 被 # 包住的內容不計算，例如「#備註 99# 50」→ 50
// 2. 整段都是算式就照算式計算，例如「100*2+50」→ 250
// 3. 否則把文字裡的金額加總，例如「午餐 120 晚餐 80」→ 200

export function parseNoteValue(label) {
    const text = normalizeNumberText(String(label ?? '').replace(/#[^#]*#/g, ''));

    let total = evaluateExpression(text);
    if (total === null) {
        total = sumNumbersInText(text);
    }
    // 去掉 0.1+0.2=0.30000000000000004 這類浮點誤差
    return Math.round(total * 1e10) / 1e10;
}

// 統一數字寫法：全形轉半形、千分位、×÷；日期與時間不是金額，先拿掉
export function normalizeNumberText(text) {
    return text
        .replace(/[！-～]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
        .replace(/　/g, ' ')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/(\d),(?=\d{3}(?!\d))/g, '$1') // 1,200 → 1200
        .replace(/\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2}/g, ' ') // 2025-10-07、2025/10/07
        .replace(/\d{1,2}:\d{2}(:\d{2})?/g, ' '); // 12:30
}

// 只含數字、+ - * /、括號的算式才計算，否則回傳 null
// 自己解析而不用 eval：010 不會被當八進位，也不會執行任何程式碼
export function evaluateExpression(text) {
    if (!/^[\d\s+\-*/.()]+$/.test(text) || !/\d/.test(text)) return null;

    const tokens = text.match(/\d*\.?\d+|[+\-*/()]/g) || [];
    if (tokens.join('') !== text.replace(/\s+/g, '')) return null;
    let pos = 0;

    // 運算式 = 項 (+|- 項)*；項 = 因子 (*|/ 因子)*；因子 = -因子 | 數字 | (運算式)
    const factor = () => {
        const token = tokens[pos++];
        if (token === '-') return -factor();
        if (token === '+') return factor();
        if (token === '(') {
            const value = expression();
            if (tokens[pos++] !== ')') throw new Error('括號不成對');
            return value;
        }
        if (token !== undefined && /\d/.test(token)) return parseFloat(token);
        throw new Error('算式不完整');
    };
    const term = () => {
        let value = factor();
        while (tokens[pos] === '*' || tokens[pos] === '/') {
            const op = tokens[pos++];
            const right = factor();
            value = op === '*' ? value * right : value / right;
        }
        return value;
    };
    const expression = () => {
        let value = term();
        while (tokens[pos] === '+' || tokens[pos] === '-') {
            const op = tokens[pos++];
            const right = term();
            value = op === '+' ? value + right : value - right;
        }
        return value;
    };

    try {
        const value = expression();
        if (pos !== tokens.length) return null; // 例如「5 5」不是算式，改用加總
        return Number.isFinite(value) ? value : 0; // 除以 0 視為 0
    } catch (e) {
        return null;
    }
}

// 加總文字裡的數字（負號只認數字前面沒有接數字的，例如「支出 -50」）
export function sumNumbersInText(text) {
    const cleaned = text
        .replace(/\d+(?:-\d+){2,}/g, ' ') // 電話、編號：0912-345-678
        .replace(/\b\d{1,2}\/\d{1,2}\b/g, ' ') // 月/日：10/7
        .replace(/(\d)-(?=\d)/g, '$1 '); // 數字中間的 - 是分隔符號，不是負號
    const matches = cleaned.match(/-?\d*\.?\d+/g) || [];
    return matches.reduce((sum, numStr) => sum + parseFloat(numStr), 0);
}
