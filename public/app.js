// ==================== 配置 ====================
const API_BASE = '/api';

// ==================== 工具函数 ====================
const utils = {
    // 显示Toast提示
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast toast-${type} show`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    },

    // 显示/隐藏Loading
    showLoading(show = true) {
        document.getElementById('loading').style.display = show ? 'flex' : 'none';
    },

    // 获取Token
    getToken() {
        return localStorage.getItem('token');
    },

    // 设置Token
    setToken(token) {
        localStorage.setItem('token', token);
    },

    // 移除Token
    removeToken() {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
    },

    // 获取用户信息
    getUserInfo() {
        const info = localStorage.getItem('userInfo');
        return info ? JSON.parse(info) : null;
    },

    // 设置用户信息
    setUserInfo(info) {
        localStorage.setItem('userInfo', JSON.stringify(info));
    },

    // API请求
    async request(url, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        };

        try {
            const response = await fetch(API_BASE + url, {
                ...options,
                headers
            });

            // 检查响应是否为空
            const text = await response.text();
            if (!text) {
                throw new Error('服务器返回空响应');
            }

            const data = JSON.parse(text);

            if (data.code === 200) {
                return data.data;
            } else {
                throw new Error(data.message || '请求失败');
            }
        } catch (error) {
            console.error('API Error:', error);
            this.showToast(error.message || '请求失败', 'error');
            throw error;
        }
    }
};

// ==================== 路由系统 ====================
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;

        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    register(path, handler) {
        this.routes[path] = handler;
    }

    navigate(path) {
        window.location.hash = path;
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        const [path, ...params] = hash.split('/').filter(Boolean);
        const route = '/' + (path || '');

        this.currentRoute = route;

        // 更新导航高亮
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + route);
        });

        const handler = this.routes[route] || this.routes['/404'];
        if (handler) {
            handler(params);
        }
    }
}

// ==================== 应用主类 ====================
class App {
    constructor() {
        this.router = new Router();
        this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
        this.initRoutes();
        this.initNavSearch();
        this.updateUI();
    }

    initRoutes() {
        this.router.register('/', () => this.renderHome());
        this.router.register('/product', (params) => this.renderProductDetail(params[0]));
        this.router.register('/cart', () => this.renderCart());
        this.router.register('/login', () => this.renderLogin());
        this.router.register('/register', () => this.renderRegister());
        this.router.register('/profile', () => this.renderProfile());
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

    renderHome(searchKeyword = '') {
        const content = document.getElementById('main-content');
        const isSearching = !!searchKeyword;

        content.innerHTML = `
            ${!isSearching ? `
            <div class="hero">
                <h1>🎉 欢迎来到精品商城</h1>
                <p>发现优质好物，享受购物乐趣</p>
            </div>
            ` : `
            <div class="search-result-header">
                <h2>🔍 搜索结果: "${searchKeyword}"</h2>
                <button class="btn btn-sm" onclick="app.renderHome()">清除搜索</button>
            </div>
            `}
            <div class="section">
                <h2>${isSearching ? '📦 相关商品' : '🔥 全部商品'}</h2>
                <div id="products-container" class="products-grid">
                    <div class="loading-text">加载中...</div>
                </div>
            </div>
        `;

        if (isSearching) {
            this.loadSearchResults(searchKeyword, 'products-container');
        } else {
            this.loadProducts('products-container');
        }
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

            content.innerHTML = `
                <div class="product-detail">
                    <button class="btn" onclick="history.back()">← 返回</button>
                    <div class="detail-container">
                        <div class="detail-image">
                            ${product.main_image ? `<img src="${product.main_image}" alt="${product.name}" onerror="this.parentElement.innerHTML='📦'" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">` : '📦'}
                        </div>
                        <div class="detail-info">
                            <h1>${product.name}</h1>
                            <p class="price-large">¥${product.price}</p>
                            <p class="detail-desc">${product.description || '优质商品，品质保证'}</p>
                            <div class="detail-meta">
                                <span>库存: ${product.stock}</span>
                                <span>已售: ${product.sales || 0}</span>
                            </div>
                            <div class="detail-actions">
                                <input type="number" id="quantity" value="1" min="1" max="${product.stock}" class="quantity-input">
                                <button class="btn btn-primary btn-lg" onclick="app.addToCart(${product.id}, document.getElementById('quantity').value)">
                                    加入购物车
                                </button>
                                <button class="btn btn-success btn-lg" onclick="ReviewService.showReviewModal(${product.id}, '${product.name.replace(/'/g, "\\'")}')">
                                    ✍️ 写评价
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 评论区域 -->
                    <div id="productReviews" class="product-reviews-container"></div>
                </div>
            `;

            // 加载评论
            if (typeof ReviewService !== 'undefined') {
                ReviewService.renderReviewSection('productReviews', product.id);
            }
        } catch (error) {
            content.innerHTML = '<div class="error">商品不存在</div>';
        }
    }

    renderCart() {
        const content = document.getElementById('main-content');

        if (this.cart.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🛒</div>
                    <h3>购物车是空的</h3>
                    <p>快去挑选心仪的商品吧</p>
                    <button class="btn btn-primary btn-lg" onclick="app.router.navigate('/products')">
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

        utils.showToast('订单已提交（演示功能）', 'success');
        this.cart = [];
        localStorage.removeItem('cart');
        this.updateUI();
        this.router.navigate('/profile');
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
        const user = utils.getUserInfo();
        if (!user) {
            this.router.navigate('/login');
            return;
        }

        const content = document.getElementById('main-content');
        const isMerchant = user.userType === 2;

        content.innerHTML = `
            <div class="profile-container">
                <div class="profile-header">
                    <div class="profile-banner">
                        <div class="profile-avatar-large">
                            ${isMerchant ? '🏪' : '👤'}
                        </div>
                        <div class="profile-header-info">
                            <h2>${user.username}</h2>
                            <p class="profile-subtitle">${user.email || user.phone || '未设置联系方式'}</p>
                            <span class="badge badge-${isMerchant ? 'merchant' : 'user'}">
                                ${isMerchant ? '🏪 商家账号' : '👤 普通用户'}
                            </span>
                        </div>
                    </div>
                </div>

                ${isMerchant ? this.renderMerchantSection() : this.renderUserSection()}
            </div>
        `;

        if (isMerchant) {
            this.loadMerchantData();
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
                        <button class="btn btn-primary" onclick="app.router.navigate('/products')">
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

    showAddProductModal() {
        const form = document.getElementById('productForm');
        if (form) form.reset();
        document.getElementById('productId').value = '';
        document.getElementById('modalTitle').textContent = '➕ 添加商品';
        const preview = document.getElementById('mainImagePreview');
        if (preview) preview.innerHTML = '<div class="image-preview-placeholder">暂无图片</div>';
        document.getElementById('productModal').style.display = 'flex';
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

        const data = {
            name: name,
            price: price,
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
