// SVG图标辅助函数
const Icons = {
    // 创建SVG图标元素
    create(iconId, className = '', size = 24) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('class', `icon ${className}`);
        svg.setAttribute('aria-hidden', 'true');

        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#icon-${iconId}`);

        svg.appendChild(use);
        return svg;
    },

    // 获取SVG图标HTML字符串
    get(iconId, className = '', size = 24) {
        return `<svg width="${size}" height="${size}" class="icon ${className}" aria-hidden="true"><use xlink:href="#icon-${iconId}"></use></svg>`;
    }
};

// 导出到全局
window.Icons = Icons;