// ==================== 应用主类 ====================
// 注意：API_BASE, utils, Router, Store 等已在独立模块中定义

class App {
    constructor() {
        this.router = new Router();
        this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
        this.currentSortBy = 'default';
        this.currentCategory = null;
        this.currentSearchKeyword = '';
        this.currentCategoryId = null;
        this.currentCategoryName = '';
        this.initRoutes();
        this.initNavSearch();
        this.updateUI();
    }

    initRoutes() {
        this.router.register('/', () => this.renderHome());
        this.router.register('/product', (params) => {
            // 使用新的 ProductDetailService 来渲染商品详情页
            if (typeof ProductDetailService !== 'undefined') {
                ProductDetailService.render(params[0]);
            } else {
                // 降级到旧版本
                this.renderProductDetail(params[0]);
            }
        });
        this.router.register('/cart', () => this.renderCart());
        this.router.register('/checkout', () => this.renderCheckout());
        this.router.register('/orders', () => this.renderOrders());
        this.router.register('/login', () => this.renderLogin());
        this.router.register('/register', () => this.renderRegister());
        this.router.register('/profile', () => this.renderProfile());
        this.router.register('/merchant', () => this.renderMerchantManagement());
        this.router.register('/merchant/reports', () => this.renderSalesReports());
        this.router.register('/merchant/customers', () => this.renderCustomerManagement());

        // 帮助页面路由
        this.router.register('/help/order', () => this.renderHelpOrder());
        this.router.register('/help/payment', () => this.renderHelpPayment());
        this.router.register('/help/return', () => this.renderHelpReturn());
        this.router.register('/help/faq', () => this.renderHelpFAQ());

        // 信息页面路由
        this.router.register('/privacy', () => this.renderPrivacy());
        this.router.register('/terms', () => this.renderTerms());
        this.router.register('/about', () => this.renderAbout());

        this.router.register('/404', () => this.render404());
    }

