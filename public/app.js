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
        this.router.register('/product', (params) => this.renderProductDetail(params[0]));
        this.router.register('/cart', () => this.renderCart());
        this.router.register('/checkout', () => this.renderCheckout());
        this.router.register('/orders', () => this.renderOrders());
        this.router.register('/login', () => this.renderLogin());
        this.router.register('/register', () => this.renderRegister());
        this.router.register('/profile', () => this.renderProfile());
        this.router.register('/merchant', () => this.renderMerchantManagement());
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
                    <h2>🔍 搜索结果: "${searchKeyword}"</h2>
                    <button class="btn btn-sm" onclick="app.renderHome()">清除搜索</button>
                </div>
                ` : ''}
                ${isCategory ? `
                <div class="filter-header">
                    <h2>📁 分类: ${categoryName}</h2>
                    <button class="btn btn-sm" onclick="app.renderHome()">查看全部</button>
                </div>
                ` : ''}
                <div class="main-layout">
                    <aside class="category-sidebar">
                        <h3>📂 商品分类</h3>
                        <div id="category-list" class="category-list">
                            <div class="loading-text">加载中...</div>
                        </div>
                    </aside>
                    <div class="products-section">
                        <div class="section">
                            <div class="section-header-with-sort">
                                <h2>${isSearching ? '📦 相关商品' : '📦 分类商品'}</h2>
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
                    <div class="hero-slide active" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <div class="hero-content">
                            <h1>🎉 欢迎来到精品商城</h1>
                            <p>发现优质好物，享受购物乐趣</p>
                            <button class="btn btn-lg hero-btn" onclick="document.getElementById('all-products').scrollIntoView({behavior:'smooth'})">
                                立即选购 →
                            </button>
                        </div>
                    </div>
                    <div class="hero-slide" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                        <div class="hero-content">
                            <h1>🔥 热卖爆款</h1>
                            <p>精选好物，限时特惠</p>
                            <button class="btn btn-lg hero-btn" onclick="document.getElementById('hot-products').scrollIntoView({behavior:'smooth'})">
                                查看热卖 →
                            </button>
                        </div>
                    </div>
                    <div class="hero-slide" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                        <div class="hero-content">
                            <h1>✨ 新品上架</h1>
                            <p>每日上新，惊喜不断</p>
                            <button class="btn btn-lg hero-btn" onclick="document.getElementById('new-products').scrollIntoView({behavior:'smooth'})">
                                发现新品 →
                            </button>
                        </div>
                    </div>
                </div>
                <div class="hero-dots">
                    <span class="hero-dot active" onclick="app.goToSlide(0)"></span>
                    <span class="hero-dot" onclick="app.goToSlide(1)"></span>
                    <span class="hero-dot" onclick="app.goToSlide(2)"></span>
                </div>
                <button class="hero-arrow hero-prev" onclick="app.prevSlide()">‹</button>
                <button class="hero-arrow hero-next" onclick="app.nextSlide()">›</button>
            </div>

            <!-- 快捷分类入口 -->
            <div class="quick-categories section">
                <h2 class="section-title-center">🏷️ 热门分类</h2>
                <div id="quick-category-list" class="quick-category-grid">
                    <div class="loading-text">加载中...</div>
                </div>
            </div>

            <!-- 促销活动区 -->
            <div class="promo-section">
                <div class="promo-card promo-hot">
                    <div class="promo-icon">🔥</div>
                    <div class="promo-info">
                        <h3>限时热卖</h3>
                        <p>爆款商品限时抢购</p>
                    </div>
                    <button class="btn btn-sm" onclick="document.getElementById('hot-products').scrollIntoView({behavior:'smooth'})">去看看</button>
                </div>
                <div class="promo-card promo-new">
                    <div class="promo-icon">✨</div>
                    <div class="promo-info">
                        <h3>新品首发</h3>
                        <p>每日上新好物</p>
                    </div>
                    <button class="btn btn-sm" onclick="document.getElementById('new-products').scrollIntoView({behavior:'smooth'})">去看看</button>
                </div>
                <div class="promo-card promo-discount">
                    <div class="promo-icon">💰</div>
                    <div class="promo-info">
                        <h3>超值特惠</h3>
                        <p>精选低价好物</p>
                    </div>
                    <button class="btn btn-sm" onclick="document.getElementById('all-products').scrollIntoView({behavior:'smooth'})">去看看</button>
                </div>
                <div class="promo-card promo-quality">
                    <div class="promo-icon">👑</div>
                    <div class="promo-info">
                        <h3>品质保证</h3>
                        <p>正品保障售后无忧</p>
                    </div>
                    <button class="btn btn-sm" onclick="document.getElementById('all-products').scrollIntoView({behavior:'smooth'})">去看看</button>
                </div>
            </div>

            <!-- 热卖商品区 -->
            <div class="section" id="hot-products">
                <div class="section-header">
                    <h2>🔥 热卖爆款</h2>
                    <span class="section-subtitle">销量最高的人气商品</span>
                </div>
                <div id="hot-products-container" class="products-grid products-grid-4">
                    <div class="loading-text">加载中...</div>
                </div>
            </div>

            <!-- 新品上架区 -->
            <div class="section" id="new-products">
                <div class="section-header">
                    <h2>✨ 新品上架</h2>
                    <span class="section-subtitle">最新上架的优质商品</span>
                </div>
                <div id="new-products-container" class="products-grid products-grid-4">
                    <div class="loading-text">加载中...</div>
                </div>
            </div>

            <!-- 主内容区：分类 + 全部商品 -->
            <div class="main-layout" id="all-products">
                <aside class="category-sidebar">
                    <h3>📂 商品分类</h3>
                    <div id="category-list" class="category-list">
                        <div class="loading-text">加载中...</div>
                    </div>
                </aside>
                <div class="products-section">
                    <div class="section">
                        <div class="section-header-with-sort">
                            <h2>📦 全部商品</h2>
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
        this.loadQuickCategories();
        this.loadHotProducts();
        this.loadNewProducts();
        this.loadProductsWithSort();
        this.startHeroSlider();
    }

    // 轮播图控制
    currentSlide = 0;
    slideInterval = null;

    startHeroSlider() {
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
                    <div class="quick-category-icon">${c.icon || '📦'}</div>
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
                    ${p.image_url || p.main_image ? `<img src="${p.image_url || p.main_image}" alt="${p.name}" onerror="this.parentElement.innerHTML='📦'" onclick="event.stopPropagation(); openImageViewer('${p.image_url || p.main_image}')" style="cursor: zoom-in;">` : '📦'}
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
                    <span class="category-icon">🏠</span>
                    <span>全部商品</span>
                </div>
                ${categories.map(c => `
                    <div class="category-item ${this.currentCategory == c.id ? 'active' : ''}"
                         onclick="app.selectCategory(${c.id}, '${c.name}')">
                        <span class="category-icon">${c.icon || '📦'}</span>
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
                    ${p.image_url || p.main_image ? `<img src="${p.image_url || p.main_image}" alt="${p.name}" onerror="this.parentElement.innerHTML='📦'" onclick="event.stopPropagation(); openImageViewer('${p.image_url || p.main_image}')" style="cursor: zoom-in;">` : '📦'}
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
                        ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" onerror="this.parentElement.innerHTML='📦'">` : '📦'}
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
                        ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" onerror="this.parentElement.innerHTML='📦'">` : '📦'}
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
                                         onerror="this.parentElement.innerHTML='<div class=\\'image-placeholder\\'>📦</div>'"
                                         onclick="openImageGallery(${JSON.stringify(images).replace(/"/g, '&quot;')}, 0)"
                                         style="cursor:zoom-in;">
                                ` : '<div class="image-placeholder">📦</div>'}
                            </div>
                            ${images.length > 1 ? `
                                <div class="detail-image-thumbnails">
                                    ${images.map((img, idx) => `
                                        <div class="thumbnail ${idx === 0 ? 'active' : ''}"
                                             onclick="app.switchProductImage('${img}', ${idx})"
                                             data-index="${idx}">
                                            <img src="${img}" alt="图片${idx + 1}"
                                                 onerror="this.parentElement.innerHTML='📦'">
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
                                    <span class="info-label">📦 库存</span>
                                    <span class="info-value ${product.stock < 10 ? 'text-danger' : ''}">${product.stock} 件${product.stock < 10 ? ' (库存紧张)' : ''}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">🔥 销量</span>
                                    <span class="info-value">${product.sales || 0} 件</span>
                                </div>
                                ${product.category_name ? `
                                    <div class="info-item">
                                        <span class="info-label">🏷️ 分类</span>
                                        <span class="info-value">${product.category_name}</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <!-- 商品描述 -->
                            <div class="detail-description">
                                <h3>📝 商品描述</h3>
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
                                        <span>🛒</span> ${product.stock < 1 ? '已售罄' : '加入购物车'}
                                    </button>
                                    <button class="btn btn-outline btn-lg btn-block"
                                            onclick="ReviewService.showReviewModal(${product.id}, '${product.name.replace(/'/g, "\\'")}')">
                                        <span>✍️</span> 写评价
                                    </button>
                                </div>
                            </div>
                            
                            <!-- 服务保障 -->
                            <div class="detail-services">
                                <div class="service-item">
                                    <span class="service-icon">✅</span>
                                    <span class="service-text">正品保证</span>
                                </div>
                                <div class="service-item">
                                    <span class="service-icon">🚚</span>
                                    <span class="service-text">快速配送</span>
                                </div>
                                <div class="service-item">
                                    <span class="service-icon">🔄</span>
                                    <span class="service-text">7天退换</span>
                                </div>
                                <div class="service-item">
                                    <span class="service-icon">💳</span>
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
                                    <h3>📋 详细信息</h3>
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
                    <div class="error-icon">😕</div>
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
                    <div class="empty-icon">🛒</div>
                    <h3>购物车是空的</h3>
                    <p>快去挑选心仪的商品吧</p>
                    <button class="btn btn-primary btn-lg" onclick="window.location.hash = '/';">
                        <span>🛍️</span> 去购物
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
                    <h2>🛒 购物车</h2>
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
                                    <div class="product-mini-img">📦</div>
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
                                    🗑️ 删除
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
                            💳 立即结算
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
                utils.showToast('✅ 已加入购物车', 'success');
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

        content.innerHTML = `
            <div class="checkout-container">
                <h2>📋 确认订单</h2>
                
                <div class="checkout-section">
                    <h3>📍 收货信息</h3>
                    <form id="checkoutForm" class="address-form">
                        <div class="form-group">
                            <label>收货人姓名 <span class="label-required">*</span></label>
                            <input type="text" name="receiverName" required class="form-input" placeholder="请输入收货人姓名">
                        </div>
                        <div class="form-group">
                            <label>联系电话 <span class="label-required">*</span></label>
                            <input type="tel" name="receiverPhone" required class="form-input" placeholder="请输入联系电话" pattern="[0-9]{11}">
                        </div>
                        <div class="form-group">
                            <label>收货地址 <span class="label-required">*</span></label>
                            <textarea name="receiverAddress" required class="form-input" rows="3" placeholder="请输入详细收货地址"></textarea>
                        </div>
                        <div class="form-group">
                            <label>订单备注</label>
                            <textarea name="remark" class="form-input" rows="2" placeholder="选填，可以告诉商家您的特殊需求"></textarea>
                        </div>
                    </form>
                </div>

                <div class="checkout-section">
                    <h3>📦 商品清单</h3>
                    <div class="checkout-items">
                        ${this.cart.map(item => `
                            <div class="checkout-item">
                                <div class="product-mini-img">📦</div>
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
            remark: formData.get('remark') || ''
        };

        utils.showLoading();
        const result = await OrderService.createOrder(orderData);
        utils.showLoading(false);

        if (result) {
            // 显示支付二维码（演示用）
            this.showPaymentQRCode(result.orderId, result.totalAmount);
        }
    }

    showPaymentQRCode(orderId, amount) {
        const modal = document.createElement('div');
        modal.id = 'paymentModal';
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💳 扫码支付</h3>
                </div>
                <div class="modal-body" style="text-align: center; padding: 40px;">
                    <div style="margin-bottom: 20px;">
                        <p style="font-size: 16px; color: var(--text-secondary);">订单金额</p>
                        <p style="font-size: 32px; font-weight: 800; color: var(--danger); margin: 10px 0;">¥${amount}</p>
                    </div>
                    
                    <div style="width: 200px; height: 200px; margin: 20px auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 80px;">
                        📱
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

        // 3秒后自动完成支付
        setTimeout(async () => {
            const success = await OrderService.payOrder(orderId, 1);
            modal.remove();

            if (success) {
                // 清空购物车
                this.cart = [];
                localStorage.removeItem('cart');
                this.updateUI();

                // 显示成功提示并跳转到订单列表
                utils.showToast('支付成功！订单已提交', 'success');
                this.router.navigate('/orders');
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
                <h2>📦 我的订单</h2>
                
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
                        <div class="auth-icon">🔐</div>
                        <h2>欢迎登录</h2>
                        <p>登录精品商城，开启购物之旅</p>
                    </div>
                    
                    <form onsubmit="app.handleLogin(event)" class="auth-form">
                        <div class="form-group">
                            <label>
                                <span class="label-icon">👥</span>
                                <span>用户类型</span>
                            </label>
                            <div class="radio-group-modern">
                                <label class="radio-card">
                                    <input type="radio" name="userType" value="1" checked>
                                    <div class="radio-content">
                                        <span class="radio-icon">👤</span>
                                        <span class="radio-text">普通用户</span>
                                    </div>
                                </label>
                                <label class="radio-card">
                                    <input type="radio" name="userType" value="2">
                                    <div class="radio-content">
                                        <span class="radio-icon">🏪</span>
                                        <span class="radio-text">商家</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <span class="label-icon">📧</span>
                                <span>账号</span>
                            </label>
                            <input type="text" name="account" placeholder="请输入用户名/手机号/邮箱" required class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <span class="label-icon">🔒</span>
                                <span>密码</span>
                            </label>
                            <input type="password" name="password" placeholder="请输入密码" required class="form-input">
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block btn-lg">
                            <span>🚀</span> 立即登录
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
                        <div class="auth-icon">📝</div>
                        <h2>创建账号</h2>
                        <p>加入精品商城，享受优质服务</p>
                    </div>
                    
                    <form onsubmit="app.handleRegister(event)" class="auth-form">
                        <div class="form-group">
                            <label>
                                <span class="label-icon">👥</span>
                                <span>用户类型</span>
                            </label>
                            <div class="radio-group-modern">
                                <label class="radio-card">
                                    <input type="radio" name="userType" value="1" checked>
                                    <div class="radio-content">
                                        <span class="radio-icon">👤</span>
                                        <span class="radio-text">普通用户</span>
                                        <span class="radio-desc">购物、下单、评价</span>
                                    </div>
                                </label>
                                <label class="radio-card">
                                    <input type="radio" name="userType" value="2">
                                    <div class="radio-content">
                                        <span class="radio-icon">🏪</span>
                                        <span class="radio-text">商家</span>
                                        <span class="radio-desc">发布商品、管理订单</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>
                                    <span class="label-icon">👤</span>
                                    <span>用户名</span>
                                </label>
                                <input type="text" name="username" placeholder="请输入用户名" required class="form-input">
                            </div>
                            
                            <div class="form-group">
                                <label>
                                    <span class="label-icon">🔒</span>
                                    <span>密码</span>
                                </label>
                                <input type="password" name="password" placeholder="6位以上" required minlength="6" class="form-input">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>
                                    <span class="label-icon">📱</span>
                                    <span>手机号</span>
                                </label>
                                <input type="tel" name="phone" placeholder="请输入手机号" pattern="[0-9]{11}" class="form-input">
                            </div>
                            
                            <div class="form-group">
                                <label>
                                    <span class="label-icon">📧</span>
                                    <span>邮箱</span>
                                </label>
                                <input type="email" name="email" placeholder="请输入邮箱" class="form-input">
                            </div>
                        </div>
                        
                        <div class="form-tips">
                            <p>📌 注册即表示同意用户协议和隐私政策</p>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block btn-lg">
                            <span>✨</span> 立即注册
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
                        <h3>📋 我的订单</h3>
                        <a href="#/orders" class="view-all">查看全部 →</a>
                    </div>
                    <div class="order-stats-grid">
                        <div class="order-stat-card">
                            <div class="stat-icon">💰</div>
                            <div class="stat-info">
                                <div class="stat-number">0</div>
                                <div class="stat-label">待付款</div>
                            </div>
                        </div>
                        <div class="order-stat-card">
                            <div class="stat-icon">📦</div>
                            <div class="stat-info">
                                <div class="stat-number">0</div>
                                <div class="stat-label">待发货</div>
                            </div>
                        </div>
                        <div class="order-stat-card">
                            <div class="stat-icon">🚚</div>
                            <div class="stat-info">
                                <div class="stat-number">0</div>
                                <div class="stat-label">待收货</div>
                            </div>
                        </div>
                        <div class="order-stat-card">
                            <div class="stat-icon">✅</div>
                            <div class="stat-info">
                                <div class="stat-number">0</div>
                                <div class="stat-label">已完成</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="profile-section">
                    <div class="section-title">
                        <h3>⚙️ 账户设置</h3>
                    </div>
                    <div class="settings-list">
                        <div class="setting-item">
                            <div class="setting-icon">👤</div>
                            <div class="setting-info">
                                <h4>个人信息</h4>
                                <p>修改头像、昵称等基本信息</p>
                            </div>
                            <button class="btn btn-sm">编辑</button>
                        </div>
                        <div class="setting-item">
                            <div class="setting-icon">🔒</div>
                            <div class="setting-info">
                                <h4>安全设置</h4>
                                <p>修改密码、绑定手机号</p>
                            </div>
                            <button class="btn btn-sm">设置</button>
                        </div>
                        <div class="setting-item">
                            <div class="setting-icon">📍</div>
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
                        <div class="empty-icon-small">📦</div>
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
                <div class="section-header">
                    <h3>📦 商品管理</h3>
                    <button class="btn btn-primary" onclick="app.showAddProductModal()">+ 添加商品</button>
                </div>
                <div id="merchant-stats" class="stats-grid">
                    <div class="stat-card">
                        <h4>商品总数</h4>
                        <div class="stat-value" id="totalProducts">0</div>
                    </div>
                    <div class="stat-card">
                        <h4>总销量</h4>
                        <div class="stat-value" id="totalSales">0</div>
                    </div>
                    <div class="stat-card">
                        <h4>总收入</h4>
                        <div class="stat-value" id="totalRevenue">¥0</div>
                    </div>
                </div>
                <div id="merchant-products" class="products-list">
                    <div class="loading-text">加载中...</div>
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

            // 计算统计数据
            const totalProducts = products.length;
            const totalSales = products.reduce((sum, p) => sum + (p.sales || 0), 0);
            const totalRevenue = products.reduce((sum, p) => sum + (p.price * (p.sales || 0)), 0);

            document.getElementById('totalProducts').textContent = totalProducts;
            document.getElementById('totalSales').textContent = totalSales;
            document.getElementById('totalRevenue').textContent = '¥' + totalRevenue.toFixed(2);

            const container = document.getElementById('merchant-products');
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
                            <span class="meta-item">💰 ¥${p.price}</span>
                            <span class="meta-item">📦 库存 ${p.stock}</span>
                            <span class="meta-item">🔥 销量 ${p.sales || 0}</span>
                        </div>
                    </div>
                    <div class="product-item-actions">
                        <button class="btn btn-sm" onclick="app.editProduct(${p.id})">✏️ 编辑</button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteProduct(${p.id})">🗑️ 删除</button>
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
        document.getElementById('modalTitle').textContent = '➕ 添加商品';
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
                `<option value="${c.id}" ${defaultId == c.id ? 'selected' : ''}>${c.icon || '📦'} ${c.name}</option>`
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
            document.getElementById('modalTitle').textContent = '✏️ 编辑商品';
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
        this.loadMerchantData();
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
