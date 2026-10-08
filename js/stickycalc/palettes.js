// 工具列的顏色與線條樣式選項
// 要新增一個顏色，只要在這裡多加一行（再到 SvgIcon 補對應的圖示）

export const NODE_COLORS = [
    { key: 'pink', title: '粉紅色', icon: 'svg-nodeColorPink', color: '#ffc0cb', colorTop: '#FCAFAA' },
    { key: 'green', title: '粉綠色', icon: 'svg-nodeColorGreen', color: '#D3ED7F', colorTop: '#C7DF7A' },
    { key: 'blue', title: '粉藍色', icon: 'svg-nodeColorBlue', color: '#CEEBFD', colorTop: '#ADD8E6' },
    { key: 'yellow', title: '粉黃色', icon: 'svg-nodeColorYellow', color: '#FFF8CA', colorTop: '#FFF4B2' },
];

export const LINE_TYPES = [
    { key: 'solid', title: '實線', icon: 'svg-lineTypeEntity' },
    { key: 'dashed', title: '中段線', icon: 'svg-lineTypeHollow' },
    { key: 'dotted', title: '虛線', icon: 'svg-lineTypeDottedLine' },
];

export const LINE_COLORS = [
    { key: 'pink', title: '粉紅色', icon: 'svg-lineColorPink', color: '#FCAFAA' },
    { key: 'green', title: '粉綠色', icon: 'svg-lineColorGreen', color: '#C7DF7A' },
    { key: 'blue', title: '粉藍色', icon: 'svg-lineColorBlue', color: '#ADD8E6' },
    { key: 'yellow', title: '橘黃色', icon: 'svg-lineColorYellow', color: '#FFB53E' },
];