    initNavSearch() {
        const searchInput = document.getElementById('navSearchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.navSearch();
            });
        }
    }

    navSearch() {
        const keyword = document.getElementById('navSearchInput').value.trim();
        this.renderHome(keyword);
    }

    updateUI() {
        const user = utils.getUserInfo();
        const isLoggedIn = !!user;

        document.getElementById('loginNav').style.display = isLoggedIn ? 'none' : 'block';
        document.getElementById('profileNav').style.display = isLoggedIn ? 'block' : 'none';
        document.getElementById('logoutBtn').style.display = isLoggedIn ? 'block' : 'none';
        document.getElementById('cartCount').textContent = this.cart.length;
    }

    async logout() {
        utils.removeToken();
        this.cart = [];
        localStorage.removeItem('cart');
        this.updateUI();
        utils.showToast('已退出登录', 'success');
        this.router.navigate('/');
    }

    // ==================== 页面渲染 ====================

    renderHome(searchKeyword = '', categoryId = null, categoryName = '') {
        const content = document.getElementById('main-content');
        const isSearching = !!searchKeyword;
        const isCategory = !!categoryId;

        this.currentSearchKeyword = searchKeyword;
        this.currentCategoryId = categoryId;
        this.currentCategoryName = categoryName;

        // 如果是搜索或分类筛选，显示简化布局
        if (isSearching || isCategory) {
            content.innerHTML = `
                ${isSearching ? `
                <div class="filter-header">
                    <h2><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-search"></use></svg> 搜索结果: "${searchKeyword}"</h2>
                    <button class="btn btn-sm" onclick="app.renderHome()">清除搜索</button>
                </div>
                ` : ''}
                ${isCategory ? `
                <div class="filter-header">
                    <h2><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-folder"></use></svg> 分类: ${categoryName}</h2>
                    <button class="btn btn-sm" onclick="app.renderHome()">查看全部</button>
                </div>
                ` : ''}
                <div class="main-layout">
                    <aside class="category-sidebar">
                        <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-folder"></use></svg> 商品分类</h3>
                        <div id="category-list" class="category-list">
                            <div class="loading-text">加载中...</div>
                        </div>
                    </aside>
                    <div class="products-section">
                        <div class="section">
                            <div class="section-header-with-sort">
                                <h2><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg> ${isSearching ? '相关商品' : '分类商品'}</h2>
                                <div class="sort-controls">
                                    <label>排序：</label>
                                    <select id="sortSelect" class="sort-select" onchange="app.handleSortChange(this.value)">
                                        <option value="default">默认排序</option>
                                        <option value="sales_desc">销量从高到低</option>
                                        <option value="sales_asc">销量从低到高</option>
                                        <option value="price_desc">价格从高到低</option>
                                        <option value="price_asc">价格从低到高</option>
                                        <option value="time_desc">最新上架</option>
                                    </select>
                                </div>
                            </div>
                            <div id="products-container" class="products-grid">
                                <div class="loading-text">加载中...</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            this.loadCategories();
            this.loadProductsWithSort();
            return;
        }

        // 首页丰富布局
        content.innerHTML = `
            <!-- Hero Banner 轮播区 -->
            <div class="hero-banner">
                <div class="hero-slider" id="heroSlider">
                    <!-- 轮播图将通过JS动态加载 -->
                </div>
                <div class="hero-dots" id="heroDots">
                    <!-- 指示点将通过JS动态生成 -->
                </div>
                <button class="hero-arrow hero-prev" onclick="app.prevSlide()">‹</button>
                <button class="hero-arrow hero-next" onclick="app.nextSlide()">›</button>
            </div>

            <!-- 主内容区：分类 + 全部商品 -->
            <div class="main-layout" id="all-products">
                <aside class="category-sidebar">
                    <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-folder"></use></svg> 商品分类</h3>
                    <div id="category-list" class="category-list">
                        <div class="loading-text">加载中...</div>
                    </div>
                </aside>
                <div class="products-section">
                    <div class="section">
                        <div class="section-header-with-sort">
                            <h2><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg> 全部商品</h2>
                            <div class="sort-controls">
                                <label>排序：</label>
                                <select id="sortSelect" class="sort-select" onchange="app.handleSortChange(this.value)">
                                    <option value="default">默认排序</option>
                                    <option value="sales_desc">销量从高到低</option>
                                    <option value="sales_asc">销量从低到高</option>
                                    <option value="price_desc">价格从高到低</option>
                                    <option value="price_asc">价格从低到高</option>
                                    <option value="time_desc">最新上架</option>
                                </select>
                            </div>
                        </div>
                        <div id="products-container" class="products-grid">
                            <div class="loading-text">加载中...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 加载各区块数据
        this.loadCategories();
        this.loadProductsWithSort();
        this.loadHeroSlides();
    }

    // 轮播图控制
    currentSlide = 0;
    slideInterval = null;
    heroProducts = [];

    async loadHeroSlides() {
        try {
            // 定义轮播图内容 - 使用简洁的背景色和固定矢量图
            const slides = [
                {
                    title: '欢迎来到精品商城',
                    subtitle: '发现优质好物，享受购物乐趣',
                    description: '品质保证 · 售后无忧 · 全国包邮',
                    imageUrl: 'https://cdn.pixabay.com/photo/2017/09/14/21/06/online-2750410_1280.png'
                },
                {
                    title: '精选好物推荐',
                    subtitle: '严选优质商品',
                    description: '为您带来更好的购物体验',
                    imageUrl: 'https://cdn.pixabay.com/photo/2024/05/28/07/31/ai-generated-8793075_1280.png'
                },
                {
                    title: '限时特惠',
                    subtitle: '快速配送，全国包邮',
                    description: '让您尽快收到心仪商品',
                    imageUrl: 'https://cdn.pixabay.com/photo/2025/06/23/15/16/ai-generated-9676121_1280.png'
                }
            ];

            // 渲染轮播图
            const slider = document.getElementById('heroSlider');
            if (slider) {
                slider.innerHTML = slides.map((slide, index) => `
                    <div class="hero-slide ${index === 0 ? 'active' : ''}" style="background: ${slide.bgColor};">
                        <div class="hero-content">
                            <div class="hero-text-wrapper">
                                <h1>${slide.title}</h1>
                                <p class="hero-subtitle">${slide.subtitle}</p>
                                <p class="hero-description">${slide.description}</p>
                                <button class="btn btn-lg hero-btn" onclick="document.getElementById('all-products').scrollIntoView({behavior:'smooth'})">
                                    立即选购 →
                                </button>
                            </div>
                        </div>
                        <div class="hero-product">
                            <div class="hero-image-display">
                                <img src="${slide.imageUrl}" alt="${slide.title}" onerror="this.src='https://cdn.pixabay.com/photo/2014/05/21/13/25/shopping-cart-349544_1280.png'">
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            // 渲染指示点
            const dots = document.getElementById('heroDots');
            if (dots) {
                dots.innerHTML = slides.map((_, index) =>
                    `<span class="hero-dot ${index === 0 ? 'active' : ''}" onclick="app.goToSlide(${index})"></span>`
                ).join('');
            }

            // 启动自动轮播
            this.startHeroSlider();
        } catch (error) {
            console.error('Load hero slides error:', error);
            // 如果加载失败，显示默认轮播图
            this.loadDefaultHeroSlides();
        }
    }

    loadDefaultHeroSlides() {
        const slider = document.getElementById('heroSlider');
        if (slider) {
            slider.innerHTML = `
                <div class="hero-slide active" style="background: #f8f9fa;">
                    <div class="hero-content">
                        <div class="hero-text-wrapper">
                            <h1>欢迎来到精品商城</h1>
                            <p class="hero-subtitle">发现优质好物，享受购物乐趣</p>
                            <p class="hero-description">品质保证 · 售后无忧 · 全国包邮</p>
                            <button class="btn btn-lg hero-btn" onclick="document.getElementById('all-products').scrollIntoView({behavior:'smooth'})">
                                立即选购 →
                            </button>
                        </div>
                    </div>
                    <div class="hero-product">
                        <div class="hero-placeholder">
                            <img src="https://cdn.pixabay.com/photo/2014/05/21/13/25/shopping-cart-349544_1280.png" alt="购物车" style="width: 180px; height: auto; opacity: 0.6;">
                        </div>
                    </div>
                </div>
            `;
        }
        const dots = document.getElementById('heroDots');
        if (dots) {
            dots.innerHTML = '<span class="hero-dot active" onclick="app.goToSlide(0)"></span>';
        }
    }

    startHeroSlider() {
        // 清除之前的定时器
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
        }
        this.slideInterval = setInterval(() => this.nextSlide(), 5000);
    }

    goToSlide(index) {
        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.hero-dot');
        if (slides.length === 0) return;

        this.currentSlide = index;
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    nextSlide() {
        const slides = document.querySelectorAll('.hero-slide');
        if (slides.length === 0) return;
        this.goToSlide((this.currentSlide + 1) % slides.length);
    }

    prevSlide() {
        const slides = document.querySelectorAll('.hero-slide');
        if (slides.length === 0) return;
        this.goToSlide((this.currentSlide - 1 + slides.length) % slides.length);
    }

    // 加载快捷分类
    async loadQuickCategories() {
        try {
            const categories = await utils.request('/guest/categories');
            const container = document.getElementById('quick-category-list');
            if (!container) return;

            if (!categories || categories.length === 0) {
                container.innerHTML = '<div class="empty-small">暂无分类</div>';
                return;
            }

            container.innerHTML = categories.slice(0, 8).map(c => `
                <div class="quick-category-item" onclick="app.selectCategory(${c.id}, '${c.name}')">
                    <div class="quick-category-icon">${c.icon || '<svg width="32" height="32" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg>'}</div>
                    <span class="quick-category-name">${c.name}</span>
                </div>
            `).join('');
        } catch (error) {
            const container = document.getElementById('quick-category-list');
            if (container) container.innerHTML = '<div class="error-small">加载失败</div>';
        }
    }

    // 加载热卖商品
    async loadHotProducts() {
        try {
            const products = await utils.request('/guest/products');
            const container = document.getElementById('hot-products-container');
            if (!container) return;

            // 按销量排序，取前4个
            const hotProducts = [...products].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 4);

            if (hotProducts.length === 0) {
                container.innerHTML = '<div class="empty-small">暂无热卖商品</div>';
                return;
            }

            container.innerHTML = hotProducts.map(p => this.renderProductCard(p, 'hot')).join('');
        } catch (error) {
            const container = document.getElementById('hot-products-container');
            if (container) container.innerHTML = '<div class="error-small">加载失败</div>';
        }
    }

    // 加载新品
    async loadNewProducts() {
        try {
            const products = await utils.request('/guest/products');
            const container = document.getElementById('new-products-container');
            if (!container) return;

            // 按时间排序，取前4个
            const newProducts = [...products].sort((a, b) =>
                new Date(b.create_time || 0) - new Date(a.create_time || 0)
            ).slice(0, 4);

            if (newProducts.length === 0) {
                container.innerHTML = '<div class="empty-small">暂无新品</div>';
                return;
            }

            container.innerHTML = newProducts.map(p => this.renderProductCard(p, 'new')).join('');
        } catch (error) {
            const container = document.getElementById('new-products-container');
            if (container) container.innerHTML = '<div class="error-small">加载失败</div>';
        }
    }

    // 渲染商品卡片（带标签）
    renderProductCard(p, tag = '') {
        const tagHtml = tag === 'hot' ? '<span class="product-tag tag-hot">热卖</span>' :
            tag === 'new' ? '<span class="product-tag tag-new">新品</span>' : '';

        return `
            <div class="product-card" onclick="app.router.navigate('/product/${p.id}')">
                ${tagHtml}
                <div class="product-image">
                    ${p.image_url || p.main_image ? `<img src="${p.image_url || p.main_image}" alt="${p.name}" onerror="this.parentElement.innerHTML='<svg width=\\'72\\' height=\\'72\\' class=\\'icon\\' aria-hidden=\\'true\\'><use xlink:href=\\'#icon-box\\'></use></svg>'" onclick="event.stopPropagation(); openImageViewer('${p.image_url || p.main_image}')" style="cursor: zoom-in;">` : '<svg width="72" height="72" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg>'}
                </div>
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <p class="product-desc">${p.description || '优质商品'}</p>
                    <div class="product-meta">
                        <span class="product-sales">销量: ${p.sales || 0}</span>
                    </div>
                    <div class="product-footer">
                        <span class="price">¥${p.price}</span>
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); app.addToCart(${p.id})">
                            加入购物车
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async loadCategories() {
        try {
            const categories = await utils.request('/guest/categories');
            const container = document.getElementById('category-list');

            if (!categories || categories.length === 0) {
                container.innerHTML = '<div class="empty-small">暂无分类</div>';
                return;
            }

            container.innerHTML = `
                <div class="category-item ${!this.currentCategory ? 'active' : ''}" onclick="app.renderHome()">
                    <span class="category-icon"><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-home"></use></svg></span>
                    <span>全部商品</span>
                </div>
                ${categories.map(c => `
                    <div class="category-item ${this.currentCategory == c.id ? 'active' : ''}"
                         onclick="app.selectCategory(${c.id}, '${c.name}')">
                        <span class="category-icon">${c.icon || '<svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg>'}</span>
                        <span>${c.name}</span>
                    </div>
                `).join('')}
            `;
        } catch (error) {
            document.getElementById('category-list').innerHTML = '<div class="error-small">加载失败</div>';
        }
    }

    selectCategory(categoryId, categoryName) {
        this.currentCategory = categoryId;
        this.renderHome('', categoryId, categoryName);
    }

    handleSortChange(sortBy) {
        this.currentSortBy = sortBy;
        document.getElementById('sortSelect').value = sortBy;
        this.loadProductsWithSort();
    }

    async loadProductsWithSort() {
        const isSearching = !!this.currentSearchKeyword;
        const isCategory = !!this.currentCategoryId;

        let products = [];

        try {
            if (isSearching) {
                products = await utils.request(`/guest/search?keyword=${encodeURIComponent(this.currentSearchKeyword)}`);
            } else if (isCategory) {
                products = await utils.request(`/guest/products/category/${this.currentCategoryId}`);
            } else {
                products = await utils.request('/guest/products');
            }

            products = this.sortProducts(products, this.currentSortBy);
            this.displayProductList(products, 'products-container');
        } catch (error) {
            document.getElementById('products-container').innerHTML = '<div class="error">加载失败</div>';
        }
    }

    sortProducts(products, sortBy) {
        if (!products || products.length === 0) return products;

        const sorted = [...products];

        switch (sortBy) {
            case 'sales_desc':
                sorted.sort((a, b) => (b.sales || 0) - (a.sales || 0));
                break;
            case 'sales_asc':
                sorted.sort((a, b) => (a.sales || 0) - (b.sales || 0));
                break;
            case 'price_desc':
                sorted.sort((a, b) => b.price - a.price);
                break;
            case 'price_asc':
                sorted.sort((a, b) => a.price - b.price);
                break;
            case 'time_desc':
                sorted.sort((a, b) => new Date(b.create_time || 0) - new Date(a.create_time || 0));
                break;
            default:
                sorted.sort((a, b) => (b.sales || 0) - (a.sales || 0));
        }

        return sorted;
    }

    displayProductList(products, containerId) {
        const container = document.getElementById(containerId);

        if (!products || products.length === 0) {
            const keyword = this.currentSearchKeyword;
            container.innerHTML = keyword ?
                `<div class="empty">未找到 "${keyword}" 相关商品</div>` :
                '<div class="empty">暂无商品</div>';
            return;
        }

        container.innerHTML = products.map(p => `
            <div class="product-card" onclick="app.router.navigate('/product/${p.id}')">
                <div class="product-image">
                    ${p.image_url || p.main_image ? `<img src="${p.image_url || p.main_image}" alt="${p.name}" onerror="this.parentElement.innerHTML='<svg width=\\'72\\' height=\\'72\\' class=\\'icon\\' aria-hidden=\\'true\\'><use xlink:href=\\'#icon-box\\'></use></svg>'" onclick="event.stopPropagation(); openImageViewer('${p.image_url || p.main_image}')" style="cursor: zoom-in;">` : '<svg width="72" height="72" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg>'}
                </div>
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <p class="product-desc">${p.description || '优质商品'}</p>
                    <div class="product-meta">
                        <span class="product-sales">销量: ${p.sales || 0}</span>
                    </div>
                    <div class="product-footer">
                        <span class="price">¥${p.price}</span>
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); app.addToCart(${p.id})">
                            加入购物车
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadSearchResults(keyword, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '<div class="loading-text">搜索中...</div>';

        try {
            const products = await utils.request(`/guest/search?keyword=${encodeURIComponent(keyword)}`);

            if (!products || products.length === 0) {
                container.innerHTML = `<div class="empty">未找到 "${keyword}" 相关商品</div>`;
                return;
            }

            container.innerHTML = products.map(p => `
                <div class="product-card" onclick="app.router.navigate('/product/${p.id}')">
                    <div class="product-image">
                        ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" onerror="this.parentElement.innerHTML='<svg width=\\'72\\' height=\\'72\\' class=\\'icon\\' aria-hidden=\\'true\\'><use xlink:href=\\'#icon-box\\'></use></svg>'">` : '<svg width="72" height="72" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg>'}
                    </div>
                    <div class="product-info">
                        <h3>${p.name}</h3>
                        <p class="product-desc">${p.description || '优质商品'}</p>
                        <div class="product-footer">
                            <span class="price">¥${p.price}</span>
                            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); app.addToCart(${p.id})">
                                加入购物车
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            container.innerHTML = '<div class="error">搜索失败</div>';
        }
    }

    async loadProducts(containerId, limit = null) {
        try {
            const products = await utils.request('/guest/products');
            const container = document.getElementById(containerId);

            if (!products || products.length === 0) {
                container.innerHTML = '<div class="empty">暂无商品</div>';
                return;
            }

            const displayProducts = limit ? products.slice(0, limit) : products;

            container.innerHTML = displayProducts.map(p => `
                <div class="product-card" onclick="app.router.navigate('/product/${p.id}')">
                    <div class="product-image">
                        ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" onerror="this.parentElement.innerHTML='<svg width=\\'72\\' height=\\'72\\' class=\\'icon\\' aria-hidden=\\'true\\'><use xlink:href=\\'#icon-box\\'></use></svg>'">` : '<svg width="72" height="72" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg>'}
                    </div>
                    <div class="product-info">
                        <h3>${p.name}</h3>
                        <p class="product-desc">${p.description || '优质商品'}</p>
                        <div class="product-footer">
                            <span class="price">¥${p.price}</span>
                            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); app.addToCart(${p.id})">
                                加入购物车
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            document.getElementById(containerId).innerHTML = '<div class="error">加载失败</div>';
        }
    }

    async renderProductDetail(id) {
        const content = document.getElementById('main-content');
        content.innerHTML = '<div class="loading-text">加载中...</div>';

        try {
            const product = await utils.request(`/guest/product/${id}`);

            // 记录浏览历史
            Store.addBrowsingHistory(product);

            // 处理图片数组
            const images = [];
            if (product.main_image) images.push(product.main_image);
            if (product.images) {
                try {
                    const additionalImages = JSON.parse(product.images);
                    if (Array.isArray(additionalImages)) {
                        images.push(...additionalImages);
                    }
                } catch (e) {
                    // 如果不是JSON，尝试按逗号分割
                    const additionalImages = product.images.split(',').map(img => img.trim()).filter(img => img);
                    images.push(...additionalImages);
                }
            }

            content.innerHTML = `
                <div class="product-detail">
                    <div class="detail-breadcrumb">
                        <button class="btn btn-sm" onclick="history.back()">← 返回</button>
                        <span class="breadcrumb-separator">/</span>
                        <span class="breadcrumb-text">商品详情</span>
                    </div>
                    
                    <div class="detail-container">
                        <!-- 左侧图片区域 -->
                        <div class="detail-image-section">
                            <div class="detail-main-image">
                                ${images.length > 0 ? `
                                    <img id="mainProductImage" src="${images[0]}" alt="${product.name}"
                                         onerror="this.parentElement.innerHTML='<div class=\\'image-placeholder\\'><svg width=\\'120\\' height=\\'120\\' class=\\'icon\\' aria-hidden=\\'true\\'><use xlink:href=\\'#icon-box\\'></use></svg></div>'"
                                         onclick="openImageGallery(${JSON.stringify(images).replace(/"/g, '&quot;')}, 0)"
                                         style="cursor:zoom-in;">
                                ` : '<div class="image-placeholder"><svg width="120" height="120" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg></div>'}
                            </div>
                            ${images.length > 1 ? `
                                <div class="detail-image-thumbnails">
                                    ${images.map((img, idx) => `
                                        <div class="thumbnail ${idx === 0 ? 'active' : ''}"
                                             onclick="app.switchProductImage('${img}', ${idx})"
                                             data-index="${idx}">
                                            <img src="${img}" alt="图片${idx + 1}"
                                                 onerror="this.parentElement.innerHTML='<svg width=\\'40\\' height=\\'40\\' class=\\'icon\\' aria-hidden=\\'true\\'><use xlink:href=\\'#icon-box\\'></use></svg>'">
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- 右侧信息区域 -->
                        <div class="detail-info">
                            <h1 class="detail-title">${product.name}</h1>
                            
                            <!-- 价格区域 -->
                            <div class="detail-price-section">
                                <div class="price-row">
                                    <span class="price-label">价格</span>
                                    <div class="price-value">
                                        <span class="price-large">¥${product.price}</span>
                                        ${product.originalPrice && product.originalPrice > product.price ?
                    `<span class="price-original">¥${product.originalPrice}</span>` : ''}
                                    </div>
                                </div>
                                ${product.originalPrice && product.originalPrice > product.price ? `
                                    <div class="discount-badge">
                                        省¥${(product.originalPrice - product.price).toFixed(2)}
                                    </div>
                                ` : ''}
                            </div>
                            
                            <!-- 商品信息 -->
                            <div class="detail-info-list">
                                <div class="info-item">
                                    <span class="info-label"><svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg> 库存</span>
                                    <span class="info-value ${product.stock < 10 ? 'text-danger' : ''}">${product.stock} 件${product.stock < 10 ? ' (库存紧张)' : ''}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label"><svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-fire"></use></svg> 销量</span>
                                    <span class="info-value">${product.sales || 0} 件</span>
                                </div>
                                ${product.category_name ? `
                                    <div class="info-item">
                                        <span class="info-label"><svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-tag"></use></svg> 分类</span>
                                        <span class="info-value">${product.category_name}</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <!-- 商品描述 -->
                            <div class="detail-description">
                                <h3><svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-note"></use></svg> 商品描述</h3>
                                <p>${product.description || '优质商品，品质保证'}</p>
                            </div>
                            
                            <!-- 购买操作 -->
                            <div class="detail-purchase">
                                <div class="quantity-selector">
                                    <span class="quantity-label">数量</span>
                                    <div class="quantity-control-modern">
                                        <button class="qty-btn" onclick="app.decreaseProductQuantity()" ${product.stock < 1 ? 'disabled' : ''}>−</button>
                                        <input type="number" id="quantity" value="1" min="1" max="${product.stock}"
                                               class="qty-input" readonly>
                                        <button class="qty-btn" onclick="app.increaseProductQuantity(${product.stock})" ${product.stock < 1 ? 'disabled' : ''}>+</button>
                                    </div>
                                </div>
                                
                                <div class="detail-actions">
                                    <button class="btn btn-primary btn-lg btn-block"
                                            onclick="app.addToCart(${product.id}, document.getElementById('quantity').value)"
                                            ${product.stock < 1 ? 'disabled' : ''}>
                                        <svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-cart"></use></svg> ${product.stock < 1 ? '已售罄' : '加入购物车'}
                                    </button>
                                    <button class="btn btn-outline btn-lg btn-block"
                                            onclick="ReviewService.showReviewModal(${product.id}, '${product.name.replace(/'/g, "\\'")}')">
                                        <svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-write"></use></svg> 写评价
                                    </button>
                                </div>
                            </div>
                            
                            <!-- 服务保障 -->
                            <div class="detail-services">
                                <div class="service-item">
                                    <span class="service-icon"><svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-check"></use></svg></span>
                                    <span class="service-text">正品保证</span>
                                </div>
                                <div class="service-item">
                                    <span class="service-icon"><svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-truck"></use></svg></span>
                                    <span class="service-text">快速配送</span>
                                </div>
                                <div class="service-item">
                                    <span class="service-icon"><svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-refresh"></use></svg></span>
                                    <span class="service-text">7天退换</span>
                                </div>
                                <div class="service-item">
                                    <span class="service-icon"><svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-credit-card"></use></svg></span>
                                    <span class="service-text">安全支付</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 商品详情标签页 -->
                    <div class="detail-tabs">
                        <div class="tabs-header">
                            <button class="tab-btn active" onclick="app.switchDetailTab('details')">商品详情</button>
                            <button class="tab-btn" onclick="app.switchDetailTab('specs')">规格参数</button>
                            <button class="tab-btn" onclick="app.switchDetailTab('reviews')">用户评价</button>
                        </div>
                        <div class="tabs-content">
                            <div id="tab-details" class="tab-pane active">
                                <div class="detail-content">
                                    <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-order"></use></svg> 详细信息</h3>
                                    <p>${product.description || '优质商品，品质保证'}</p>
                                    ${images.length > 0 ? `
                                        <div class="detail-images-grid">
                                            ${images.map(img => `
                                                <img src="${img}" alt="商品详情"
                                                     onclick="openImageViewer('${img}')"
                                                     style="cursor:zoom-in;">
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            <div id="tab-specs" class="tab-pane">
                                <div class="specs-table">
                                    <div class="spec-row">
                                        <span class="spec-label">商品名称</span>
                                        <span class="spec-value">${product.name}</span>
                                    </div>
                                    <div class="spec-row">
                                        <span class="spec-label">商品价格</span>
                                        <span class="spec-value">¥${product.price}</span>
                                    </div>
                                    <div class="spec-row">
                                        <span class="spec-label">库存数量</span>
                                        <span class="spec-value">${product.stock} 件</span>
                                    </div>
                                    <div class="spec-row">
                                        <span class="spec-label">累计销量</span>
                                        <span class="spec-value">${product.sales || 0} 件</span>
                                    </div>
                                    ${product.category_name ? `
                                        <div class="spec-row">
                                            <span class="spec-label">商品分类</span>
                                            <span class="spec-value">${product.category_name}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            <div id="tab-reviews" class="tab-pane">
                                <div id="productReviews"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 加载评论
            if (typeof ReviewService !== 'undefined') {
                ReviewService.renderReviewSection('productReviews', product.id);
            }
        } catch (error) {
            content.innerHTML = `
                <div class="error-state">
                    <h3>商品不存在</h3>
                    <p>该商品可能已下架或不存在</p>
                    <button class="btn btn-primary" onclick="history.back()">返回上一页</button>
                </div>
            `;
        }
    }

    // 切换商品图片
    switchProductImage(imageUrl, index) {
        const mainImage = document.getElementById('mainProductImage');
        if (mainImage) {
            mainImage.src = imageUrl;
        }

        // 更新缩略图激活状态
        document.querySelectorAll('.detail-image-thumbnails .thumbnail').forEach((thumb, idx) => {
            thumb.classList.toggle('active', idx === index);
        });
    }

    // 增加商品数量
    increaseProductQuantity(maxStock) {
        const input = document.getElementById('quantity');
        if (input) {
            const currentValue = parseInt(input.value) || 1;
            if (currentValue < maxStock) {
                input.value = currentValue + 1;
            }
        }
    }

    // 减少商品数量
    decreaseProductQuantity() {
        const input = document.getElementById('quantity');
        if (input) {
            const currentValue = parseInt(input.value) || 1;
            if (currentValue > 1) {
                input.value = currentValue - 1;
            }
        }
    }

    // 切换详情标签页
    switchDetailTab(tabName) {
        // 更新标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // 更新内容面板
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`tab-${tabName}`).classList.add('active');
    }

    renderCart() {
        const content = document.getElementById('main-content');

        if (this.cart.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <img src="https://img.icons8.com/?size=128&id=ii6Lr4KivOiE&format=png" alt="Empty Cart Icon" style="width: 96px; height: 96px;">
                    </div>
                    <h3>购物车是空的</h3>
                    <p>快去挑选心仪的商品吧</p>
                    <button class="btn btn-primary btn-lg" onclick="window.location.hash = '/';">
                        <svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-shopping-bag"></use></svg> 去购物
                    </button>
                </div>
            `;
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);

        content.innerHTML = `
            <div class="section">
                <div class="cart-header">
                    <h2><svg width="24" height="24" class="icon" aria-hidden="true"><use xlink:href="#icon-cart"></use></svg> 购物车</h2>
                    <div class="cart-info">
                        <span class="cart-count">共 ${itemCount} 件商品</span>
                        <button class="btn btn-sm" onclick="app.clearCart()">清空购物车</button>
                    </div>
                </div>
                
                <div class="cart-table">
                    <div class="cart-table-header">
                        <div class="col-product">商品信息</div>
                        <div class="col-price">单价</div>
                        <div class="col-quantity">数量</div>
                        <div class="col-total">小计</div>
                        <div class="col-action">操作</div>
                    </div>
                    ${this.cart.map((item, index) => `
                        <div class="cart-table-row">
                            <div class="col-product">
                                <div class="product-mini">
                                    <div class="product-mini-img"><svg width="40" height="40" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg></div>
                                    <div class="product-mini-info">
                                        <h4>${item.name}</h4>
                                        <p class="product-mini-desc">${item.description || '优质商品'}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-price">
                                <span class="price">¥${item.price.toFixed(2)}</span>
                            </div>
                            <div class="col-quantity">
                                <div class="quantity-control">
                                    <button class="qty-btn" onclick="app.decreaseQuantity(${index})">-</button>
                                    <input type="number" value="${item.quantity}" min="1" max="99"
                                        onchange="app.updateCartQuantity(${index}, this.value)" 
                                        class="qty-input">
                                    <button class="qty-btn" onclick="app.increaseQuantity(${index})">+</button>
                                </div>
                            </div>
                            <div class="col-total">
                                <span class="price-bold">¥${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            <div class="col-action">
                                <button class="btn-link btn-danger" onclick="app.removeFromCart(${index})">
                                    <svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-delete"></use></svg> 删除
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="cart-footer">
                    <div class="cart-summary-box">
                        <div class="summary-row">
                            <span>商品总数：</span>
                            <span>${itemCount} 件</span>
                        </div>
                        <div class="summary-row">
                            <span>商品总额：</span>
                            <span class="price">¥${total.toFixed(2)}</span>
                        </div>
                        <div class="summary-row summary-total">
                            <span>应付总额：</span>
                            <span class="price-large">¥${total.toFixed(2)}</span>
                        </div>
                        <button class="btn btn-primary btn-lg btn-block" onclick="app.checkout()">
                            <svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-credit-card"></use></svg> 立即结算
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async addToCart(productId, quantity = 1) {
        try {
            const product = await utils.request(`/guest/product/${productId}`);
            const existingItem = this.cart.find(item => item.id === productId);

            if (existingItem) {
                existingItem.quantity += parseInt(quantity);
                utils.showToast(`已增加数量，当前 ${existingItem.quantity} 件`, 'success');
            } else {
                this.cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    description: product.description,
                    quantity: parseInt(quantity)
                });
                utils.showToast('已加入购物车', 'success');
            }

            localStorage.setItem('cart', JSON.stringify(this.cart));
            this.updateUI();
        } catch (error) {
            console.error('Add to cart error:', error);
            // Error already shown by utils.request
        }
    }

    increaseQuantity(index) {
        if (this.cart[index].quantity < 99) {
            this.cart[index].quantity++;
            localStorage.setItem('cart', JSON.stringify(this.cart));
            this.updateUI();
            this.renderCart();
        }
    }

    decreaseQuantity(index) {
        if (this.cart[index].quantity > 1) {
            this.cart[index].quantity--;
            localStorage.setItem('cart', JSON.stringify(this.cart));
            this.updateUI();
            this.renderCart();
        }
    }

    updateCartQuantity(index, quantity) {
        const qty = parseInt(quantity);
        if (qty > 0 && qty <= 99) {
            this.cart[index].quantity = qty;
            localStorage.setItem('cart', JSON.stringify(this.cart));
            this.updateUI();
            this.renderCart();
        }
    }

    removeFromCart(index) {
        if (confirm('确定要删除此商品吗？')) {
            this.cart.splice(index, 1);
            localStorage.setItem('cart', JSON.stringify(this.cart));
            this.updateUI();
            this.renderCart();
            utils.showToast('已移除', 'success');
        }
    }

    clearCart() {
        if (confirm('确定要清空购物车吗？')) {
            this.cart = [];
            localStorage.removeItem('cart');
            this.updateUI();
            this.renderCart();
            utils.showToast('购物车已清空', 'success');
        }
    }

    checkout() {
        const user = utils.getUserInfo();
        if (!user) {
            utils.showToast('请先登录', 'warning');
            this.router.navigate('/login');
            return;
        }

        if (this.cart.length === 0) {
            utils.showToast('购物车是空的', 'warning');
            return;
        }

        // 跳转到结算页面
        this.router.navigate('/checkout');
    }

    renderCheckout() {
        const user = utils.getUserInfo();
        if (!user) {
            utils.showToast('请先登录', 'warning');
            this.router.navigate('/login');
            return;
        }

        if (this.cart.length === 0) {
            utils.showToast('购物车是空的', 'warning');
            this.router.navigate('/cart');
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const content = document.getElementById('main-content');

        // 获取用户默认信息
        const defaultPhone = user.phone || '';
        const defaultAddress = user.defaultAddress || '';
        const defaultName = user.username || '';
        const defaultEmail = user.email || '';

        content.innerHTML = `
            <div class="checkout-container">
                <h2><svg width="24" height="24" class="icon" aria-hidden="true"><use xlink:href="#icon-order"></use></svg> 确认订单</h2>

                <div class="checkout-section">
                    <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-location"></use></svg> 收货信息</h3>
                    ${defaultPhone || defaultAddress || defaultEmail ? '<div class="form-hint" style="margin-bottom: 12px;"> 已自动填充您的默认信息，可修改</div>' : ''}
                    <form id="checkoutForm" class="address-form">
                        <div class="form-group">
                            <label>收货人姓名 <span class="label-required">*</span></label>
                            <input type="text" name="receiverName" value="${defaultName}" required class="form-input" placeholder="请输入收货人姓名">
                        </div>
                        <div class="form-group">
                            <label>联系电话 <span class="label-required">*</span></label>
                            <input type="tel" name="receiverPhone" value="${defaultPhone}" required class="form-input" placeholder="请输入联系电话" pattern="[0-9]{11}">
                        </div>
                        <div class="form-group">
                            <label>收货地址 <span class="label-required">*</span></label>
                            <textarea name="receiverAddress" required class="form-input" rows="3" placeholder="请输入详细收货地址">${defaultAddress}</textarea>
                        </div>
                        <div class="form-group">
                            <label>通知邮箱 <span class="label-required">*</span></label>
                            <input type="email" name="notificationEmail" value="${defaultEmail}" required class="form-input" placeholder="请输入邮箱地址">
                            <div class="form-hint"> 您将在支付成功和商家发货时收到邮件通知</div>
                        </div>
                        <div class="form-group">
                            <label>订单备注</label>
                            <textarea name="remark" class="form-input" rows="2" placeholder="选填，可以告诉商家您的特殊需求"></textarea>
                        </div>
                    </form>
                </div>

                <div class="checkout-section">
                    <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg> 商品清单</h3>
                    <div class="checkout-items">
                        ${this.cart.map(item => `
                            <div class="checkout-item">
                                <div class="product-mini-img"><svg width="40" height="40" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg></div>
                                <div class="product-mini-info">
                                    <h4>${item.name}</h4>
                                    <p>¥${item.price} × ${item.quantity}</p>
                                </div>
                                <div class="item-subtotal">
                                    ¥${(item.price * item.quantity).toFixed(2)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="checkout-section">
                    <div class="checkout-summary">
                        <div class="checkout-summary-row">
                            <span>商品总额：</span>
                            <span>¥${total.toFixed(2)}</span>
                        </div>
                        <div class="checkout-summary-row">
                            <span>运费：</span>
                            <span>¥0.00</span>
                        </div>
                        <div class="checkout-summary-row checkout-summary-total">
                            <span>应付总额：</span>
                            <span class="amount">¥${total.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="checkout-actions">
                        <button class="btn btn-secondary btn-lg" onclick="app.router.navigate('/cart')">返回购物车</button>
                        <button class="btn btn-primary btn-lg" onclick="app.submitOrder()">提交订单</button>
                    </div>
                </div>
            </div>
        `;
    }

    async submitOrder() {
        const form = document.getElementById('checkoutForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const orderData = {
            items: this.cart.map(item => ({
                productId: item.id,
                quantity: item.quantity
            })),
            receiverName: formData.get('receiverName'),
            receiverPhone: formData.get('receiverPhone'),
            receiverAddress: formData.get('receiverAddress'),
            notificationEmail: formData.get('notificationEmail'),
            remark: formData.get('remark') || ''
        };

        utils.showLoading();
        const result = await OrderService.createOrder(orderData);
        utils.showLoading(false);

        if (result) {
            // 显示支付二维码（演示用）
            this.showPaymentQRCode(result.orderId, result.totalAmount, result.notificationEmail);
        }
    }

    showPaymentQRCode(orderId, amount, notificationEmail) {
        // 验证参数
        if (!orderId) {
            console.error('showPaymentQRCode: orderId is missing');
            utils.showToast('订单ID无效，请重试', 'error');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'paymentModal';
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><svg width="24" height="24" class="icon" aria-hidden="true"><use xlink:href="#icon-credit-card"></use></svg> 扫码支付</h3>
                </div>
                <div class="modal-body" style="text-align: center; padding: 40px;">
                    <div style="margin-bottom: 20px;">
                        <p style="font-size: 16px; color: var(--text-secondary);">订单金额</p>
                        <p style="font-size: 32px; font-weight: 800; color: var(--danger); margin: 10px 0;">¥${amount}</p>
                    </div>
                    
                    <div style="width: 200px; height: 200px; margin: 20px auto; background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <svg width="80" height="80" class="icon" style="color: white;" aria-hidden="true"><use xlink:href="#icon-phone"></use></svg>
                    </div>
                    
                    <p style="margin: 20px 0; color: var(--text-secondary);">请使用微信或支付宝扫码支付</p>
                    <p style="font-size: 13px; color: var(--text-secondary);">（演示模式：3秒后自动完成支付）</p>
                    
                    <div style="margin-top: 30px;">
                        <div class="loading-spinner" style="margin: 0 auto;"></div>
                        <p style="margin-top: 10px; font-size: 14px; color: var(--text-secondary);">支付处理中...</p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // 保存购物车数据用于记录购买日志
        const cartItems = [...this.cart];

        // 保存 this 引用，确保在回调中正确访问
        const self = this;

        // 3秒后自动完成支付
        setTimeout(async () => {
            try {
                console.log('Calling payOrder with:', { orderId, paymentType: 1, notificationEmail });
                const result = await OrderService.payOrder(orderId, 1, notificationEmail);
                console.log('payOrder result:', result);
                modal.remove();

                if (result) {
                    // 记录购买日志
                    Store.logPurchaseToServer(orderId, cartItems);

                    // 清空购物车 - 同时清空 app.cart 和 CartService
                    self.cart = [];
                    localStorage.removeItem('cart');

                    // 同时清空 CartService 的购物车（如果存在）
                    if (typeof CartService !== 'undefined') {
                        CartService.cart = [];
                        CartService.saveCart();
                        CartService.updateCartCount();
                    }

                    self.updateUI();

                    // 跳转到订单列表（OrderService.payOrder 已经显示了成功提示）
                    setTimeout(() => {
                        window.location.hash = '/orders';
                    }, 300);
                }
                // 注意：如果 result 为 null，OrderService.payOrder 已经显示了错误提示
                // 所以这里不需要再显示错误提示
            } catch (error) {
                console.error('Payment error:', error);
                modal.remove();
                // 错误已经在 OrderService.payOrder 中处理，这里不需要再显示
            }
        }, 3000);
    }

    renderOrders() {
        const user = utils.getUserInfo();
        if (!user) {
            utils.showToast('请先登录', 'warning');
            this.router.navigate('/login');
            return;
        }

        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="section">
                <h2><svg width="24" height="24" class="icon" aria-hidden="true"><use xlink:href="#icon-order"></use></svg> 我的订单</h2>
                
                <div class="order-tabs">
                    <button class="order-tab active" onclick="app.filterOrders(null)">全部订单</button>
                    <button class="order-tab" onclick="app.filterOrders(0)">待支付</button>
                    <button class="order-tab" onclick="app.filterOrders(1)">已支付</button>
                    <button class="order-tab" onclick="app.filterOrders(3)">已发货</button>
                    <button class="order-tab" onclick="app.filterOrders(4)">已完成</button>
                    <button class="order-tab" onclick="app.filterOrders(5)">已取消</button>
                </div>

                <div id="ordersList">
                    <div class="loading-text">加载中...</div>
                </div>
            </div>
        `;

        this.currentOrderStatus = null;
        this.loadOrders();
    }

    async loadOrders(status = null) {
        this.currentOrderStatus = status;
        await OrderService.loadAndDisplayOrders(status);
    }

    filterOrders(status) {
        // 更新标签激活状态
        document.querySelectorAll('.order-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');

        // 加载订单
        this.loadOrders(status);
    }

    renderLogin() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="auth-container">
                <div class="auth-box">
                    <div class="auth-header">
                        <div class="auth-icon"></div>
                        <h2>欢迎登录</h2>
                        <p>登录精品商城，开启购物之旅</p>
                    </div>
                    
                    <form onsubmit="app.handleLogin(event)" class="auth-form">
                        <div class="form-group">
                            <label>
                                <span class="label-icon"><svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-user"></use></svg></span>
                                <span>用户类型</span>
                            </label>
                            <div class="radio-group-modern">
                                <label class="radio-card">
                                    <input type="radio" name="userType" value="1" checked>
                                    <div class="radio-content">
                                        <span class="radio-icon">
                                            <img src="https://img.icons8.com/?size=100&id=12438&format=png" alt="Regular User Icon" style="width: 40px; height: 40px;">
                                        </span>
                                        <span class="radio-text">普通用户</span>
                                    </div>
                                </label>
                                <label class="radio-card">
                                    <input type="radio" name="userType" value="2">
                                    <div class="radio-content">
                                        <span class="radio-icon">
                                            <img src="https://img.icons8.com/?size=100&id=ZDJDUuKgm34C&format=png" alt="Merchant Icon" style="width: 40px; height: 40px;">
                                        </span>
                                        <span class="radio-text">商家</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <span class="label-icon"><svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-email"></use></svg></span>
                                <span>账号</span>
                            </label>
                            <input type="text" name="account" placeholder="请输入用户名/手机号/邮箱" required class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <span class="label-icon"><svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-lock"></use></svg></span>
                                <span>密码</span>
                            </label>
                            <input type="password" name="password" placeholder="请输入密码" required class="form-input">
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block btn-lg">
                            <svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-rocket"></use></svg> 立即登录
                        </button>
                    </form>
                    
                    <div class="auth-footer">
                        <p>还没有账号？<a href="#/register" class="auth-link-primary">立即注册</a></p>
                    </div>
                </div>
            </div>
        `;
    }

    async handleLogin(event) {
        event.preventDefault();
        const form = event.target;
        const data = {
            account: form.account.value,
            password: form.password.value,
            userType: parseInt(form.userType.value)
        };

        utils.showLoading();
        try {
            const result = await utils.request('/user/login', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            utils.setToken(result.token);
            utils.setUserInfo(result.userInfo);
            this.updateUI();
            utils.showToast('登录成功', 'success');
            this.router.navigate('/');
        } catch (error) {
            // Error already shown by utils.request
        } finally {
            utils.showLoading(false);
        }
    }

    renderRegister() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="auth-container">
                <div class="auth-box auth-box-large">
                    <div class="auth-header">
                        <div class="auth-icon"><svg width="48" height="48" class="icon" aria-hidden="true"><use xlink:href="#icon-note"></use></svg></div>
                        <h2>创建账号</h2>
                        <p>加入精品商城，享受优质服务</p>
                    </div>
                    
                    <form onsubmit="app.handleRegister(event)" class="auth-form">
                        <div class="form-group">
                            <label>
                                <span class="label-icon"><svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-user"></use></svg></span>
                                <span>用户类型</span>
                            </label>
                            <div class="radio-group-modern">
                                <label class="radio-card">
                                    <input type="radio" name="userType" value="1" checked>
                                    <div class="radio-content">
                                        <span class="radio-icon"><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-user"></use></svg></span>
                                        <span class="radio-text">普通用户</span>
                                        <span class="radio-desc">购物、下单、评价</span>
                                    </div>
                                </label>
                                <label class="radio-card">
                                    <input type="radio" name="userType" value="2">
                                    <div class="radio-content">
                                        <span class="radio-icon"><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-merchant"></use></svg></span>
                                        <span class="radio-text">商家</span>
                                        <span class="radio-desc">发布商品、管理订单</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>
                                    <span class="label-icon"><svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-user"></use></svg></span>
                                    <span>用户名</span>
                                </label>
                                <input type="text" name="username" placeholder="请输入用户名" required class="form-input">
                            </div>
                            
                            <div class="form-group">
                                <label>
                                    <span class="label-icon"><svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-lock"></use></svg></span>
                                    <span>密码</span>
                                </label>
                                <input type="password" name="password" placeholder="6位以上" required minlength="6" class="form-input">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>
                                    <span class="label-icon"><svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-phone"></use></svg></span>
                                    <span>手机号</span>
                                </label>
                                <input type="tel" name="phone" placeholder="请输入手机号" pattern="[0-9]{11}" class="form-input">
                            </div>
                            
                            <div class="form-group">
                                <label>
                                    <span class="label-icon"><svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-email"></use></svg></span>
                                    <span>邮箱</span>
                                </label>
                                <input type="email" name="email" placeholder="请输入邮箱" class="form-input">
                            </div>
                        </div>
                        
                        <div class="form-tips">
                            <p> 注册即表示同意用户协议和隐私政策</p>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block btn-lg">
                            <svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-star"></use></svg> 立即注册
                        </button>
                    </form>
                    
                    <div class="auth-footer">
                        <p>已有账号？<a href="#/login" class="auth-link-primary">立即登录</a></p>
                    </div>
                </div>
            </div>
        `;
    }

    async handleRegister(event) {
        event.preventDefault();
        const form = event.target;
        const data = {
            username: form.username.value,
            password: form.password.value,
            phone: form.phone.value,
            email: form.email.value,
            userType: parseInt(form.userType.value)
        };

        utils.showLoading();
        try {
            await utils.request('/user/register', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            utils.showToast('注册成功，请登录', 'success');
            this.router.navigate('/login');
        } catch (error) {
            // Error already shown
        } finally {
            utils.showLoading(false);
        }
    }

    renderProfile() {
        // 使用 ProfileService 来渲染个人中心
        if (typeof ProfileService !== 'undefined') {
            ProfileService.loadProfile();
        } else {
            // 降级处理
            const user = utils.getUserInfo();
            if (!user) {
                this.router.navigate('/login');
                return;
            }
            const content = document.getElementById('main-content');
            content.innerHTML = '<div class="loading-text">加载中...</div>';
        }
    }

    renderUserSection() {
        return `
            <div class="profile-content">
                <div class="profile-section">
                    <div class="section-title">
                        <h3> 我的订单</h3>
                        <a href="#/orders" class="view-all">查看全部 →</a>
                    </div>
                    <div class="order-stats-grid">
                        <div class="order-stat-card">
                            <div class="stat-icon"></div>
                            <div class="stat-info">
                                <div class="stat-number">0</div>
                                <div class="stat-label">待付款</div>
                            </div>
                        </div>
                        <div class="order-stat-card">
                            <div class="stat-icon"></div>
                            <div class="stat-info">
                                <div class="stat-number">0</div>
                                <div class="stat-label">待发货</div>
                            </div>
                        </div>
                        <div class="order-stat-card">
                            <div class="stat-icon"></div>
                            <div class="stat-info">
                                <div class="stat-number">0</div>
                                <div class="stat-label">待收货</div>
                            </div>
                        </div>
                        <div class="order-stat-card">
                            <div class="stat-icon"></div>
                            <div class="stat-info">
                                <div class="stat-number">0</div>
                                <div class="stat-label">已完成</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="profile-section">
                    <div class="section-title">
                        <h3> 账户设置</h3>
                    </div>
                    <div class="settings-list">
                        <div class="setting-item">
                            <div class="setting-icon"></div>
                            <div class="setting-info">
                                <h4>个人信息</h4>
                                <p>修改头像、昵称等基本信息</p>
                            </div>
                            <button class="btn btn-sm">编辑</button>
                        </div>
                        <div class="setting-item">
                            <div class="setting-icon"></div>
                            <div class="setting-info">
                                <h4>安全设置</h4>
                                <p>修改密码、绑定手机号</p>
                            </div>
                            <button class="btn btn-sm">设置</button>
                        </div>
                        <div class="setting-item">
                            <div class="setting-icon"></div>
                            <div class="setting-info">
                                <h4>收货地址</h4>
                                <p>管理收货地址信息</p>
                            </div>
                            <button class="btn btn-sm">管理</button>
                        </div>
                    </div>
                </div>

                <div class="profile-section">
                    <div class="empty-state-small">
                        <div class="empty-icon-small"></div>
                        <p>暂无订单记录</p>
                        <button class="btn btn-primary" onclick="window.location.hash = '/';">
                            去购物
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderMerchantSection() {
        return `
            <div class="section">
                <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;"><svg width="24" height="24" class="icon" aria-hidden="true"><use xlink:href="#icon-merchant"></use></svg> 商家管理中心</h2>
                    <button class="btn btn-primary" onclick="showMerchantStatsModal()">
                        <svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-chart"></use></svg>
                        数据分析
                    </button>
                </div>
                
                <!-- 统计数据 -->
                <div id="merchant-stats-grid" class="stats-grid">
                    <div class="loading-text">加载统计数据...</div>
                </div>
                
                <!-- 标签页导航 -->
                <div class="merchant-tabs">
                    <button class="merchant-tab active" onclick="app.switchMerchantTab('products')">
                        <svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg>
                        商品管理
                    </button>
                    <button class="merchant-tab" onclick="app.switchMerchantTab('orders')">
                        <svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-order"></use></svg>
                        订单管理
                    </button>
                    <button class="merchant-tab" onclick="app.router.navigate('/merchant/reports')">
                        <svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-chart"></use></svg>
                        销售报表
                    </button>
                    <button class="merchant-tab" onclick="app.router.navigate('/merchant/customers')">
                        <svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-user"></use></svg>
                        客户管理
                    </button>
                </div>
                
                <!-- 商品管理标签页 -->
                <div id="merchant-tab-products" class="merchant-tab-content active">
                    <div class="section-header">
                        <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg> 我的商品</h3>
                        <button class="btn btn-primary" onclick="app.showAddProductModal()">
                            <svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-plus"></use></svg>
                            添加商品
                        </button>
                    </div>
                    <div id="merchant-products" class="products-list">
                        <div class="loading-text">加载中...</div>
                    </div>
                </div>
                
                <!-- 订单管理标签页 -->
                <div id="merchant-tab-orders" class="merchant-tab-content">
                    <div class="section-header">
                        <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-order"></use></svg> 订单列表</h3>
                    </div>
                    
                    <div class="order-tabs">
                        <button class="order-tab active" onclick="MerchantService.filterMerchantOrders(null)">全部订单</button>
                        <button class="order-tab" onclick="MerchantService.filterMerchantOrders(0)">待支付</button>
                        <button class="order-tab" onclick="MerchantService.filterMerchantOrders(1)">已支付</button>
                        <button class="order-tab" onclick="MerchantService.filterMerchantOrders(3)">已发货</button>
                        <button class="order-tab" onclick="MerchantService.filterMerchantOrders(4)">已完成</button>
                        <button class="order-tab" onclick="MerchantService.filterMerchantOrders(5)">已取消</button>
                    </div>
                    
                    <div id="merchant-orders-list">
                        <div class="loading-text">加载中...</div>
                    </div>
                </div>
            </div>

            <!-- 添加/编辑商品模态框 -->
            <div id="productModal" class="modal" style="display:none;">
                <div class="modal-content modal-large">
                    <div class="modal-header">
                        <h3 id="modalTitle">添加商品</h3>
                        <button class="modal-close" onclick="app.closeProductModal()">×</button>
                    </div>
                    <form id="productForm" onsubmit="app.handleAddProduct(event)">
                        <input type="hidden" id="productId" name="id">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>
                                    <span class="label-required">*</span>
                                    商品名称
                                </label>
                                <input type="text" id="productName" name="name" placeholder="请输入商品名称" required class="form-input">
                            </div>
                            
                            <div class="form-group">
                                <label>商品分类</label>
                                <select id="productCategory" name="categoryId" class="form-input">
                                    <option value="">加载中...</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>商品状态</label>
                                <select id="productStatus" name="status" class="form-input">
                                    <option value="1">上架</option>
                                    <option value="0">下架</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>
                                    <span class="label-required">*</span>
                                    商品价格（元）
                                </label>
                                <input type="number" id="productPrice" name="price" placeholder="0.00" step="0.01" min="0" required class="form-input">
                            </div>
                            
                            <div class="form-group">
                                <label>原价（元）</label>
                                <input type="number" id="productOriginalPrice" name="originalPrice" placeholder="0.00" step="0.01" min="0" class="form-input">
                            </div>
                            
                            <div class="form-group">
                                <label>
                                    <span class="label-required">*</span>
                                    库存数量
                                </label>
                                <input type="number" id="productStock" name="stock" placeholder="0" min="0" required class="form-input">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>商品描述</label>
                            <textarea id="productDescription" name="description" rows="3" placeholder="请输入商品描述信息" class="form-input"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                主图URL
                                <span class="label-hint">（可选，支持http://或https://开头的图片链接）</span>
                            </label>
                            <input type="url" id="productMainImage" name="mainImage" placeholder="https://example.com/image.jpg" class="form-input" oninput="app.updateImagePreview()">
                            <div id="mainImagePreview" class="image-preview">
                                <div class="image-preview-placeholder">暂无图片</div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                商品图片组
                                <span class="label-hint">（可选，多个URL用逗号分隔）</span>
                            </label>
                            <textarea id="productImages" name="images" rows="2" placeholder="https://example.com/img1.jpg,https://example.com/img2.jpg" class="form-input"></textarea>
                            <div class="form-hint">💡 提示：可以输入多个图片URL，用英文逗号分隔</div>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="app.closeProductModal()">取消</button>
                            <button type="submit" class="btn btn-primary">保存</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    async loadMerchantData() {
        try {
            const products = await utils.request('/merchant/products');

            const container = document.getElementById('merchant-products');
            if (!container) return;
            if (products.length === 0) {
                container.innerHTML = `
                    <div class="empty-state-small">
                        <div class="empty-icon-small">📦</div>
                        <p>还没有商品</p>
                        <button class="btn btn-primary" onclick="app.showAddProductModal()">
                            添加第一个商品
                        </button>
                    </div>
                `;
                return;
            }

            container.innerHTML = products.map(p => `
                <div class="product-item">
                    <div class="product-item-icon">
                        ${p.mainImage ? `<img src="${p.mainImage}" alt="${p.name}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;" onerror="this.parentElement.innerHTML='📦'">` : '📦'}
                    </div>
                    <div class="product-item-info">
                        <h4>${p.name}</h4>
                        <p class="product-item-desc">${p.description || '暂无描述'}</p>
                        <div class="product-item-meta">
                            <span class="meta-item"> ¥${p.price}</span>
                            <span class="meta-item"> 库存 ${p.stock}</span>
                            <span class="meta-item"> 销量 ${p.sales || 0}</span>
                        </div>
                    </div>
                    <div class="product-item-actions">
                        <button class="btn btn-sm" onclick="app.editProduct(${p.id})"> 编辑</button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteProduct(${p.id})"> 删除</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Load merchant data error:', error);
            const container = document.getElementById('merchant-products');
            if (container) {
                container.innerHTML = '<div class="error">加载失败，请刷新重试</div>';
            }
        }
    }

    async showAddProductModal() {
        const form = document.getElementById('productForm');
        if (form) form.reset();
        document.getElementById('productId').value = '';
        document.getElementById('modalTitle').textContent = '添加商品';
        const preview = document.getElementById('mainImagePreview');
        if (preview) preview.innerHTML = '<div class="image-preview-placeholder">暂无图片</div>';
        await this.loadCategoryOptions();
        document.getElementById('productModal').style.display = 'flex';
    }

    async loadCategoryOptions(selectedId = null) {
        const select = document.getElementById('productCategory');
        if (!select) return;

        try {
            const categories = await utils.request('/guest/categories');
            const otherCategory = categories.find(c => c.name === '其他商品');
            const defaultId = selectedId || (otherCategory ? otherCategory.id : null);

            select.innerHTML = categories.map(c =>
                `<option value="${c.id}" ${defaultId == c.id ? 'selected' : ''}>${c.name}</option>`
            ).join('');
        } catch (error) {
            select.innerHTML = '<option value="">加载分类失败</option>';
        }
    }

    closeProductModal() {
        document.getElementById('productModal').style.display = 'none';
    }

    updateImagePreview() {
        const mainImageUrl = document.getElementById('productMainImage').value.trim();
        const previewContainer = document.getElementById('mainImagePreview');

        if (mainImageUrl && previewContainer) {
            previewContainer.innerHTML = `
                <div class="image-preview-item">
                    <img src="${mainImageUrl}" alt="主图预览" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3E加载失败%3C/text%3E%3C/svg%3E'">
                </div>
            `;
        } else if (previewContainer) {
            previewContainer.innerHTML = '<div class="image-preview-placeholder">暂无图片</div>';
        }
    }

    async editProduct(id) {
        utils.showLoading();
        try {
            const product = await utils.request(`/merchant/products/${id}`);

            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productOriginalPrice').value = product.originalPrice || '';
            document.getElementById('productStock').value = product.stock || 0;
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productMainImage').value = product.mainImage || '';
            document.getElementById('productImages').value = product.images || '';
            document.getElementById('productStatus').value = product.status !== undefined ? product.status : 1;

            await this.loadCategoryOptions(product.categoryId);
            this.updateImagePreview();
            document.getElementById('modalTitle').textContent = '编辑商品';
            document.getElementById('productModal').style.display = 'flex';
        } catch (error) {
            // Error handled
        } finally {
            utils.showLoading(false);
        }
    }

    async handleAddProduct(event) {
        event.preventDefault();
        const form = event.target;
        const productId = document.getElementById('productId').value;

        const name = form.name.value.trim();
        const price = parseFloat(form.price.value);
        const stock = parseInt(form.stock.value);

        if (!name) {
            utils.showToast('请输入商品名称', 'error');
            return;
        }
        if (isNaN(price) || price <= 0) {
            utils.showToast('请输入有效的商品价格', 'error');
            return;
        }
        if (isNaN(stock) || stock < 0) {
            utils.showToast('请输入有效的库存数量', 'error');
            return;
        }

        const categoryId = form.categoryId.value;

        const data = {
            name: name,
            price: price,
            categoryId: categoryId ? parseInt(categoryId) : null,
            originalPrice: form.originalPrice.value ? parseFloat(form.originalPrice.value) : null,
            stock: stock,
            description: form.description.value.trim(),
            mainImage: form.mainImage.value.trim(),
            images: form.images.value.trim(),
            status: parseInt(form.status.value)
        };

        utils.showLoading();
        try {
            const url = productId ? `/merchant/products/${productId}` : '/merchant/products';
            const method = productId ? 'PUT' : 'POST';

            await utils.request(url, {
                method: method,
                body: JSON.stringify(data)
            });

            utils.showToast(productId ? '商品更新成功' : '商品添加成功', 'success');
            this.closeProductModal();
            this.loadMerchantData();
        } catch (error) {
            // Error handled
        } finally {
            utils.showLoading(false);
        }
    }

    async deleteProduct(id) {
        if (!confirm('确定删除此商品？此操作不可恢复！')) return;

        utils.showLoading();
        try {
            await utils.request(`/merchant/products/${id}`, {
                method: 'DELETE'
            });

            utils.showToast('删除成功', 'success');
            this.loadMerchantData();
        } catch (error) {
            // Error handled
        } finally {
            utils.showLoading(false);
        }
    }

    // 切换商家管理标签页
    switchMerchantTab(tabName) {
        // 更新标签按钮状态
        document.querySelectorAll('.merchant-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');

        // 更新内容面板
        document.querySelectorAll('.merchant-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`merchant-tab-${tabName}`).classList.add('active');

        // 加载对应数据
        if (tabName === 'orders') {
            MerchantService.loadMerchantOrders();
        }
    }

    // 渲染商家管理页面
    renderMerchantManagement() {
        const user = utils.getUserInfo();
        if (!user || (user.userType !== 2 && user.role !== 'merchant')) {
            utils.showToast('需要商家权限', 'error');
            this.router.navigate('/');
            return;
        }

        const content = document.getElementById('main-content');
        content.innerHTML = this.renderMerchantSection();

        // 加载统计数据和商品数据
        MerchantService.loadMerchantStats();
        this.loadMerchantData();
    }

    // 渲染销售报表页面
    renderSalesReports() {
        const user = utils.getUserInfo();
        if (!user || (user.userType !== 2 && user.role !== 'merchant')) {
            utils.showToast('需要商家权限', 'error');
            this.router.navigate('/');
            return;
        }

        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="section">
                <div class="page-header">
                    <button class="btn btn-sm" onclick="app.router.navigate('/merchant')">← 返回商家中心</button>
                    <h2><svg width="24" height="24" class="icon" aria-hidden="true"><use xlink:href="#icon-chart"></use></svg> 销售统计报表</h2>
                </div>
                
                <div id="sales-report-container">
                    <div class="loading-text">加载中...</div>
                </div>
            </div>
        `;

        // 使用 SalesReportService 加载报表
        if (typeof SalesReportService !== 'undefined') {
            SalesReportService.loadSalesReport();
        } else {
            document.getElementById('sales-report-container').innerHTML = '<div class="error">销售报表模块加载失败</div>';
        }
    }

    // 渲染客户管理页面
    renderCustomerManagement() {
        const user = utils.getUserInfo();
        if (!user || (user.userType !== 2 && user.role !== 'merchant')) {
            utils.showToast('需要商家权限', 'error');
            this.router.navigate('/');
            return;
        }

        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="section">
                <div class="page-header">
                    <button class="btn btn-sm" onclick="app.router.navigate('/merchant')">← 返回商家中心</button>
                    <h2><svg width="24" height="24" class="icon" aria-hidden="true"><use xlink:href="#icon-user"></use></svg> 客户管理</h2>
                </div>
                
                <div class="section-header" style="margin-top: 20px;">
                    <div class="search-box">
                        <input type="text" id="customerSearchInput" placeholder="搜索客户（用户名/手机号/邮箱）" class="form-input" style="width: 300px;">
                        <button class="btn btn-primary" onclick="CustomerManagement.handleSearch()">
                            <svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-search"></use></svg>
                            搜索
                        </button>
                    </div>
                </div>
                
                <div id="customerList" style="margin-top: 20px;">
                    <div class="loading-text">加载中...</div>
                </div>
            </div>
        `;

        // 使用 CustomerManagement 加载客户数据
        if (typeof CustomerManagement !== 'undefined') {
            CustomerManagement.init();
        } else {
            document.getElementById('customerList').innerHTML = '<div class="error">客户管理模块加载失败</div>';
        }
    }

    // ==================== 帮助页面 ====================

    renderHelpOrder() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="help-page">
                <div class="help-header">
                    <button class="btn btn-sm" onclick="history.back()">← 返回</button>
                    <h1><svg width="28" height="28" class="icon" aria-hidden="true"><use xlink:href="#icon-order"></use></svg> 购物流程</h1>
                </div>
                
                <div class="help-content">
                    <div class="help-section">
                        <h2>1. 浏览商品</h2>
                        <p>在首页浏览所有商品，或通过分类、搜索功能快速找到您需要的商品。</p>
                        <ul>
                            <li>点击商品卡片查看详细信息</li>
                            <li>使用搜索框输入关键词搜索商品</li>
                            <li>通过左侧分类栏筛选商品类别</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>2. 加入购物车</h2>
                        <p>找到心仪的商品后，点击"加入购物车"按钮。</p>
                        <ul>
                            <li>在商品详情页可以选择购买数量</li>
                            <li>购物车图标会显示当前商品数量</li>
                            <li>可以继续浏览添加更多商品</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>3. 确认订单</h2>
                        <p>进入购物车页面，确认商品信息和数量。</p>
                        <ul>
                            <li>可以修改商品数量或删除商品</li>
                            <li>查看订单总金额</li>
                            <li>点击"立即结算"进入结算页面</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>4. 填写收货信息</h2>
                        <p>在结算页面填写收货人信息。</p>
                        <ul>
                            <li>填写收货人姓名和联系电话</li>
                            <li>填写详细的收货地址</li>
                            <li>可选填订单备注</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>5. 完成支付</h2>
                        <p>提交订单后，使用支付宝或微信扫码支付。</p>
                        <ul>
                            <li>支持微信支付、支付宝支付</li>
                            <li>支付成功后订单自动确认</li>
                            <li>可在"我的订单"中查看订单状态</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>6. 等待收货</h2>
                        <p>商家会尽快为您发货，请耐心等待。</p>
                        <ul>
                            <li>订单发货后会更新物流信息</li>
                            <li>收到商品后请及时确认收货</li>
                            <li>确认收货后可以对商品进行评价</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    renderHelpPayment() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="help-page">
                <div class="help-header">
                    <button class="btn btn-sm" onclick="history.back()">← 返回</button>
                    <h1><svg width="28" height="28" class="icon" aria-hidden="true"><use xlink:href="#icon-credit-card"></use></svg> 支付方式</h1>
                </div>
                
                <div class="help-content">
                    <div class="help-section">
                        <h2>支持的支付方式</h2>
                        <p>我们支持多种便捷的支付方式，确保您的购物体验安全、快速。</p>
                    </div>
                    
                    <div class="help-section">
                        <h2>1. 微信支付</h2>
                        <ul>
                            <li>使用微信扫一扫功能扫描支付二维码</li>
                            <li>确认支付金额后输入支付密码</li>
                            <li>支付成功后自动跳转订单页面</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>2. 支付宝支付</h2>
                        <ul>
                            <li>使用支付宝扫一扫功能扫描支付二维码</li>
                            <li>确认支付金额后输入支付密码</li>
                            <li>支付成功后自动跳转订单页面</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>支付安全保障</h2>
                        <ul>
                            <li>所有支付信息均经过加密处理</li>
                            <li>采用第三方支付平台，资金安全有保障</li>
                            <li>支持7天无理由退款</li>
                            <li>如遇支付问题，请联系客服：400-888-8888</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>常见问题</h2>
                        <div class="faq-item">
                            <h3>Q: 支付失败怎么办？</h3>
                            <p>A: 请检查网络连接和账户余额，如仍无法支付请联系客服。</p>
                        </div>
                        <div class="faq-item">
                            <h3>Q: 支付后多久发货？</h3>
                            <p>A: 一般在支付成功后24小时内发货。</p>
                        </div>
                        <div class="faq-item">
                            <h3>Q: 可以使用优惠券吗？</h3>
                            <p>A: 目前暂不支持优惠券，敬请期待。</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderHelpReturn() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="help-page">
                <div class="help-header">
                    <button class="btn btn-sm" onclick="history.back()">← 返回</button>
                    <h1><svg width="28" height="28" class="icon" aria-hidden="true"><use xlink:href="#icon-refresh"></use></svg> 退换货政策</h1>
                </div>
                
                <div class="help-content">
                    <div class="help-section">
                        <h2>7天无理由退货</h2>
                        <p>自收到商品之日起7天内，如商品未使用且不影响二次销售，可申请无理由退货。</p>
                    </div>
                    
                    <div class="help-section">
                        <h2>退货条件</h2>
                        <ul>
                            <li>商品及包装保持完好，不影响二次销售</li>
                            <li>商品配件、赠品、发票等齐全</li>
                            <li>未经使用或损坏</li>
                            <li>不属于特殊商品（如食品、贴身用品等）</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>退货流程</h2>
                        <ol>
                            <li>在"我的订单"中找到需要退货的订单</li>
                            <li>点击"申请退货"按钮</li>
                            <li>填写退货原因和说明</li>
                            <li>等待商家审核（1-2个工作日）</li>
                            <li>审核通过后，将商品寄回指定地址</li>
                            <li>商家收到商品并确认无误后，3-5个工作日内退款</li>
                        </ol>
                    </div>
                    
                    <div class="help-section">
                        <h2>换货说明</h2>
                        <ul>
                            <li>如商品存在质量问题，可申请换货</li>
                            <li>换货需提供商品问题照片</li>
                            <li>商家审核通过后，将为您寄送新商品</li>
                            <li>换货运费由商家承担</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>退款说明</h2>
                        <ul>
                            <li>退款将原路返回至您的支付账户</li>
                            <li>退款到账时间：3-5个工作日</li>
                            <li>如超过5个工作日未到账，请联系客服</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>特别提示</h2>
                        <ul>
                            <li>退货运费：非质量问题由买家承担</li>
                            <li>质量问题退货运费由商家承担</li>
                            <li>如有疑问，请联系客服：400-888-8888</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    renderHelpFAQ() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="help-page">
                <div class="help-header">
                    <button class="btn btn-sm" onclick="history.back()">← 返回</button>
                    <h1><svg width="28" height="28" class="icon" aria-hidden="true"><use xlink:href="#icon-help"></use></svg> 常见问题</h1>
                </div>
                
                <div class="help-content">
                    <div class="help-section">
                        <h2>账户相关</h2>
                        
                        <div class="faq-item">
                            <h3>Q: 如何注册账号？</h3>
                            <p>A: 点击页面右上角的"登录"按钮，然后选择"立即注册"，填写相关信息即可完成注册。</p>
                        </div>
                        
                        <div class="faq-item">
                            <h3>Q: 忘记密码怎么办？</h3>
                            <p>A: 请联系客服：400-888-8888，提供账号信息后可重置密码。</p>
                        </div>
                        
                        <div class="faq-item">
                            <h3>Q: 可以修改个人信息吗？</h3>
                            <p>A: 可以。登录后进入"个人中心"，在账户设置中修改个人信息。</p>
                        </div>
                    </div>
                    
                    <div class="help-section">
                        <h2>购物相关</h2>
                        
                        <div class="faq-item">
                            <h3>Q: 如何搜索商品？</h3>
                            <p>A: 在页面顶部的搜索框中输入商品名称或关键词，点击搜索即可。</p>
                        </div>
                        
                        <div class="faq-item">
                            <h3>Q: 购物车商品会保存多久？</h3>
                            <p>A: 购物车商品会一直保存，直到您手动删除或下单购买。</p>
                        </div>
                        
                        <div class="faq-item">
                            <h3>Q: 可以一次购买多件商品吗？</h3>
                            <p>A: 可以。将多件商品加入购物车后，一起结算即可。</p>
                        </div>
                    </div>
                    
                    <div class="help-section">
                        <h2>订单相关</h2>
                        
                        <div class="faq-item">
                            <h3>Q: 如何查看订单状态？</h3>
                            <p>A: 登录后进入"个人中心"，点击"我的订单"即可查看所有订单状态。</p>
                        </div>
                        
                        <div class="faq-item">
                            <h3>Q: 可以取消订单吗？</h3>
                            <p>A: 未支付的订单可以直接取消。已支付但未发货的订单，请联系客服取消。</p>
                        </div>
                        
                        <div class="faq-item">
                            <h3>Q: 订单发货后多久能收到？</h3>
                            <p>A: 一般3-7个工作日内送达，具体时间视地区而定。</p>
                        </div>
                    </div>
                    
                    <div class="help-section">
                        <h2>配送相关</h2>
                        
                        <div class="faq-item">
                            <h3>Q: 配送范围是哪里？</h3>
                            <p>A: 目前支持全国配送（港澳台除外）。</p>
                        </div>
                        
                        <div class="faq-item">
                            <h3>Q: 运费如何计算？</h3>
                            <p>A: 目前全场包邮，无需支付运费。</p>
                        </div>
                        
                        <div class="faq-item">
                            <h3>Q: 可以修改收货地址吗？</h3>
                            <p>A: 订单未发货前可以联系客服修改地址。已发货的订单无法修改。</p>
                        </div>
                    </div>
                    
                    <div class="help-section">
                        <h2>售后相关</h2>
                        
                        <div class="faq-item">
                            <h3>Q: 收到的商品有问题怎么办？</h3>
                            <p>A: 请在收货后24小时内联系客服，提供商品照片，我们会尽快为您处理。</p>
                        </div>
                        
                        <div class="faq-item">
                            <h3>Q: 如何申请退款？</h3>
                            <p>A: 在"我的订单"中找到对应订单，点击"申请退款"，填写退款原因即可。</p>
                        </div>
                        
                        <div class="faq-item">
                            <h3>Q: 退款多久到账？</h3>
                            <p>A: 商家审核通过后，3-5个工作日内退款到账。</p>
                        </div>
                    </div>
                    
                    <div class="help-section">
                        <h2>联系我们</h2>
                        <p>如果以上内容无法解决您的问题，请通过以下方式联系我们：</p>
                        <ul>
                            <li>客服热线：400-888-8888（工作时间：9:00-18:00）</li>
                            <li>客服邮箱：service@shop.com</li>
                            <li>在线客服：点击页面右下角的客服图标</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== 信息页面 ====================

    renderPrivacy() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="help-page">
                <div class="help-header">
                    <button class="btn btn-sm" onclick="history.back()">← 返回</button>
                    <h1><svg width="28" height="28" class="icon" aria-hidden="true"><use xlink:href="#icon-lock"></use></svg> 隐私政策</h1>
                </div>
                
                <div class="help-content">
                    <div class="help-section">
                        <p>精品商城（以下简称"我们"）非常重视用户的隐私保护。本隐私政策说明了我们如何收集、使用、存储和保护您的个人信息。</p>
                    </div>
                    
                    <div class="help-section">
                        <h2>1. 信息收集</h2>
                        <p>我们可能收集以下类型的信息：</p>
                        <ul>
                            <li><strong>账户信息：</strong>用户名、密码、手机号、邮箱等</li>
                            <li><strong>订单信息：</strong>收货地址、联系方式、购买记录等</li>
                            <li><strong>设备信息：</strong>IP地址、浏览器类型、操作系统等</li>
                            <li><strong>使用信息：</strong>浏览记录、搜索记录、购物车信息等</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>2. 信息使用</h2>
                        <p>我们收集的信息将用于：</p>
                        <ul>
                            <li>提供和改进我们的服务</li>
                            <li>处理订单和配送商品</li>
                            <li>与您沟通订单状态和促销活动</li>
                            <li>个性化推荐商品</li>
                            <li>防止欺诈和保护账户安全</li>
                            <li>遵守法律法规要求</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>3. 信息共享</h2>
                        <p>我们不会出售您的个人信息。在以下情况下，我们可能会共享您的信息：</p>
                        <ul>
                            <li>获得您的明确同意</li>
                            <li>与配送服务商共享必要的配送信息</li>
                            <li>与支付服务商共享必要的支付信息</li>
                            <li>遵守法律法规或政府要求</li>
                            <li>保护我们或他人的合法权益</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>4. 信息安全</h2>
                        <p>我们采取以下措施保护您的信息安全：</p>
                        <ul>
                            <li>使用加密技术传输和存储敏感信息</li>
                            <li>实施严格的访问控制和权限管理</li>
                            <li>定期进行安全审计和漏洞扫描</li>
                            <li>建立应急响应机制处理安全事件</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>5. Cookie使用</h2>
                        <p>我们使用Cookie和类似技术来：</p>
                        <ul>
                            <li>记住您的登录状态</li>
                            <li>保存购物车信息</li>
                            <li>分析网站使用情况</li>
                            <li>提供个性化体验</li>
                        </ul>
                        <p>您可以通过浏览器设置管理Cookie，但这可能影响某些功能的使用。</p>
                    </div>
                    
                    <div class="help-section">
                        <h2>6. 您的权利</h2>
                        <p>您对个人信息享有以下权利：</p>
                        <ul>
                            <li>访问和查看您的个人信息</li>
                            <li>更正不准确的个人信息</li>
                            <li>删除您的个人信息</li>
                            <li>撤回同意或限制处理</li>
                            <li>数据可携带权</li>
                        </ul>
                        <p>如需行使上述权利，请联系我们的客服。</p>
                    </div>
                    
                    <div class="help-section">
                        <h2>7. 未成年人保护</h2>
                        <p>我们不会故意收集未满18周岁未成年人的个人信息。如果您是未成年人的监护人，发现我们收集了未成年人的信息，请联系我们删除。</p>
                    </div>
                    
                    <div class="help-section">
                        <h2>8. 政策更新</h2>
                        <p>我们可能会不时更新本隐私政策。更新后的政策将在网站上公布，重大变更会通过邮件或站内通知告知您。</p>
                    </div>
                    
                    <div class="help-section">
                        <h2>9. 联系我们</h2>
                        <p>如对本隐私政策有任何疑问，请通过以下方式联系我们：</p>
                        <ul>
                            <li>客服热线：400-888-8888</li>
                            <li>客服邮箱：service@shop.com</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    renderTerms() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="help-page">
                <div class="help-header">
                    <button class="btn btn-sm" onclick="history.back()">← 返回</button>
                    <h1><svg width="28" height="28" class="icon" aria-hidden="true"><use xlink:href="#icon-note"></use></svg> 服务条款</h1>
                </div>
                
                <div class="help-content">
                    <div class="help-section">
                        <p>欢迎使用精品商城！在使用我们的服务前，请仔细阅读以下服务条款。</p>
                    </div>
                    
                    <div class="help-section">
                        <h2>1. 服务说明</h2>
                        <p>精品商城是一个在线购物平台，为用户提供商品浏览、购买、支付等服务。我们致力于为用户提供优质的购物体验。</p>
                    </div>
                    
                    <div class="help-section">
                        <h2>2. 用户注册</h2>
                        <ul>
                            <li>用户需提供真实、准确的注册信息</li>
                            <li>用户应妥善保管账号和密码</li>
                            <li>用户对账号下的所有行为负责</li>
                            <li>禁止将账号转让或出借给他人使用</li>
                            <li>发现账号被盗用应立即通知我们</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>3. 商品信息</h2>
                        <ul>
                            <li>我们努力确保商品信息的准确性</li>
                            <li>商品图片仅供参考，以实物为准</li>
                            <li>商品价格可能随市场变化调整</li>
                            <li>库存信息实时更新，但不保证绝对准确</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>4. 订单处理</h2>
                        <ul>
                            <li>提交订单即表示您同意购买该商品</li>
                            <li>我们有权拒绝或取消任何订单</li>
                            <li>订单确认后，我们将尽快安排发货</li>
                            <li>特殊情况下可能延迟发货，我们会及时通知</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>5. 支付方式</h2>
                        <ul>
                            <li>支持微信支付、支付宝等主流支付方式</li>
                            <li>支付信息经过加密处理，确保安全</li>
                            <li>支付成功后订单自动确认</li>
                            <li>如遇支付问题，请联系客服</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>6. 配送服务</h2>
                        <ul>
                            <li>我们提供全国配送服务（港澳台除外）</li>
                            <li>配送时间一般为3-7个工作日</li>
                            <li>偏远地区可能需要更长时间</li>
                            <li>配送过程中如有问题，请联系客服</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>7. 退换货政策</h2>
                        <ul>
                            <li>支持7天无理由退货</li>
                            <li>商品需保持完好，不影响二次销售</li>
                            <li>质量问题可申请换货或退款</li>
                            <li>详细政策请查看"退换货政策"页面</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>8. 用户行为规范</h2>
                        <p>用户在使用服务时，不得：</p>
                        <ul>
                            <li>发布虚假信息或恶意评价</li>
                            <li>侵犯他人知识产权或隐私权</li>
                            <li>进行欺诈、洗钱等违法活动</li>
                            <li>干扰或破坏平台正常运营</li>
                            <li>使用外挂、机器人等非法工具</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>9. 知识产权</h2>
                        <ul>
                            <li>网站内容受知识产权法保护</li>
                            <li>未经许可不得复制、传播网站内容</li>
                            <li>商标、Logo等标识归我们所有</li>
                            <li>用户上传内容应确保拥有相应权利</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>10. 免责声明</h2>
                        <ul>
                            <li>我们不对第三方链接内容负责</li>
                            <li>不可抗力导致的服务中断不承担责任</li>
                            <li>用户自行承担使用服务的风险</li>
                            <li>我们保留随时修改或终止服务的权利</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>11. 争议解决</h2>
                        <ul>
                            <li>本条款适用中华人民共和国法律</li>
                            <li>因本条款引起的争议，双方应友好协商解决</li>
                            <li>协商不成的，可向我方所在地人民法院提起诉讼</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>12. 条款修改</h2>
                        <p>我们保留随时修改本服务条款的权利。修改后的条款将在网站上公布，继续使用服务即表示您接受修改后的条款。</p>
                    </div>
                    
                    <div class="help-section">
                        <h2>13. 联系我们</h2>
                        <p>如对本服务条款有任何疑问，请通过以下方式联系我们：</p>
                        <ul>
                            <li>客服热线：400-888-8888</li>
                            <li>客服邮箱：service@shop.com</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    renderAbout() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="help-page">
                <div class="help-header">
                    <button class="btn btn-sm" onclick="history.back()">← 返回</button>
                    <h1><svg width="28" height="28" class="icon" aria-hidden="true"><use xlink:href="#icon-home"></use></svg> 关于我们</h1>
                </div>
                
                <div class="help-content">                  
                    <div class="help-section">
                        <h2>我们的使命</h2>
                        <p>让每个人都能轻松享受到优质商品和贴心服务，成为用户最信赖的购物平台。</p>
                    </div>
                    
                    <div class="help-section">
                        <h2>我们的愿景</h2>
                        <p>打造中国领先的精品电商平台，为用户创造更美好的购物体验。</p>
                    </div>
                    
                    <div class="help-section">
                        <h2>核心价值观</h2>
                        <ul>
                            <li><strong>品质第一：</strong>严格把控商品质量，只为用户提供优质商品</li>
                            <li><strong>用户至上：</strong>始终将用户需求放在首位，提供贴心服务</li>
                            <li><strong>诚信经营：</strong>坚持诚信原则，建立长期信任关系</li>
                            <li><strong>持续创新：</strong>不断优化服务，提升用户体验</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>我们的优势</h2>
                        <ul>
                            <li><strong>精选商品：</strong>严格筛选供应商，确保商品品质</li>
                            <li><strong>价格优惠：</strong>直接对接品牌方，减少中间环节</li>
                            <li><strong>快速配送：</strong>全国多个仓储中心，快速送达</li>
                            <li><strong>售后保障：</strong>7天无理由退货，完善的售后服务</li>
                            <li><strong>安全支付：</strong>多种支付方式，资金安全有保障</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>联系我们</h2>
                        <p>我们期待为您提供更好的服务，欢迎随时联系我们：</p>
                        <ul>
                            <li><strong>客服热线：</strong>400-888-8888（工作时间：9:00-18:00）</li>
                            <li><strong>客服邮箱：</strong>service@shop.com</li>
                            <li><strong>公司地址：</strong>广州市番禺区窝工</li>
                            <li><strong>商务合作：</strong>business@shop.com</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h2>加入我们</h2>
                        <p>我们正在寻找志同道合的伙伴，如果您对电商行业充满热情，欢迎加入我们的团队！</p>
                        <p>招聘邮箱：hr@shop.com</p>
                    </div>
                </div>
            </div>
        `;
    }

    render404() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">404</div>
                <p>页面不存在</p>
                <button class="btn btn-primary" onclick="app.router.navigate('/')">返回首页</button>
            </div>
        `;
    }
}

// ==================== 初始化应用 ====================
const app = new App();


