// 數字顯示格式（純函式，可用 `npm test` 測試）

const numberFormat = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 });

// 12000 → "12,000"、1.234 → "1.23"；不是數字時顯示 0
export function formatNumber(value) {
    const number = Number(value);
    return numberFormat.format(Number.isFinite(number) ? number : 0);
}
