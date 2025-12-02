/**
 * 个人中心服务模块 - 完全重构版
 */

const ProfileService = {
    async render() {
        const user = Store.getCurrentUser();
        if (!user) {
            utils.showToast('请先登录', 'error');
            window.location.hash = '/login';
            return;
        }

        const content = document.getElementById('main-content');
        const isMerchant = user.role === 'merchant' || user.userType === 2;

        content.innerHTML = `
            <div class="profile-wrapper">
                ${this.buildProfileHeader(user, isMerchant)}
                ${isMerchant ? this.buildMerchantDashboard() : this.buildUserDashboard()}
            </div>
        `;

        if (isMerchant) {
            await this.loadMerchantData();
        } else {
            await this.loadUserData();
        }
    },

    buildProfileHeader(user, isMerchant) {
        const avatarUrl = user.avatar || this.generateAvatar(user.username);

        return `
            <div class="profile-header-card">
                <div class="profile-header-bg"></div>
                <div class="profile-header-content">
                    <div class="profile-avatar-section">
                        <div class="profile-avatar-wrapper" onclick="ProfileService.showAvatarModal()">
                            <img src="${avatarUrl}" alt="头像" onerror="this.src='${this.generateAvatar(user.username)}'">
                            <div class="profile-avatar-overlay">
                                <svg width="24" height="24" class="icon"><use xlink:href="#icon-camera"></use></svg>
                            </div>
                        </div>
                        <div class="profile-user-info">
                            <h1 class="profile-username">${user.username || '用户'}</h1>
                            <p class="profile-contact">${user.email || user.phone || '未设置联系方式'}</p>
                            <div class="profile-badges">
                                <span class="profile-badge ${isMerchant ? 'badge-merchant' : 'badge-user'}">
                                    <svg width="14" height="14" class="icon"><use xlink:href="#icon-${isMerchant ? 'merchant' : 'user'}"></use></svg>
                                    ${isMerchant ? '商家账号' : '普通用户'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="profile-header-actions">
                        <button class="btn-icon" onclick="ProfileService.showEditModal()" title="编辑资料">
                            <svg width="20" height="20" class="icon"><use xlink:href="#icon-settings"></use></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    buildUserDashboard() {
        return `
            <div class="profile-dashboard">
                <div class="dashboard-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <svg width="20" height="20" class="icon"><use xlink:href="#icon-order"></use></svg>
                            我的订单
                        </h2>
                        <a href="#/orders" class="section-link">查看全部 →</a>
                    </div>
                    <div class="order-stats-grid">
                        <div class="stat-card" onclick="window.location.hash='/orders?status=0'">
                            <div class="stat-icon stat-icon-warning">
                                <svg width="28" height="28" class="icon"><use xlink:href="#icon-money"></use></svg>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value" id="stat-pending">0</div>
                                <div class="stat-label">待付款</div>
                            </div>
                        </div>
                        <div class="stat-card" onclick="window.location.hash='/orders?status=1'">
                            <div class="stat-icon stat-icon-info">
                                <svg width="28" height="28" class="icon"><use xlink:href="#icon-box"></use></svg>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value" id="stat-paid">0</div>
                                <div class="stat-label">待发货</div>
                            </div>
                        </div>
                        <div class="stat-card" onclick="window.location.hash='/orders?status=3'">
                            <div class="stat-icon stat-icon-primary">
                                <svg width="28" height="28" class="icon"><use xlink:href="#icon-truck"></use></svg>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value" id="stat-shipped">0</div>
                                <div class="stat-label">待收货</div>
                            </div>
                        </div>
                        <div class="stat-card" onclick="window.location.hash='/orders?status=4'">
                            <div class="stat-icon stat-icon-success">
                                <svg width="28" height="28" class="icon"><use xlink:href="#icon-check"></use></svg>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value" id="stat-completed">0</div>
                                <div class="stat-label">已完成</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <svg width="20" height="20" class="icon"><use xlink:href="#icon-time"></use></svg>
                            最近浏览
                        </h2>
                        <button class="btn-text" onclick="ProfileService.clearHistory()">清空历史</button>
                    </div>
                    <div id="browse-history-container" class="browse-history-grid">
                        <div class="loading-spinner">加载中...</div>
                    </div>
                </div>

                <div class="dashboard-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <svg width="20" height="20" class="icon"><use xlink:href="#icon-star"></use></svg>
                            我的评价
                        </h2>
                    </div>
                    <div id="reviews-container" class="reviews-list">
                        <div class="loading-spinner">加载中...</div>
                    </div>
                </div>

                <div class="dashboard-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <svg width="20" height="20" class="icon"><use xlink:href="#icon-settings"></use></svg>
                            账户管理
                        </h2>
                    </div>
                    <div class="quick-actions-grid">
                        <div class="action-card" onclick="ProfileService.showEditModal()">
                            <div class="action-icon">
                                <svg width="24" height="24" class="icon"><use xlink:href="#icon-user"></use></svg>
                            </div>
                            <div class="action-content">
                                <h3 class="action-title">个人信息</h3>
                                <p class="action-desc">修改昵称、联系方式</p>
                            </div>
                            <svg width="20" height="20" class="icon action-arrow"><use xlink:href="#icon-arrow-right"></use></svg>
                        </div>
                        <div class="action-card" onclick="ProfileService.showPasswordModal()">
                            <div class="action-icon">
                                <svg width="24" height="24" class="icon"><use xlink:href="#icon-lock"></use></svg>
                            </div>
                            <div class="action-content">
                                <h3 class="action-title">安全设置</h3>
                                <p class="action-desc">修改密码、安全验证</p>
                            </div>
                            <svg width="20" height="20" class="icon action-arrow"><use xlink:href="#icon-arrow-right"></use></svg>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    buildMerchantDashboard() {
        return `
            <div class="profile-dashboard">
                <div class="dashboard-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <svg width="20" height="20" class="icon"><use xlink:href="#icon-order"></use></svg>
                            店铺数据
                        </h2>
                    </div>
                    <div class="order-stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon stat-icon-primary">
                                <svg width="28" height="28" class="icon"><use xlink:href="#icon-box"></use></svg>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value" id="merchant-products">0</div>
                                <div class="stat-label">商品总数</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon stat-icon-warning">
                                <svg width="28" height="28" class="icon"><use xlink:href="#icon-fire"></use></svg>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value" id="merchant-sales">0</div>
                                <div class="stat-label">总销量</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon stat-icon-success">
                                <svg width="28" height="28" class="icon"><use xlink:href="#icon-money"></use></svg>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value" id="merchant-revenue">¥0</div>
                                <div class="stat-label">总收入</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon stat-icon-info">
                                <svg width="28" height="28" class="icon"><use xlink:href="#icon-star"></use></svg>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value" id="merchant-rating">5.0</div>
                                <div class="stat-label">店铺评分</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <svg width="20" height="20" class="icon"><use xlink:href="#icon-settings"></use></svg>
                            管理中心
                        </h2>
                    </div>
                    <div class="quick-actions-grid">
                        <div class="action-card" onclick="window.location.hash='/merchant'">
                            <div class="action-icon">
                                <svg width="24" height="24" class="icon"><use xlink:href="#icon-box"></use></svg>
                            </div>
                            <div class="action-content">
                                <h3 class="action-title">商品管理</h3>
                                <p class="action-desc">管理店铺商品</p>
                            </div>
                            <svg width="20" height="20" class="icon action-arrow"><use xlink:href="#icon-arrow-right"></use></svg>
                        </div>
                        <div class="action-card" onclick="window.location.hash='/merchant?tab=orders'">
                            <div class="action-icon">
                                <svg width="24" height="24" class="icon"><use xlink:href="#icon-order"></use></svg>
                            </div>
                            <div class="action-content">
                                <h3 class="action-title">订单管理</h3>
                                <p class="action-desc">处理客户订单</p>
                            </div>
                            <svg width="20" height="20" class="icon action-arrow"><use xlink:href="#icon-arrow-right"></use></svg>
                        </div>
                        <div class="action-card" onclick="ProfileService.showBrowseLogs()">
                            <div class="action-icon">
                                <svg width="24" height="24" class="icon"><use xlink:href="#icon-time"></use></svg>
                            </div>
                            <div class="action-content">
                                <h3 class="action-title">浏览日志</h3>
                                <p class="action-desc">查看客户浏览记录</p>
                            </div>
                            <svg width="20" height="20" class="icon action-arrow"><use xlink:href="#icon-arrow-right"></use></svg>
                        </div>
                        <div class="action-card" onclick="ProfileService.showPurchaseLogs()">
                            <div class="action-icon">
                                <svg width="24" height="24" class="icon"><use xlink:href="#icon-shopping-bag"></use></svg>
                            </div>
                            <div class="action-content">
                                <h3 class="action-title">购买日志</h3>
                                <p class="action-desc">查看客户购买记录</p>
                            </div>
                            <svg width="20" height="20" class="icon action-arrow"><use xlink:href="#icon-arrow-right"></use></svg>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadUserData() {
        await Promise.all([
            this.loadOrderStats(),
            this.loadBrowseHistory(),
            this.loadUserReviews()
        ]);
    },

    async loadOrderStats() {
        try {
            const orders = await OrderService.getOrders();
            const stats = {
                pending: orders.filter(o => o.status === 0).length,
                paid: orders.filter(o => o.status === 1 || o.status === 2).length,
                shipped: orders.filter(o => o.status === 3).length,
                completed: orders.filter(o => o.status === 4).length
            };
            this.updateElement('stat-pending', stats.pending);
            this.updateElement('stat-paid', stats.paid);
            this.updateElement('stat-shipped', stats.shipped);
            this.updateElement('stat-completed', stats.completed);
        } catch (error) {
            console.error('加载订单统计失败:', error);
        }
    },

    async loadBrowseHistory() {
        const container = document.getElementById('browse-history-container');
        if (!container) return;

        try {
            const history = Store.getBrowsingHistory().slice(0, 8);

            if (history.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <svg width="64" height="64" class="icon empty-icon"><use xlink:href="#icon-time"></use></svg>
                        <p class="empty-text">还没有浏览记录</p>
                        <button class="btn btn-primary btn-sm" onclick="window.location.hash='/'">去逛逛</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = history.map(item => `
                <div class="history-card" onclick="window.location.hash='/product/${item.id}'">
                    <div class="history-image">
                        ${item.image ?
                    `<img src="${item.image}" alt="${item.name}">` :
                    `<svg width="48" height="48" class="icon"><use xlink:href="#icon-box"></use></svg>`
                }
                    </div>
                    <div class="history-info">
                        <h4 class="history-name">${item.name}</h4>
                        <p class="history-price">¥${item.price}</p>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            container.innerHTML = '<div class="error-state">加载失败</div>';
        }
    },

    async loadUserReviews() {
        const container = document.getElementById('reviews-container');
        if (!container) return;

        try {
            const reviews = await utils.request('/user/reviews');

            if (!reviews || reviews.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <svg width="64" height="64" class="icon empty-icon"><use xlink:href="#icon-star"></use></svg>
                        <p class="empty-text">还没有评价记录</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = reviews.slice(0, 5).map(review => `
                <div class="review-card">
                    <div class="review-product">
                        ${review.product_image ?
                    `<img src="${review.product_image}" alt="${review.product_name}">` :
                    `<div class="review-product-placeholder"><svg width="32" height="32" class="icon"><use xlink:href="#icon-box"></use></svg></div>`
                }
                        <div class="review-product-info">
                            <h4>${review.product_name || '商品'}</h4>
                            <div class="review-rating">${this.buildStars(review.rating)}</div>
                        </div>
                    </div>
                    <div class="review-content">
                        <p>${review.content || '用户未填写评价内容'}</p>
                        <span class="review-time">${new Date(review.create_time).toLocaleDateString()}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            container.innerHTML = '<div class="error-state">加载失败</div>';
        }
    },

    async loadMerchantData() {
        try {
            const products = await utils.request('/merchant/products');
            const totalProducts = products.length;
            const totalSales = products.reduce((sum, p) => sum + (p.sales || 0), 0);
            const totalRevenue = products.reduce((sum, p) => sum + (p.price * (p.sales || 0)), 0);
            this.updateElement('merchant-products', totalProducts);
            this.updateElement('merchant-sales', totalSales);
            this.updateElement('merchant-revenue', '¥' + totalRevenue.toFixed(2));
        } catch (error) {
            console.error('加载商家数据失败:', error);
        }
    },

    showAvatarModal() {
        const avatars = [
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasmine',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
            'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
            'https://api.dicebear.com/7.x/bottts/svg?seed=Aneka'
        ];

        const modal = this.createModal('选择头像', `
            <div class="avatar-grid">
                ${avatars.map(url => `
                    <div class="avatar-option" onclick="ProfileService.selectAvatar('${url}')">
                        <img src="${url}" alt="头像">
                    </div>
                `).join('')}
            </div>
            <div class="form-group" style="margin-top: 20px;">
                <label>或输入自定义头像URL</label>
                <input type="url" id="custom-avatar-url" class="form-input" placeholder="https://example.com/avatar.jpg">
                <button class="btn btn-primary btn-sm" onclick="ProfileService.selectAvatar(document.getElementById('custom-avatar-url').value)" style="margin-top: 8px;">使用自定义头像</button>
            </div>
        `);
        document.body.appendChild(modal);
    },

    async selectAvatar(url) {
        if (!url || !url.trim()) {
            utils.showToast('请输入有效的头像URL', 'error');
            return;
        }
        const user = Store.getCurrentUser();
        user.avatar = url;
        Store.setCurrentUser(user);
        utils.showToast('头像更新成功', 'success');
        document.querySelector('.modal')?.remove();
        this.render();
    },

    showEditModal() {
        const user = Store.getCurrentUser();
        const modal = this.createModal('编辑个人信息', `
            <form id="edit-profile-form" onsubmit="ProfileService.handleEditProfile(event)">
                <div class="form-group">
                    <label>用户名 <span class="required">*</span></label>
                    <input type="text" name="username" value="${user.username || ''}" required class="form-input">
                </div>
                <div class="form-group">
                    <label>手机号</label>
                    <input type="tel" name="phone" value="${user.phone || ''}" pattern="[0-9]{11}" class="form-input">
                </div>
                <div class="form-group">
                    <label>邮箱</label>
                    <input type="email" name="email" value="${user.email || ''}" class="form-input">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                    <button type="submit" class="btn btn-primary">保存</button>
                </div>
            </form>
        `);
        document.body.appendChild(modal);
    },

    async handleEditProfile(event) {
        event.preventDefault();
        const form = event.target;
        const data = {
            username: form.username.value.trim(),
            phone: form.phone.value.trim(),
            email: form.email.value.trim()
        };
        try {
            await utils.request('/user/update', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            const user = Store.getCurrentUser();
            Object.assign(user, data);
            Store.setCurrentUser(user);
            utils.showToast('个人信息更新成功', 'success');
            form.closest('.modal').remove();
            this.render();
        } catch (error) {
            utils.showToast('更新失败', 'error');
        }
    },

    showPasswordModal() {
        const modal = this.createModal('修改密码', `
            <form id="change-password-form" onsubmit="ProfileService.handleChangePassword(event)">
                <div class="form-group">
                    <label>原密码 <span class="required">*</span></label>
                    <input type="password" name="oldPassword" required class="form-input">
                </div>
                <div class="form-group">
                    <label>新密码 <span class="required">*</span></label>
                    <input type="password" name="newPassword" required minlength="6" class="form-input">
                </div>
                <div class="form-group">
                    <label>确认新密码 <span class="required">*</span></label>
                    <input type="password" name="confirmPassword" required class="form-input">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                    <button type="submit" class="btn btn-primary">确认修改</button>
                </div>
            </form>
        `);
        document.body.appendChild(modal);
    },

    async handleChangePassword(event) {
        event.preventDefault();
        const form = event.target;
        if (form.newPassword.value !== form.confirmPassword.value) {
            utils.showToast('两次输入的新密码不一致', 'error');
            return;
        }
        try {
            await utils.request('/user/change-password', {
                method: 'POST',
                body: JSON.stringify({
                    oldPassword: form.oldPassword.value,
                    newPassword: form.newPassword.value
                })
            });
            utils.showToast('密码修改成功，请重新登录', 'success');
            form.closest('.modal').remove();
            setTimeout(() => {
                Store.clearAuth();
                window.location.hash = '/login';
            }, 1500);
        } catch (error) { }
    },

    clearHistory() {
        if (confirm('确定要清空所有浏览历史吗？')) {
            Store.clearBrowsingHistory();
            this.loadBrowseHistory();
            utils.showToast('浏览历史已清空', 'success');
        }
    },

    async showBrowseLogs() {
        const modal = this.createModal('客户浏览日志', '<div id="browse-logs-content" class="logs-container"><div class="loading-spinner">加载中...</div></div>', 'modal-large');
        document.body.appendChild(modal);
        try {
            const logs = await utils.request('/merchant/logs/browse?limit=50');
            const container = document.getElementById('browse-logs-content');
            if (!logs || logs.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>暂无浏览日志</p></div>';
                return;
            }
            container.innerHTML = `
                <table class="data-table">
                    <thead><tr><th>商品名称</th><th>价格</th><th>浏览时间</th><th>IP地址</th></tr></thead>
                    <tbody>
                        ${logs.map(log => `
                            <tr>
                                <td>${log.productName || '未知商品'}</td>
                                <td>¥${log.productPrice || 0}</td>
                                <td>${new Date(log.browseTime).toLocaleString('zh-CN')}</td>
                                <td class="text-muted">${log.ipAddress || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            document.getElementById('browse-logs-content').innerHTML = '<div class="error-state">加载失败</div>';
        }
    },

    async showPurchaseLogs() {
        const modal = this.createModal('客户购买日志', '<div id="purchase-logs-content" class="logs-container"><div class="loading-spinner">加载中...</div></div>', 'modal-large');
        document.body.appendChild(modal);
        try {
            const logs = await utils.request('/merchant/logs/purchase?limit=50');
            const container = document.getElementById('purchase-logs-content');
            if (!logs || logs.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>暂无购买日志</p></div>';
                return;
            }
            container.innerHTML = `
                <table class="data-table">
                    <thead><tr><th>订单ID</th><th>商品数量</th><th>订单金额</th><th>购买时间</th><th>IP地址</th></tr></thead>
                    <tbody>
                        ${logs.map(log => `
                            <tr>
                                <td>#${log.orderId}</td>
                                <td>${log.itemCount || 0} 件</td>
                                <td class="text-danger">¥${log.totalAmount || 0}</td>
                                <td>${new Date(log.purchaseTime).toLocaleString('zh-CN')}</td>
                                <td class="text-muted">${log.ipAddress || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            document.getElementById('purchase-logs-content').innerHTML = '<div class="error-state">加载失败</div>';
        }
    },

    createModal(title, content, size = '') {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content ${size}">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">${content}</div>
            </div>
        `;
        return modal;
    },

    buildStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<svg width="16" height="16" class="icon star ${i <= rating ? 'star-filled' : ''}"><use xlink:href="#icon-star"></use></svg>`;
        }
        return stars;
    },

    generateAvatar(username) {
        const initial = (username || 'U').charAt(0).toUpperCase();
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
        const colorIndex = initial.charCodeAt(0) % colors.length;
        const bgColor = colors[colorIndex];
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
                <rect width="128" height="128" fill="${bgColor}"/>
                <text x="50%" y="50%" font-size="64" fill="white" text-anchor="middle" dy=".35em" font-family="Arial" font-weight="bold">${initial}</text>
            </svg>
        `)}`;
    },

    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
};

/**
 * 浏览历史服务
 */
const BrowseHistoryService = {
    async render() {
        const content = document.getElementById('main-content');
        content.innerHTML = '<div class="loading-text">加载浏览历史...</div>';

        try {
            const history = await Store.getBrowseHistoryFromServer(100);
            const stats = await Store.getBrowseStats();
            content.innerHTML = this.buildHistoryHTML(history, stats);
        } catch (error) {
            content.innerHTML = '<div class="error-state">加载失败</div>';
        }
    },

    buildHistoryHTML(history, stats) {
        return `
            <div class="profile-container">
                <div class="profile-header">
                    <h1><svg width="24" height="24" class="icon"><use xlink:href="#icon-clock"></use></svg> 浏览历史</h1>
                    ${history.length > 0 ? `<button class="btn btn-outline" onclick="BrowseHistoryService.clearHistory()"><svg width="18" height="18" class="icon"><use xlink:href="#icon-trash"></use></svg> 清空历史</button>` : ''}
                </div>
                ${stats ? `
                    <div class="order-stats-grid" style="margin-bottom: 24px;">
                        <div class="stat-card">
                            <div class="stat-icon stat-icon-primary"><svg width="28" height="28" class="icon"><use xlink:href="#icon-eye"></use></svg></div>
                            <div class="stat-content">
                                <div class="stat-value">${stats.totalBrowse || 0}</div>
                                <div class="stat-label">总浏览次数</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon stat-icon-success"><svg width="28" height="28" class="icon"><use xlink:href="#icon-calendar"></use></svg></div>
                            <div class="stat-content">
                                <div class="stat-value">${stats.recentBrowse || 0}</div>
                                <div class="stat-label">最近7天</div>
                            </div>
                        </div>
                    </div>
                ` : ''}
                ${history.length === 0 ? `
                    <div class="empty-state">
                        <svg width="120" height="120" class="icon"><use xlink:href="#icon-clock"></use></svg>
                        <h3>暂无浏览历史</h3>
                        <p>您还没有浏览过任何商品</p>
                        <button class="btn btn-primary" onclick="window.location.hash='/'">去逛逛</button>
                    </div>
                ` : `
                    <div class="browse-history-grid">
                        ${history.map(item => `
                            <div class="history-card" onclick="window.location.hash='/product/${item.productId}'">
                                <div class="history-info">
                                    <h4>${item.productName}</h4>
                                    <p class="history-price">¥${item.productPrice}</p>
                                    <p class="history-time">${this.formatTime(item.browseTime)}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    },

    formatTime(timeStr) {
        if (!timeStr) return '';
        const date = new Date(timeStr);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours === 0) {
                const minutes = Math.floor(diff / (1000 * 60));
                return minutes === 0 ? '刚刚' : `${minutes}分钟前`;
            }
            return `${hours}小时前`;
        }
        if (days === 1) return '昨天';
        if (days < 7) return `${days}天前`;
        return date.toLocaleDateString('zh-CN');
    },

    async clearHistory() {
        if (!confirm('确定要清空所有浏览历史吗？')) return;
        try {
            const success = await Store.clearBrowseHistoryFromServer();
            if (success) {
                Store.clearBrowsingHistory();
                utils.showToast('浏览历史已清空', 'success');
                this.render();
            } else {
                utils.showToast('清空失败', 'error');
            }
        } catch (error) {
            utils.showToast('清空失败', 'error');
        }
    }
};

/**
 * 购买历史服务
 */
const PurchaseHistoryService = {
    async render() {
        const content = document.getElementById('main-content');
        content.innerHTML = '<div class="loading-text">加载购买历史...</div>';

        try {
            const history = await Store.getPurchaseHistory(100);
            const stats = await Store.getPurchaseStats();
            content.innerHTML = this.buildHistoryHTML(history, stats);
        } catch (error) {
            content.innerHTML = '<div class="error-state">加载失败</div>';
        }
    },

    buildHistoryHTML(history, stats) {
        return `
            <div class="profile-container">
                <div class="profile-header">
                    <h1><svg width="24" height="24" class="icon"><use xlink:href="#icon-shopping-bag"></use></svg> 购买历史</h1>
                </div>
                ${stats ? `
                    <div class="order-stats-grid" style="margin-bottom: 24px;">
                        <div class="stat-card">
                            <div class="stat-icon stat-icon-primary"><svg width="28" height="28" class="icon"><use xlink:href="#icon-order"></use></svg></div>
                            <div class="stat-content">
                                <div class="stat-value">${stats.totalOrders || 0}</div>
                                <div class="stat-label">总订单数</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon stat-icon-danger"><svg width="28" height="28" class="icon"><use xlink:href="#icon-credit-card"></use></svg></div>
                            <div class="stat-content">
                                <div class="stat-value">¥${stats.totalAmount || 0}</div>
                                <div class="stat-label">总消费金额</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon stat-icon-success"><svg width="28" height="28" class="icon"><use xlink:href="#icon-calendar"></use></svg></div>
                            <div class="stat-content">
                                <div class="stat-value">${stats.recentOrders || 0}单</div>
                                <div class="stat-label">最近30天</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon stat-icon-warning"><svg width="28" height="28" class="icon"><use xlink:href="#icon-wallet"></use></svg></div>
                            <div class="stat-content">
                                <div class="stat-value">¥${stats.recentAmount || 0}</div>
                                <div class="stat-label">近30天消费</div>
                            </div>
                        </div>
                    </div>
                ` : ''}
                ${history.length === 0 ? `
                    <div class="empty-state">
                        <svg width="120" height="120" class="icon"><use xlink:href="#icon-shopping-bag"></use></svg>
                        <h3>暂无购买记录</h3>
                        <p>您还没有购买过任何商品</p>
                        <button class="btn btn-primary" onclick="window.location.hash='/'">去购物</button>
                    </div>
                ` : `
                    <div class="purchase-history-list">
                        ${history.map(item => `
                            <div class="purchase-item" style="padding: 20px; background: var(--bg-secondary); border-radius: 12px; margin-bottom: 16px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                    <span style="color: var(--text-secondary);">${this.formatTime(item.purchaseTime)}</span>
                                    <span style="font-size: 18px; font-weight: 600; color: var(--danger);">¥${item.totalAmount}</span>
                                </div>
                                ${item.items && item.items.length > 0 ? item.items.map(product => `
                                    <div onclick="window.location.hash='/product/${product.productId}'" style="padding: 12px; background: var(--bg-primary); border-radius: 8px; margin-bottom: 8px; cursor: pointer;">
                                        <div style="display: flex; justify-content: space-between;">
                                            <div>
                                                <div style="font-weight: 500;">${product.productName}</div>
                                                <div style="font-size: 14px; color: var(--text-secondary);">¥${product.productPrice} ×${product.quantity}</div>
                                            </div>
                                            <div style="font-weight: 600; color: var(--danger);">¥${product.subtotal}</div>
                                        </div>
                                    </div>
                                `).join('') : '<div style="text-align: center; color: var(--text-secondary);">暂无商品信息</div>'}
                                <div style="text-align: right; margin-top: 12px;">
                                    <button class="btn btn-sm btn-outline" onclick="window.location.hash='/orders'">查看订单详情</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    },

    formatTime(timeStr) {
        if (!timeStr) return '';
        const date = new Date(timeStr);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

// 向后兼容：将服务挂载到全局
if (typeof window !== 'undefined') {
    window.BrowseHistoryService = BrowseHistoryService;
    window.PurchaseHistoryService = PurchaseHistoryService;
}