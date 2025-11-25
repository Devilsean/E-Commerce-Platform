// 现代商务电商增强功能模块

const EnhancedFeatures = {
    searchTimeout: null,
    searchResults: [],

    // 初始化
    init() {
        this.initInstantSearch();
        this.initProductHoverEffects();
        this.initMegaMenu();
    },

    // 即时搜索功能
    initInstantSearch() {
        const searchInput = document.getElementById('navSearchInput');
        const searchDropdown = this.createSearchDropdown();

        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            if (query.length < 2) {
                searchDropdown.classList.remove('active');
                return;
            }

            // 防抖处理
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.performInstantSearch(query, searchDropdown);
            }, 300);
        });

        // 点击外部关闭下拉
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                searchDropdown.classList.remove('active');
            }
        });
    },

    // 创建搜索下拉框
    createSearchDropdown() {
        let dropdown = document.querySelector('.search-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'search-dropdown';
            const searchContainer = document.querySelector('.nav-search');
            if (searchContainer) {
                searchContainer.style.position = 'relative';
                searchContainer.appendChild(dropdown);
            }
        }
        return dropdown;
    },

    // 执行即时搜索
    async performInstantSearch(query, dropdown) {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/guest/products`);
            const data = await response.json();

            if (data.code === 200 && data.data) {
                // 过滤匹配的商品
                const results = data.data.filter(product =>
                    product.name.toLowerCase().includes(query.toLowerCase()) ||
                    (product.description && product.description.toLowerCase().includes(query.toLowerCase()))
                ).slice(0, 5);

                this.displaySearchResults(results, dropdown);
            }
        } catch (error) {
            console.error('搜索失败:', error);
        }
    },

    // 显示搜索结果
    displaySearchResults(results, dropdown) {
        if (results.length === 0) {
            dropdown.innerHTML = '<div style="padding: 16px; text-align: center; color: #999;">未找到相关商品</div>';
            dropdown.classList.add('active');
            return;
        }

        dropdown.innerHTML = results.map(product => `
            <div class="search-result-item" onclick="EnhancedFeatures.navigateToProduct(${product.id})">
                <img src="${product.image_url || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\'%3E%3Crect fill=\'%23f0f0f0\' width=\'48\' height=\'48\'/%3E%3C/svg%3E'}" 
                     alt="${escapeHtml(product.name)}" 
                     class="search-result-image">
                <div class="search-result-info">
                    <div class="search-result-title">${escapeHtml(product.name)}</div>
                    <div class="search-result-price">¥${product.price}</div>
                </div>
            </div>
        `).join('');

        dropdown.classList.add('active');
    },

    // 导航到商品详情
    navigateToProduct(productId) {
        // 关闭搜索下拉
        const dropdown = document.querySelector('.search-dropdown');
        if (dropdown) dropdown.classList.remove('active');

        // 这里可以触发商品详情显示
        console.log('Navigate to product:', productId);
    },

    // 初始化产品悬停效果（图片切换）
    initProductHoverEffects() {
        // 使用事件委托处理动态添加的产品卡片
        document.addEventListener('mouseenter', (e) => {
            const productCard = e.target.closest('.product-card');
            if (!productCard) return;

            const images = productCard.querySelectorAll('.product-image img');
            if (images.length >= 2) {
                images[0].classList.add('primary');
                images[1].classList.add('secondary');
            }
        }, true);
    },

    // 初始化巨型菜单
    initMegaMenu() {
        const megaMenuData = [
            {
                title: '电子产品',
                items: ['手机', '电脑', '平板', '耳机', '相机']
            },
            {
                title: '服装鞋包',
                items: ['男装', '女装', '运动', '箱包', '配饰']
            },
            {
                title: '家居生活',
                items: ['家具', '家纺', '厨具', '收纳', '装饰']
            },
            {
                title: '美妆个护',
                items: ['护肤', '彩妆', '香水', '个护', '工具']
            }
        ];

        // 创建巨型菜单触发器
        const navMenu = document.querySelector('.nav-menu');
        if (!navMenu) return;

        const megaMenuWrapper = document.createElement('div');
        megaMenuWrapper.className = 'mega-menu-wrapper';
        megaMenuWrapper.innerHTML = `
            <button class="mega-menu-trigger">
                分类
                <svg class="icon" style="width: 12px; height: 12px; margin-left: 4px;">
                    <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                </svg>
            </button>
            <div class="mega-menu">
                <div class="mega-menu-content">
                    ${megaMenuData.map(column => `
                        <div class="mega-menu-column">
                            <div class="mega-menu-title">${column.title}</div>
                            <ul class="mega-menu-list">
                                ${column.items.map(item => `
                                    <li class="mega-menu-item">
                                        <a href="#" class="mega-menu-link">${item}</a>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // 插入到导航菜单的第一个位置
        navMenu.insertBefore(megaMenuWrapper, navMenu.firstChild);

        // 绑定事件
        const trigger = megaMenuWrapper.querySelector('.mega-menu-trigger');
        const menu = megaMenuWrapper.querySelector('.mega-menu');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('active');
        });

        // 点击外部关闭
        document.addEventListener('click', () => {
            menu.classList.remove('active');
        });

        menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    },

    // 显示骨架屏
    showSkeleton(container, count = 8) {
        const skeletonHTML = `
            <div class="skeleton-grid-4">
                ${Array(count).fill(0).map(() => `
                    <div class="skeleton-card">
                        <div class="skeleton-image skeleton"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-title skeleton"></div>
                            <div class="skeleton-text skeleton"></div>
                            <div class="skeleton-text-short skeleton"></div>
                            <div class="skeleton-price skeleton"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.innerHTML = skeletonHTML;
    }
};

// 在页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        EnhancedFeatures.init();
    });
} else {
    EnhancedFeatures.init();
}