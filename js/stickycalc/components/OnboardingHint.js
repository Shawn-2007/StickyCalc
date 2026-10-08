// 新手提示卡：第一次使用時顯示操作說明，關掉後右下角留一個「?」可以再打開
// 自成一體（文字、樣式、記住是否關閉都在這裡），主程式只需要放 <onboarding-hint>

const STORAGE_KEY = 'stickycalc:hint-dismissed';

const DESKTOP_TIPS = [
    ['雙擊空白處', '新增便利貼'],
    ['選取後拖曳右邊的圓圈', '連線，數字會往下累加'],
    ['編輯時按 Tab', '完成並接著新增下一張'],
    ['滾輪／拖曳空白處', '縮放／移動畫面'],
    ['#…# 包住的文字', '不會被計算'],
];

const MOBILE_TIPS = [
    ['點兩下空白處', '新增便利貼'],
    ['拖曳便利貼右邊的圓圈', '連線，數字會往下累加'],
    ['長按空白處', '開啟選單'],
    ['兩指', '縮放與移動畫面'],
    ['#…# 包住的文字', '不會被計算'],
];

const STYLE = `
.onboarding-hint {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 20;
    width: 280px;
    max-width: calc(100vw - 32px);
    padding: 14px 16px 12px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.96);
    color: #333;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    font-size: 14px;
}
.onboarding-hint.is-dark {
    background: rgba(50, 50, 50, 0.96);
    color: #eee;
}
.onboarding-hint h6 {
    margin: 0 0 8px;
    font-weight: bold;
}
.onboarding-hint ul {
    margin: 0 0 10px;
    padding: 0;
    list-style: none;
}
.onboarding-hint li {
    margin: 4px 0;
    line-height: 1.4;
}
.onboarding-hint li strong {
    font-weight: 600;
}
.onboarding-hint .hint-close {
    width: 100%;
}
.onboarding-hint-reopen {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 20;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    color: #808080;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    font-weight: bold;
}
.onboarding-hint-reopen.is-dark {
    background: rgba(60, 60, 60, 0.9);
    color: #ccc;
}
`;

function injectStyleOnce() {
    if (document.getElementById('onboarding-hint-style')) return;
    const style = document.createElement('style');
    style.id = 'onboarding-hint-style';
    style.textContent = STYLE;
    document.head.appendChild(style);
}

function readDismissed() {
    try {
        return localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
        return false;
    }
}

function writeDismissed(value) {
    try {
        if (value) localStorage.setItem(STORAGE_KEY, '1');
        else localStorage.removeItem(STORAGE_KEY);
    } catch (e) { }
}

export const OnboardingHint = {
    props: {
        isMobile: { type: Boolean, default: false },
        isDark: { type: Boolean, default: false },
    },
    data() {
        return { open: !readDismissed() };
    },
    computed: {
        tips() {
            return this.isMobile ? MOBILE_TIPS : DESKTOP_TIPS;
        },
    },
    created() {
        injectStyleOnce();
    },
    methods: {
        close() {
            this.open = false;
            writeDismissed(true);
        },
        reopen() {
            this.open = true;
            writeDismissed(false);
        },
    },
    template: `
        <div v-if="open" class="onboarding-hint" :class="{ 'is-dark': isDark }" @pointerdown.stop @click.stop>
            <h6>快速上手</h6>
            <ul>
                <li v-for="[action, result] in tips" :key="action"><strong>{{ action }}</strong>：{{ result }}</li>
            </ul>
            <button type="button" class="btn btn-sm btn-warning hint-close" @click="close">知道了</button>
        </div>
        <button v-else type="button" class="onboarding-hint-reopen" :class="{ 'is-dark': isDark }"
            title="操作說明" @pointerdown.stop @click.stop="reopen">?</button>
    `,
};
