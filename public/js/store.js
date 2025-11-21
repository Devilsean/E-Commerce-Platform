// 全局状态管理

const Store = {
    // 状态
    state: {
        currentUser: null,
        cart: [],
        currentPage: 'home',
        currentOrderFilter: 'all'
    },

    // 初始化
    init() {
        // 从本地存储恢复状态
        this.state.currentUser = getLocalStorage('user');
        this.state.cart = getLocalStorage('cart', []);

        // 检查token
        const token = localStorage.getItem('token');
        if (token && this.state.currentUser) {
            this.updateUserUI();
        }

        this.updateCartBadge();
    },

    // 设置当前用户
    setCurrentUser(user) {
        this.state.currentUser = user;
        if (user) {
            setLocalStorage('user', user);
        } else {
            removeLocalStorage('user');
        }
        this.updateUserUI();
    },

    // 获取当前用户
    getCurrentUser() {
        return this.state.currentUser;
    },

    // 添加到购物车
    addToCart(product) {
        const existingItem = this.state.cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
        } else {
            this.state.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: product.quantity || 1
            });
        }
        this.saveCart();
    },

    // 从购物车移除
    removeFromCart(productId) {
        this.state.cart = this.state.cart.filter(item => item.id !== productId);
        this.saveCart();
    },

    // 清空购物车
    clearCart() {
        this.state.cart = [];
        this.saveCart();
    },

    // 获取购物车
    getCart() {
        return this.state.cart;
    },

    // 保存购物车
    saveCart() {
        setLocalStorage('cart', this.state.cart);
        this.updateCartBadge();
    },

    // 更新购物车徽章
    updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        if (!badge) return;

        const totalItems = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
        if (totalItems > 0) {
            badge.textContent = totalItems;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    },

    // 更新用户UI
    updateUserUI() {
        const profileLink = document.getElementById('profileLink');
        const loginLink = document.getElementById('loginLink');
        const logoutLink = document.getElementById('logoutLink');

        if (this.state.currentUser) {
            const isMerchant = this.state.currentUser.role === 'merchant' || this.state.currentUser.userType === 2;

            // 已登录：显示个人中心和退出，隐藏登录
            if (profileLink) {
                profileLink.style.display = '';
                profileLink.innerHTML = isMerchant ? '🏪 店铺中心' : '👤 个人中心';
            }
            if (logoutLink) {
                logoutLink.style.display = '';
                const username = this.state.currentUser.username || this.state.currentUser.nickname || '用户';
                logoutLink.innerHTML = `🚪 退出 (${username})`;
            }
            if (loginLink) loginLink.style.display = 'none';
        } else {
            // 未登录：显示登录，隐藏个人中心和退出
            if (profileLink) profileLink.style.display = 'none';
            if (logoutLink) logoutLink.style.display = 'none';
            if (loginLink) loginLink.style.display = '';
        }
    },

    // 创建用户菜单
    createUserMenu() {
        const menu = document.createElement('div');
        menu.id = 'userMenu';
        menu.className = 'user-menu';

        const isMerchant = this.state.currentUser.role === 'merchant' || this.state.currentUser.userType === 2;

        menu.innerHTML = `
            <div class="user-menu-item" onclick="event.stopPropagation(); Router.navigate('profile'); Store.toggleUserMenu();">
                ${isMerchant ? '🏪 店铺中心' : '👤 个人中心'}
            </div>
            <div class="user-menu-item" onclick="event.stopPropagation(); Auth.logout(); Store.toggleUserMenu();">
                🚪 退出登录
            </div>
        `;
        document.body.appendChild(menu);
    },

    // 更新用户菜单
    updateUserMenu() {
        const menu = document.getElementById('userMenu');
        if (!menu) return;

        const isMerchant = this.state.currentUser.role === 'merchant' || this.state.currentUser.userType === 2;

        menu.innerHTML = `
            <div class="user-menu-item" onclick="event.stopPropagation(); Router.navigate('profile'); Store.toggleUserMenu();">
                ${isMerchant ? '🏪 店铺中心' : '👤 个人中心'}
            </div>
            <div class="user-menu-item" onclick="event.stopPropagation(); Auth.logout(); Store.toggleUserMenu();">
                🚪 退出登录
            </div>
        `;
    },

    // 切换用户菜单
    toggleUserMenu() {
        const menu = document.getElementById('userMenu');
        if (menu) {
            const isActive = menu.classList.contains('active');
            menu.classList.toggle('active');

            // 定位菜单到用户链接下方
            if (!isActive) {
                const userLink = document.getElementById('userLink');
                if (userLink) {
                    const rect = userLink.getBoundingClientRect();
                    menu.style.top = `${rect.bottom + 5}px`;
                    menu.style.right = `${window.innerWidth - rect.right}px`;
                }
            }
        }
    },

    // 设置当前页面
    setCurrentPage(page) {
        this.state.currentPage = page;
    },

    // 获取当前页面
    getCurrentPage() {
        return this.state.currentPage;
    },

    // 设置订单筛选
    setOrderFilter(filter) {
        this.state.currentOrderFilter = filter;
    },

    // 获取订单筛选
    getOrderFilter() {
        return this.state.currentOrderFilter;
    }
};

// 点击页面其他地方关闭用户菜单
document.addEventListener('click', function (e) {
    const menu = document.getElementById('userMenu');
    const userLink = document.getElementById('userLink');

    if (menu && menu.classList.contains('active')) {
        if (!menu.contains(e.target) && e.target !== userLink) {
            menu.classList.remove('active');
        }
    }
});