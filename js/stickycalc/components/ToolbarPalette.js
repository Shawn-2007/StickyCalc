// 工具列的「展開式選單」：平常只佔一個按鈕，點開後在右邊列出選項
// 用法：<toolbar-palette title="便利貼顏色" :icon="..." :options="..." @select="option => ..."></toolbar-palette>
// options 每一項要有 key、title、icon（svg-icon 的名稱），其餘欄位原封不動傳回給 @select

const STYLE = `
.toolbar-palette {
    position: relative;
}
.toolbar-palette-trigger::after {
    content: '';
    position: absolute;
    right: 14px;
    bottom: 6px;
    border-left: 4px solid #999;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
}
.toolbar-palette-trigger.is-open {
    background-color: #e0e0e0;
}
.toolbar-palette-options {
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    gap: 2px;
    margin-left: 6px;
    padding: 4px;
    border-radius: 8px;
    background-color: #f0f0f0;
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.15);
}
.toolbar-palette-option {
    width: 40px;
    height: 34px;
    border: none;
    border-radius: 6px;
    background: none;
    display: flex;
    align-items: center;
    justify-content: center;
}
.toolbar-palette-option:hover {
    background-color: #e0e0e0;
}
`;

function injectStyleOnce() {
    if (document.getElementById('toolbar-palette-style')) return;
    const style = document.createElement('style');
    style.id = 'toolbar-palette-style';
    style.textContent = STYLE;
    document.head.appendChild(style);
}

export const ToolbarPalette = {
    props: {
        title: { type: String, required: true },
        icon: { type: String, required: true },
        options: { type: Array, required: true },
    },
    emits: ['select'],
    data() {
        return { open: false };
    },
    created() {
        injectStyleOnce();
    },
    beforeUnmount() {
        document.removeEventListener('pointerdown', this.closeOnOutside, true);
    },
    methods: {
        toggle() {
            this.open ? this.close() : this.show();
        },
        show() {
            this.open = true;
            document.addEventListener('pointerdown', this.closeOnOutside, true);
        },
        close() {
            this.open = false;
            document.removeEventListener('pointerdown', this.closeOnOutside, true);
        },
        // 點到選單以外的地方就收起來（其他工具列按鈕、畫布都算）
        closeOnOutside(event) {
            if (!this.$el.contains(event.target)) this.close();
        },
        choose(option) {
            this.$emit('select', option);
            this.close();
        },
    },
    template: `
        <div class="toolbar-palette">
            <button type="button" class="toolbar-button toolbar-palette-trigger" :class="{ 'is-open': open }"
                :title="title" @click="toggle">
                <svg-icon :name="icon"></svg-icon>
            </button>
            <div v-if="open" class="toolbar-palette-options">
                <button v-for="option in options" :key="option.key" type="button" class="toolbar-palette-option"
                    :title="title + '：' + option.title" @click="choose(option)">
                    <svg-icon :name="option.icon"></svg-icon>
                </button>
            </div>
        </div>
    `,
};
