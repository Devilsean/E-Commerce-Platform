// 个人中心服务模块 - 增强版

// 订单状态常量
const ORDER_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    SHIPPED: 'shipped',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

const ORDER_STATUS_TEXT = {
    all: '全部',
    pending: '待付款',
    paid: '待发货',
    shipped: '待收货',
    completed: '已完成',
    cancelled: '已取消'
};

const ORDER_STATUS_BADGE = {
    pending: 'badge-warning',
    paid: 'badge-info',
    shipped: 'badge-primary',
    completed: 'badge-success',
    cancelled: 'badge-secondary'
};

const ProfileService = {
    // 加载个人中心
    async loadProfile() {
        const currentUser = Store.getCurrentUser();

        if (!currentUser) {
            showMessage('请先登录', 'error');
            if (window.app && window.app.router) {
                window.app.router.navigate('/login');
            }
            return;
        }

        const isMerchant = currentUser.role === 'merchant' || currentUser.userType === 2;

        // 渲染个人中心页面
        const content = document.getElementById('main-content');
        const avatarUrl = currentUser.avatar || this.getDefaultAvatar(currentUser.username);

        content.innerHTML = `
    <div class="profile-container">
        <div class="profile-header">
            <div class="profile-banner" style="background-color: #fafafa; padding: 20px 16px; border-radius: 8px;">
                <div class="profile-avatar-large" onclick="ProfileService.showAvatarSelector()" style="cursor: pointer; position: relative;" title="点击更换头像">
                    <img src="${avatarUrl}" alt="头像" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onerror="this.src='${this.getDefaultAvatar(currentUser.username)}'">
                    <div style="position: absolute; bottom: 0; right: 0; background: var(--primary); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 2px solid white;">
                        <svg width="14" height="14" class="icon" aria-hidden="true"><use xlink:href="#icon-camera"></use></svg>
                    </div>
                </div>
                <div class="profile-header-info">
                    <h2>${currentUser.username || '用户'}</h2>
                    <p class="profile-subtitle">${currentUser.email || currentUser.phone || '未设置联系方式'}</p>
                    <span class="badge badge-${isMerchant ? 'merchant' : 'user'}">
                        <svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-${isMerchant ? 'merchant' : 'user'}"></use></svg> ${isMerchant ? '商家账号' : '普通用户'}
                    </span>
                </div>
            </div>
        </div>

        ${isMerchant ? this.renderMerchantContent() : this.renderUserContent()}
    </div>
`;

        // 加载对应数据
        if (isMerchant) {
            this.loadMerchantStats();
        } else {
            this.loadUserStats();
        }
    },

    // 渲染普通用户内容
    renderUserContent() {
        return `
            <div class="profile-content">
                <!-- 订单统计 -->
                <div class="profile-section">
                    <div class="section-title">
                        <h3><svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-order"></use></svg> 我的订单</h3>
                        <a href="#/orders" class="view-all">查看全部 →</a>
                    </div>
                    <div class="order-stats-grid">
                        <div class="order-stat-card" onclick="window.location.hash = '/orders'; setTimeout(() => { if(window.app && window.app.loadOrders) window.app.loadOrders(0); }, 200);" style="cursor: pointer;">
                            <div class="stat-icon">
                                <img src="https://img.icons8.com/?size=100&id=7252&format=png" alt="Pending Payment Icon" style="width: 32px; height: 32px;">
                            </div>
                            <div class="stat-info">
                                <div class="stat-number" id="pendingCount">0</div>
                                <div class="stat-label">待付款</div>
                            </div>
                        </div>
                        <div class="order-stat-card" onclick="window.location.hash = '/orders'; setTimeout(() => { if(window.app && window.app.loadOrders) window.app.loadOrders(1); }, 200);" style="cursor: pointer;">
                            <div class="stat-icon">
                                <img src="https://img.icons8.com/?size=100&id=12091&format=png" alt="Paid Icon" style="width: 32px; height: 32px;">
                            </div>
                            <div class="stat-info">
                                <div class="stat-number" id="paidCount">0</div>
                                <div class="stat-label">待发货</div>
                            </div>
                        </div>
                        <div class="order-stat-card" onclick="window.location.hash = '/orders'; setTimeout(() => { if(window.app && window.app.loadOrders) window.app.loadOrders(3); }, 200);" style="cursor: pointer;">
                            <div class="stat-icon">
                                <img src="https://img.icons8.com/?size=100&id=487&format=png" alt="Shipped Icon" style="width: 32px; height: 32px;">
                            </div>
                            <div class="stat-info">
                                <div class="stat-number" id="shippedCount">0</div>
                                <div class="stat-label">待收货</div>
                            </div>
                        </div>
                        <div class="order-stat-card" onclick="window.location.hash = '/orders'; setTimeout(() => { if(window.app && window.app.loadOrders) window.app.loadOrders(4); }, 200);" style="cursor: pointer;">
                            <div class="stat-icon">
                                <img src="https://img.icons8.com/?size=100&id=3686&format=png" alt="Completed Icon" style="width: 32px; height: 32px;">
                            </div>
                            <div class="stat-info">
                                <div class="stat-number" id="completedCount">0</div>
                                <div class="stat-label">已完成</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 浏览历史 -->
                <div class="profile-section">
                    <div class="section-title">
                        <h3><svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-time"></use></svg> 浏览历史</h3>
                        <button class="btn btn-sm" onclick="ProfileService.clearBrowsingHistory()">清空历史</button>
                    </div>
                    <div id="browsingHistory">
                        <div class="loading-text">加载中...</div>
                    </div>
                </div>

                <!-- 收货地址 -->
                <div class="profile-section">
                    <div class="section-title">
                        <h3><svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-location"></use></svg> 收货地址</h3>
                        <button class="btn btn-primary btn-sm" onclick="ProfileService.showAddAddressModal()">
                            + 新增地址
                        </button>
                    </div>
                    <div id="addressList">
                        <div class="loading-text">加载中...</div>
                    </div>
                </div>

                <!-- 账户设置 -->
                <div class="profile-section">
                    <div class="section-title">
                        <h3><svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-settings"></use></svg> 账户设置</h3>
                    </div>
                    <div class="settings-list">
                        <div class="setting-item" onclick="ProfileService.showEditProfileModal()">
                            <div class="setting-icon">
                                <img src="https://img.icons8.com/?size=100&id=23264&format=png" alt="Security Settings Icon" style="width: 24px; height: 24px;">
                            </div>
                            <div class="setting-info">
                                <h4>个人信息</h4>
                                <p>修改昵称、联系方式等基本信息</p>
                            </div>
                            <button class="btn btn-sm">编辑</button>
                        </div>
                        <div class="setting-item" onclick="ProfileService.showChangePasswordModal()">
                            <div class="setting-icon">
                                <img src="https://img.icons8.com/?size=100&id=94&format=png" alt="Security Settings Icon" style="width: 24px; height: 24px;">
                            </div>
                            <div class="setting-info">
                                <h4>安全设置</h4>
                                <p>修改密码、绑定手机号</p>
                            </div>
                            <button class="btn btn-sm">设置</button>
                        </div>
                        <div class="setting-item" onclick="ProfileService.showAccountStats()">
                            <div class="setting-icon">
                                <img src="https://img.icons8.com/?size=100&id=15&format=png" alt="Security Settings Icon" style="width: 24px; height: 24px;">
                            </div>
                            <div class="setting-info">
                                <h4>账户统计</h4>
                                <p>查看消费记录和订单历史</p>
                            </div>
                            <button class="btn btn-sm">查看</button>
                        </div>
                        <div class="setting-item" onclick="showDeleteAccountModal()">
                            <div class="setting-icon">
                                <img src="https://img.icons8.com/?size=100&id=67&format=png" alt="Delete Account Icon" style="width: 24px; height: 24px;">
                            </div>
                            <div class="setting-info">
                                <h4>注销账户</h4>
                                <p>永久删除账户及所有数据</p>
                            </div>
                            <button class="btn btn-sm btn-danger">注销</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // 渲染商家内容
    renderMerchantContent() {
        return `
            <div class="profile-content">
                <!-- 商家统计 -->
                <div class="profile-section">
                    <div class="section-title">
                        <h3><svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-order"></use></svg> 店铺数据</h3>
                    </div>
                    <div class="order-stats-grid">
                        <div class="order-stat-card">
                            <div class="stat-icon">
                                <img src="https://img.icons8.com/?size=100&id=DlNS9fNLzyOd&format=png" alt="Total Products Icon" style="width: 32px; height: 32px;">
                            </div>
                            <div class="stat-info">
                                <div class="stat-number" id="merchantProductCount">0</div>
                                <div class="stat-label">商品总数</div>
                            </div>
                        </div>
                        <div class="order-stat-card">
                            <div class="stat-icon">
                                <img src="https://img.icons8.com/?size=100&id=3x0z0wmYqFpB&format=png" alt="Total Products Icon" style="width: 32px; height: 32px;">
                            </div>
                            <div class="stat-info">
                                <div class="stat-number" id="merchantTotalSales">0</div>
                                <div class="stat-label">总销量</div>
                            </div>
                        </div>
                        <div class="order-stat-card">
                            <div class="stat-icon">
                                <img src="https://img.icons8.com/?size=100&id=w9CgCGrxafL1&format=png" alt="Total Products Icon" style="width: 32px; height: 32px;">
                            </div>
                            <div class="stat-info">
                                <div class="stat-number" id="merchantRevenue">¥0</div>
                                <div class="stat-label">总收入</div>
                            </div>
                        </div>
                        <div class="order-stat-card">
                            <div class="stat-icon">
                                <img src="https://img.icons8.com/?size=100&id=VghVCIlysYfn&format=png" alt="Total Products Icon" style="width: 32px; height: 32px;">
                            </div>
                                <div class="stat-number" id="merchantRating">5.0</div>
                                <div class="stat-label">店铺评分</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 客户浏览日志 -->
                <div class="profile-section">
                    <div class="section-title">
                        <h3><svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-time"></use></svg> 客户浏览日志</h3>
                        <button class="btn btn-sm" onclick="ProfileService.refreshBrowsingLogs()">
                            <svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-refresh"></use></svg>
                            刷新
                        </button>
                    </div>
                    <div id="merchantBrowsingLogs">
                        <div class="loading-text">加载中...</div>
                    </div>
                </div>

                <!-- 客户购买日志 -->
                <div class="profile-section">
                    <div class="section-title">
                        <h3><svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-shopping-bag"></use></svg> 客户购买日志</h3>
                        <button class="btn btn-sm" onclick="ProfileService.refreshPurchaseLogs()">
                            <svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-refresh"></use></svg>
                            刷新
                        </button>
                    </div>
                    <div id="merchantPurchaseLogs">
                        <div class="loading-text">加载中...</div>
                    </div>
                </div>

                <!-- 管理中心 -->
                <div class="profile-section">
                    <div class="section-title">
                        <h3><svg width="18" height="18" class="icon" aria-hidden="true"><use xlink:href="#icon-star"></use></svg> 管理中心</h3>
                    </div>
                    <div class="settings-list">
                        <div class="setting-item">
                            <div class="stat-icon">
                                <img src="https://img.icons8.com/?size=100&id=12091&format=png" alt="Total Products Icon" style="width: 32px; height: 32px;">
                            </div>
                            <div class="setting-info">
                                <h4>商品管理</h4>
                                <p>查看和管理店铺商品</p>
                            </div>
                            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); window.location.hash = '/merchant';">进入</button>
                        </div>
                        <div class="setting-item">
                            <div class="stat-icon">
                                <img src="https://img.icons8.com/?size=100&id=4255&format=png" alt="Total Products Icon" style="width: 32px; height: 32px;">
                            </div>
                            <div class="setting-info">
                                <h4>订单管理</h4>
                                <p>处理客户订单和发货</p>
                            </div>
                            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); window.location.hash = '/merchant';">进入</button>
                        </div>
                        <div class="setting-item" onclick="showMerchantStatsModal()">
                            <div class="stat-icon">
                                <img src="https://img.icons8.com/?size=100&id=3005&format=png" alt="Total Products Icon" style="width: 32px; height: 32px;">
                            </div>
                            <div class="setting-info">
                                <h4>数据分析</h4>
                                <p>查看销售趋势和热门商品</p>
                            </div>
                            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); showMerchantStatsModal();">分析</button>
                        </div>
                        <div class="setting-item" onclick="showDeleteAccountModal()">
                            <div class="stat-icon">
                                <img src="https://img.icons8.com/?size=100&id=67&format=png" alt="Delete Account Icon" style="width: 32px; height: 32px;">
                            </div>
                            <div class="setting-info">
                                <h4>注销账户</h4>
                                <p>永久删除商家账户及所有店铺数据</p>
                            </div>
                            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); showDeleteAccountModal();">注销</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // 加载用户统计数据
    async loadUserStats() {
        try {
            // 从后端API获取订单统计数据
            const orders = await OrderService.getOrders();

            const stats = {
                pending: orders.filter(o => o.status === 0).length,
                paid: orders.filter(o => o.status === 1 || o.status === 2).length,
                shipped: orders.filter(o => o.status === 3).length,
                completed: orders.filter(o => o.status === 4).length
            };

            document.getElementById('pendingCount').textContent = stats.pending;
            document.getElementById('paidCount').textContent = stats.paid;
            document.getElementById('shippedCount').textContent = stats.shipped;
            document.getElementById('completedCount').textContent = stats.completed;

            // 加载收货地址
            await this.loadAddresses();

            // 加载浏览历史
            this.loadBrowsingHistory();
        } catch (error) {
            console.error('加载用户统计失败:', error);
        }
    },

    // 加载浏览历史
    loadBrowsingHistory() {
        const container = document.getElementById('browsingHistory');
        if (!container) return;

        const history = Store.getBrowsingHistory();

        if (history.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <div class="empty-icon-small"><svg width="56" height="56" class="icon" aria-hidden="true"><use xlink:href="#icon-time"></use></svg></div>
                    <p>还没有浏览记录</p>
                    <button class="btn btn-primary btn-sm" onclick="window.location.hash = '/';">
                        去逛逛
                    </button>
                </div>
            `;
            return;
        }

        // 只显示最近10条
        const recentHistory = history.slice(0, 10);

        container.innerHTML = `
            <div class="products-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
                ${recentHistory.map(item => `
                    <div class="product-card" onclick="app.router.navigate('/product/${item.id}')" style="cursor: pointer;">
                        <div class="product-image">
                            ${item.image ? `<img src="${item.image}" alt="${item.name}" onerror="this.parentElement.innerHTML='<svg width=\\'72\\' height=\\'72\\' class=\\'icon\\' aria-hidden=\\'true\\'><use xlink:href=\\'#icon-box\\'></use></svg>'" style="width:100%;height:100%;object-fit:cover;">` : '<svg width="72" height="72" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg>'}
                        </div>
                        <div class="product-info">
                            <h3 style="font-size: 14px;">${item.name}</h3>
                            <p class="product-desc" style="font-size: 12px;">${item.description || '优质商品'}</p>
                            <div class="product-footer">
                                <span class="price">¥${item.price}</span>
                                <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); Store.removeBrowsingHistory(${item.id}); ProfileService.loadBrowsingHistory();">
                                    <svg width="14" height="14" class="icon" aria-hidden="true"><use xlink:href="#icon-delete"></use></svg>删除
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${history.length > 10 ? `<p style="text-align: center; margin-top: 16px; color: var(--text-secondary); font-size: 13px;">仅显示最近10条浏览记录</p>` : ''}
        `;
    },

    // 清空浏览历史
    clearBrowsingHistory() {
        if (confirm('确定要清空所有浏览历史吗？')) {
            Store.clearBrowsingHistory();
            this.loadBrowsingHistory();
            showMessage('浏览历史已清空', 'success');
        }
    },

    // 加载商家统计数据
    async loadMerchantStats() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const products = await utils.request('/merchant/products');

            const totalProducts = products.length;
            const totalSales = products.reduce((sum, p) => sum + (p.sales || 0), 0);
            const totalRevenue = products.reduce((sum, p) => sum + (p.price * (p.sales || 0)), 0);

            document.getElementById('merchantProductCount').textContent = totalProducts;
            document.getElementById('merchantTotalSales').textContent = totalSales;
            document.getElementById('merchantRevenue').textContent = '¥' + totalRevenue.toFixed(2);

            // 加载客户行为日志
            this.loadMerchantBrowsingLogs();
            this.loadMerchantPurchaseLogs();
        } catch (error) {
            console.error('加载商家统计失败:', error);
        }
    },

    // 加载商家浏览日志
    async loadMerchantBrowsingLogs() {
        const container = document.getElementById('merchantBrowsingLogs');
        if (!container) return;

        try {
            const logs = await utils.request('/merchant/logs/browse?limit=20');
            console.log('浏览日志数据:', logs);

            if (!logs || logs.length === 0) {
                container.innerHTML = `
                    <div class="empty-state-small">
                        <svg width="56" height="56" class="icon" aria-hidden="true"><use xlink:href="#icon-time"></use></svg>
                        <p>暂无浏览日志</p>
                        <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">客户浏览商品后会在此显示记录</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div style="overflow-x: auto;">
                    <table class="data-table" style="width: 100%; min-width: 800px;">
                        <thead>
                            <tr>
                                <th style="padding: 12px;">用户</th>
                                <th style="padding: 12px;">商品名称</th>
                                <th style="padding: 12px;">价格</th>
                                <th style="padding: 12px;">浏览时间</th>
                                <th style="padding: 12px;">IP地址</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.map(log => `
                                <tr>
                                    <td style="padding: 12px;">
                                        <div style="font-weight: 500;">${log.user_name || log.userName || '用户#' + log.userId}</div>
                                        ${log.user_phone || log.userPhone ? `<div style="font-size: 12px; color: var(--text-secondary);">${log.user_phone || log.userPhone}</div>` : ''}
                                    </td>
                                    <td style="padding: 12px;">${log.productName || '未知商品'}</td>
                                    <td style="padding: 12px;">¥${log.productPrice || 0}</td>
                                    <td style="padding: 12px;">${new Date(log.browseTime).toLocaleString('zh-CN')}</td>
                                    <td style="padding: 12px; font-size: 12px; color: var(--text-secondary);">${log.ipAddress || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${logs.length >= 20 ? '<p style="text-align: center; margin-top: 12px; color: var(--text-secondary); font-size: 13px;">仅显示最近20条记录</p>' : ''}
            `;
        } catch (error) {
            console.error('加载浏览日志失败:', error);
            container.innerHTML = `
                <div class="empty-state-small">
                    <svg width="56" height="56" class="icon" aria-hidden="true"><use xlink:href="#icon-time"></use></svg>
                    <p>加载失败</p>
                    <button class="btn btn-sm btn-primary" onclick="ProfileService.refreshBrowsingLogs()">重试</button>
                </div>
            `;
        }
    },

    // 加载商家购买日志
    async loadMerchantPurchaseLogs() {
        const container = document.getElementById('merchantPurchaseLogs');
        if (!container) return;

        try {
            const logs = await utils.request('/merchant/logs/purchase?limit=20');
            console.log('购买日志数据:', logs);

            if (!logs || logs.length === 0) {
                container.innerHTML = `
                    <div class="empty-state-small">
                        <svg width="56" height="56" class="icon" aria-hidden="true"><use xlink:href="#icon-shopping-bag"></use></svg>
                        <p>暂无购买日志</p>
                        <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">客户购买商品后会在此显示记录</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div style="overflow-x: auto;">
                    <table class="data-table" style="width: 100%; min-width: 900px;">
                        <thead>
                            <tr>
                                <th style="padding: 12px;">用户</th>
                                <th style="padding: 12px;">订单ID</th>
                                <th style="padding: 12px;">商品数量</th>
                                <th style="padding: 12px;">订单金额</th>
                                <th style="padding: 12px;">购买时间</th>
                                <th style="padding: 12px;">IP地址</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.map(log => `
                                <tr>
                                    <td style="padding: 12px;">
                                        <div style="font-weight: 500;">${log.user_name || log.userName || '用户#' + log.userId}</div>
                                        ${log.user_phone || log.userPhone ? `<div style="font-size: 12px; color: var(--text-secondary);">${log.user_phone || log.userPhone}</div>` : ''}
                                    </td>
                                    <td style="padding: 12px;">#${log.orderId}</td>
                                    <td style="padding: 12px;">${log.itemCount || 0} 件</td>
                                    <td style="padding: 12px; color: var(--danger); font-weight: 600;">¥${log.totalAmount || 0}</td>
                                    <td style="padding: 12px;">${new Date(log.purchaseTime).toLocaleString('zh-CN')}</td>
                                    <td style="padding: 12px; font-size: 12px; color: var(--text-secondary);">${log.ipAddress || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${logs.length >= 20 ? '<p style="text-align: center; margin-top: 12px; color: var(--text-secondary); font-size: 13px;">仅显示最近20条记录</p>' : ''}
            `;
        } catch (error) {
            console.error('加载购买日志失败:', error);
            container.innerHTML = `
                <div class="empty-state-small">
                    <svg width="56" height="56" class="icon" aria-hidden="true"><use xlink:href="#icon-shopping-bag"></use></svg>
                    <p>加载失败</p>
                    <button class="btn btn-sm btn-primary" onclick="ProfileService.refreshPurchaseLogs()">重试</button>
                </div>
            `;
        }
    },

    // 刷新浏览日志
    refreshBrowsingLogs() {
        const container = document.getElementById('merchantBrowsingLogs');
        if (container) {
            container.innerHTML = '<div class="loading-text">加载中...</div>';
        }
        this.loadMerchantBrowsingLogs();
    },

    // 刷新购买日志
    refreshPurchaseLogs() {
        const container = document.getElementById('merchantPurchaseLogs');
        if (container) {
            container.innerHTML = '<div class="loading-text">加载中...</div>';
        }
        this.loadMerchantPurchaseLogs();
    },

    // 加载订单列表
    async loadOrders(status = 'all') {
        const container = document.getElementById('ordersList');
        if (!container) return;

        container.innerHTML = '<div class="loading">正在加载订单数据</div>';
        Store.setOrderFilter(status);

        try {
            // 模拟订单数据（实际应该从后端API获取）
            const mockOrders = this.generateMockOrders();

            // 根据状态筛选
            const filteredOrders = status === 'all'
                ? mockOrders
                : mockOrders.filter(order => order.status === status);

            if (filteredOrders.length > 0) {
                this.displayOrders(filteredOrders);
                this.updateOrderStats(mockOrders);
            } else {
                container.innerHTML = `
                    <div class="empty-orders">
                        <div class="empty-orders-icon"><svg width="56" height="56" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg></div>
                        <div class="empty-orders-text">暂无${ORDER_STATUS_TEXT[status]}订单</div>
                        <button class="btn btn-primary" onclick="Router.navigate('products')">去购物</button>
                    </div>
                `;
            }
        } catch (error) {
            container.innerHTML = '<div class="empty-orders"><div class="empty-orders-icon">❌</div><div class="empty-orders-text">加载失败，请刷新重试</div></div>';
        }
    },

    // 生成模拟订单数据
    generateMockOrders() {
        // 返回空数组，实际数据应从后端API获取
        return [];
    },

    // 显示订单列表
    displayOrders(orders) {
        const container = document.getElementById('ordersList');

        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <span class="order-number">订单号: ${order.orderNumber}</span>
                        <span class="badge ${ORDER_STATUS_BADGE[order.status]}" style="margin-left: 12px;">
                            ${ORDER_STATUS_TEXT[order.status]}
                        </span>
                    </div>
                    <div class="order-date">${order.createTime}</div>
                </div>
                <div class="order-body">
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <div class="order-item-info">
                                    <h4>${item.name}</h4>
                                    <p>数量: ${item.quantity}</p>
                                </div>
                                <div class="order-item-price">¥${(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-footer">
                        <div class="order-total">
                            订单总额: <span>¥${order.totalAmount.toFixed(2)}</span>
                        </div>
                        <div class="order-actions">
                            ${this.getOrderActions(order)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // 获取订单操作按钮
    getOrderActions(order) {
        const actions = [];

        switch (order.status) {
            case ORDER_STATUS.PENDING:
                actions.push(`<button class="btn btn-primary btn-small" onclick="ProfileService.payOrder(${order.id})"><svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-credit-card"></use></svg> 立即支付</button>`);
                actions.push(`<button class="btn btn-small" onclick="ProfileService.cancelOrder(${order.id})">取消订单</button>`);
                break;
            case ORDER_STATUS.PAID:
                actions.push(`<button class="btn btn-small" onclick="showMessage('商家正在备货中...', 'success')"><svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg> 查看物流</button>`);
                break;
            case ORDER_STATUS.SHIPPED:
                actions.push(`<button class="btn btn-primary btn-small" onclick="ProfileService.confirmReceipt(${order.id})"><svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-check"></use></svg> 确认收货</button>`);
                actions.push(`<button class="btn btn-small" onclick="showMessage('物流信息功能开发中...', 'success')"><svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg> 查看物流</button>`);
                break;
            case ORDER_STATUS.COMPLETED:
                actions.push(`<button class="btn btn-small" onclick="showMessage('评价功能开发中...', 'success')"><svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-star"></use></svg> 评价</button>`);
                actions.push(`<button class="btn btn-small" onclick="showMessage('再次购买功能开发中...', 'success')"><svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-refresh"></use></svg> 再次购买</button>`);
                break;
        }

        return actions.join('');
    },

    // 更新订单统计
    updateOrderStats(orders) {
        const stats = {
            all: orders.length,
            pending: orders.filter(o => o.status === ORDER_STATUS.PENDING).length,
            paid: orders.filter(o => o.status === ORDER_STATUS.PAID).length,
            shipped: orders.filter(o => o.status === ORDER_STATUS.SHIPPED).length,
            completed: orders.filter(o => o.status === ORDER_STATUS.COMPLETED).length
        };

        const elements = {
            allOrdersCount: document.getElementById('allOrdersCount'),
            pendingOrdersCount: document.getElementById('pendingOrdersCount'),
            paidOrdersCount: document.getElementById('paidOrdersCount'),
            shippedOrdersCount: document.getElementById('shippedOrdersCount'),
            completedOrdersCount: document.getElementById('completedOrdersCount')
        };

        if (elements.allOrdersCount) elements.allOrdersCount.textContent = stats.all;
        if (elements.pendingOrdersCount) elements.pendingOrdersCount.textContent = stats.pending;
        if (elements.paidOrdersCount) elements.paidOrdersCount.textContent = stats.paid;
        if (elements.shippedOrdersCount) elements.shippedOrdersCount.textContent = stats.shipped;
        if (elements.completedOrdersCount) elements.completedOrdersCount.textContent = stats.completed;
    },

    // 支付订单
    payOrder(orderId) {
        if (confirm('确认支付此订单吗？')) {
            showMessage('支付成功！订单已提交给商家', 'success');
            setTimeout(() => {
                this.loadOrders(Store.getOrderFilter());
            }, 1500);
        }
    },

    // 取消订单
    cancelOrder(orderId) {
        if (confirm('确定要取消此订单吗？')) {
            showMessage('订单已取消', 'success');
            setTimeout(() => {
                this.loadOrders(Store.getOrderFilter());
            }, 1500);
        }
    },

    // 确认收货
    confirmReceipt(orderId) {
        if (confirm('确认已收到商品吗？')) {
            showMessage('确认收货成功！感谢您的购买', 'success');
            setTimeout(() => {
                this.loadOrders(Store.getOrderFilter());
            }, 1500);
        }
    },

    // 加载收货地址
    async loadAddresses() {
        const container = document.getElementById('addressList');
        if (!container) return;

        // 模拟地址数据（实际应从后端API获取）
        const addresses = [];

        if (addresses.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <div class="empty-icon-small">
                        <img src="https://img.icons8.com/?size=100&id=53383&format=png" alt="No Address Icon" style="width: 56px; height: 56px;">
                    </div>
                    <p>还没有收货地址</p>
                    <button class="btn btn-primary btn-sm" onclick="ProfileService.showAddAddressModal()">
                        添加地址
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = addresses.map(addr => `
            <div class="address-item">
                <div class="address-info">
                    <h4>${addr.receiver} ${addr.phone}</h4>
                    <p>${addr.address}</p>
                    ${addr.isDefault ? '<span class="badge">默认</span>' : ''}
                </div>
                <div class="address-actions">
                    <button class="btn btn-sm" onclick="ProfileService.editAddress(${addr.id})">编辑</button>
                    <button class="btn btn-sm btn-danger" onclick="ProfileService.deleteAddress(${addr.id})">删除</button>
                </div>
            </div>
        `).join('');
    },

    // 显示所有订单
    showAllOrders() {
        if (window.app && window.app.router) {
            window.app.router.navigate('/orders');
        }
    },

    // 筛选订单
    filterOrders(status) {
        if (window.app && window.app.router) {
            // 先保存要筛选的状态
            const statusMap = {
                'pending': 0,
                'paid': 1,
                'shipped': 3,
                'completed': 4
            };
            const targetStatus = statusMap[status];

            // 跳转到订单页面
            window.app.router.navigate('/orders');

            // 等待页面加载后再筛选
            setTimeout(() => {
                if (window.app && window.app.currentOrderStatus !== undefined) {
                    // 直接调用loadOrders方法
                    window.app.loadOrders(targetStatus);

                    // 更新标签激活状态
                    document.querySelectorAll('.order-tab').forEach((tab, index) => {
                        tab.classList.remove('active');
                        // 根据索引匹配：0-全部, 1-待支付(0), 2-已支付(1), 3-已发货(3), 4-已完成(4), 5-已取消(5)
                        const tabStatusMap = [null, 0, 1, 3, 4, 5];
                        if (tabStatusMap[index] === targetStatus) {
                            tab.classList.add('active');
                        }
                    });
                }
            }, 200);
        }
    },

    // 显示添加地址模态框
    showAddAddressModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-location"></use></svg> 新增收货地址</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <form onsubmit="ProfileService.handleAddAddress(event)">
                    <div class="form-group">
                        <label>收货人姓名 <span class="label-required">*</span></label>
                        <input type="text" name="receiver" required class="form-input" placeholder="请输入收货人姓名">
                    </div>
                    <div class="form-group">
                        <label>联系电话 <span class="label-required">*</span></label>
                        <input type="tel" name="phone" required pattern="[0-9]{11}" class="form-input" placeholder="请输入11位手机号">
                    </div>
                    <div class="form-group">
                        <label>所在地区 <span class="label-required">*</span></label>
                        <input type="text" name="region" required class="form-input" placeholder="省/市/区">
                    </div>
                    <div class="form-group">
                        <label>详细地址 <span class="label-required">*</span></label>
                        <textarea name="address" required rows="3" class="form-input" placeholder="请输入详细地址（街道、门牌号等）"></textarea>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="isDefault" style="width: auto; margin-right: 8px;">
                            设为默认地址
                        </label>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                        <button type="submit" class="btn btn-primary">保存</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    // 处理添加地址
    async handleAddAddress(event) {
        event.preventDefault();
        const form = event.target;
        const data = {
            receiver: form.receiver.value,
            phone: form.phone.value,
            region: form.region.value,
            address: form.address.value,
            isDefault: form.isDefault.checked
        };

        // 这里应该调用后端API保存地址
        showMessage('地址添加成功', 'success');
        form.closest('.modal').remove();
        this.loadAddresses();
    },

    // 获取默认头像
    getDefaultAvatar(username) {
        // 使用用户名首字母生成默认头像
        const initial = (username || 'U').charAt(0).toUpperCase();
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
        const colorIndex = initial.charCodeAt(0) % colors.length;
        const bgColor = colors[colorIndex];

        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
                <rect width="128" height="128" fill="${bgColor}"/>
                <text x="50%" y="50%" font-size="64" fill="white" text-anchor="middle" dy=".35em" font-family="Arial, sans-serif" font-weight="bold">${initial}</text>
            </svg>
        `)}`;
    },

    // 显示头像选择器
    showAvatarSelector() {
        const currentUser = Store.getCurrentUser();
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';

        // 预设头像列表
        const avatars = [
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasmine',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucy',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
            'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
            'https://api.dicebear.com/7.x/bottts/svg?seed=Aneka',
            'https://api.dicebear.com/7.x/bottts/svg?seed=Max',
            'https://api.dicebear.com/7.x/bottts/svg?seed=Lucy'
        ];

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-camera"></use></svg> 选择头像</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px;">
                        ${avatars.map(url => `
                            <div class="avatar-option" onclick="ProfileService.selectAvatar('${url}')" style="cursor: pointer; border: 3px solid transparent; border-radius: 12px; padding: 8px; transition: all 0.3s;">
                                <img src="${url}" alt="头像" style="width: 100%; height: 100%; border-radius: 8px; object-fit: cover;">
                            </div>
                        `).join('')}
                    </div>
                    <div class="form-group">
                        <label>或输入自定义头像URL</label>
                        <input type="url" id="customAvatarUrl" class="form-input" placeholder="https://example.com/avatar.jpg">
                        <button class="btn btn-sm btn-primary" onclick="ProfileService.selectAvatar(document.getElementById('customAvatarUrl').value)" style="margin-top: 8px;">使用自定义头像</button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // 添加悬停效果
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('mouseenter', function () {
                this.style.borderColor = 'var(--primary)';
                this.style.transform = 'scale(1.05)';
            });
            option.addEventListener('mouseleave', function () {
                this.style.borderColor = 'transparent';
                this.style.transform = 'scale(1)';
            });
        });
    },

    // 选择头像
    async selectAvatar(avatarUrl) {
        if (!avatarUrl || !avatarUrl.trim()) {
            showMessage('请输入有效的头像URL', 'error');
            return;
        }

        try {
            const currentUser = Store.getCurrentUser();
            currentUser.avatar = avatarUrl;
            Store.setCurrentUser(currentUser);

            // 这里应该调用后端API保存头像
            // await utils.request('/user/update-avatar', {
            //     method: 'PUT',
            //     body: JSON.stringify({ avatar: avatarUrl })
            // });

            showMessage('头像更新成功', 'success');
            document.querySelector('.modal').remove();
            this.loadProfile();
        } catch (error) {
            showMessage('头像更新失败', 'error');
        }
    },

    // 显示编辑资料模态框
    showEditProfileModal() {
        const currentUser = Store.getCurrentUser();
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-user"></use></svg> 编辑个人信息</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <form onsubmit="ProfileService.handleEditProfile(event)">
                    <div class="form-group">
                        <label>用户名 <span class="label-required">*</span></label>
                        <input type="text" name="username" value="${currentUser.username || ''}" required class="form-input" placeholder="请输入用户名">
                    </div>
                    <div class="form-group">
                        <label>手机号</label>
                        <input type="tel" name="phone" value="${currentUser.phone || ''}" pattern="[0-9]{11}" class="form-input" placeholder="请输入11位手机号">
                        <div class="form-hint">💡 设置后可作为默认联系电话</div>
                    </div>
                    <div class="form-group">
                        <label>邮箱</label>
                        <input type="email" name="email" value="${currentUser.email || ''}" class="form-input" placeholder="请输入邮箱">
                    </div>
                    <div class="form-group">
                        <label>默认收货地址</label>
                        <textarea name="defaultAddress" rows="3" class="form-input" placeholder="请输入默认收货地址（可选）">${currentUser.defaultAddress || ''}</textarea>
                        <div class="form-hint">💡 设置后下单时自动填充</div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                        <button type="submit" class="btn btn-primary">保存</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    // 处理编辑资料
    async handleEditProfile(event) {
        event.preventDefault();
        const form = event.target;
        const data = {
            username: form.username.value.trim(),
            phone: form.phone.value.trim(),
            email: form.email.value.trim(),
            defaultAddress: form.defaultAddress.value.trim()
        };

        // 验证手机号格式
        if (data.phone && !/^1[3-9]\d{9}$/.test(data.phone)) {
            showMessage('请输入正确的手机号格式', 'error');
            return;
        }

        try {
            // 这里应该调用后端API保存信息
            // await utils.request('/user/update', {
            //     method: 'PUT',
            //     body: JSON.stringify(data)
            // });

            // 更新本地用户信息
            const currentUser = Store.getCurrentUser();
            Object.assign(currentUser, data);
            Store.setCurrentUser(currentUser);

            showMessage('个人信息更新成功', 'success');
            form.closest('.modal').remove();
            this.loadProfile();
        } catch (error) {
            showMessage('更新失败，请稍后重试', 'error');
        }
    },

    // 显示修改密码模态框
    showChangePasswordModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-lock"></use></svg> 修改密码</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <form onsubmit="ProfileService.handleChangePassword(event)">
                    <div class="form-group">
                        <label>原密码 <span class="label-required">*</span></label>
                        <input type="password" name="oldPassword" required class="form-input" placeholder="请输入原密码">
                    </div>
                    <div class="form-group">
                        <label>新密码 <span class="label-required">*</span></label>
                        <input type="password" name="newPassword" required minlength="6" class="form-input" placeholder="请输入新密码（至少6位）">
                    </div>
                    <div class="form-group">
                        <label>确认新密码 <span class="label-required">*</span></label>
                        <input type="password" name="confirmPassword" required class="form-input" placeholder="请再次输入新密码">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                        <button type="submit" class="btn btn-primary">确认修改</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    // 处理修改密码
    async handleChangePassword(event) {
        event.preventDefault();
        const form = event.target;
        const oldPassword = form.oldPassword.value;
        const newPassword = form.newPassword.value;
        const confirmPassword = form.confirmPassword.value;

        if (newPassword !== confirmPassword) {
            showMessage('两次输入的新密码不一致', 'error');
            return;
        }

        try {
            await utils.request('/user/change-password', {
                method: 'POST',
                body: JSON.stringify({ oldPassword, newPassword })
            });
            showMessage('密码修改成功，请重新登录', 'success');
            form.closest('.modal').remove();
            setTimeout(() => {
                if (window.app) {
                    window.app.logout();
                }
            }, 1500);
        } catch (error) {
            // 错误已由utils.request处理
        }
    },

    // 显示账户统计
    showAccountStats() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-order"></use></svg> 账户统计</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div style="padding: 20px;">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h4>总订单数</h4>
                            <div class="stat-value">0</div>
                        </div>
                        <div class="stat-card">
                            <h4>总消费金额</h4>
                            <div class="stat-value">¥0</div>
                        </div>
                        <div class="stat-card">
                            <h4>会员等级</h4>
                            <div class="stat-value">普通会员</div>
                        </div>
                    </div>
                    <div style="margin-top: 20px; text-align: center; color: #666;">
                        <p>更多统计功能开发中...</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="this.closest('.modal').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    // 编辑地址
    editAddress(id) {
        showMessage('编辑地址功能开发中...', 'info');
    },

    // 删除地址
    deleteAddress(id) {
        if (confirm('确定要删除此地址吗？')) {
            showMessage('地址删除成功', 'success');
            this.loadAddresses();
        }
    },

    // 显示浏览日志
    async showBrowsingLogs() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-time"></use></svg> 客户浏览日志</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body" style="padding: 20px; max-height: 500px; overflow-y: auto;">
                    <div id="browsingLogsContent">
                        <div class="loading-text">加载中...</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="this.closest('.modal').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // 从后端API加载浏览日志数据
        try {
            const logs = await utils.request('/merchant/logs/browse?limit=50');
            const content = document.getElementById('browsingLogsContent');
            if (!content) return;

            console.log('浏览日志数据:', logs); // 调试信息

            if (!logs || logs.length === 0) {
                content.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        <svg width="64" height="64" class="icon" aria-hidden="true"><use xlink:href="#icon-time"></use></svg>
                        <p style="margin-top: 16px;">暂无浏览日志</p>
                        <p style="font-size: 12px; margin-top: 8px;">提示：客户浏览商品后会在此显示记录</p>
                    </div>
                `;
                return;
            }

            content.innerHTML = `
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--bg-secondary); text-align: left;">
                            <th style="padding: 12px; border-bottom: 2px solid var(--border-light);">用户</th>
                            <th style="padding: 12px; border-bottom: 2px solid var(--border-light);">商品名称</th>
                            <th style="padding: 12px; border-bottom: 2px solid var(--border-light);">价格</th>
                            <th style="padding: 12px; border-bottom: 2px solid var(--border-light);">浏览时间</th>
                            <th style="padding: 12px; border-bottom: 2px solid var(--border-light);">IP地址</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map(log => `
                            <tr style="border-bottom: 1px solid var(--border-light);">
                                <td style="padding: 12px;">
                                    <div style="font-weight: 500;">${log.user_name || log.userName || '用户#' + log.userId}</div>
                                    ${log.user_phone || log.userPhone ? `<div style="font-size: 12px; color: var(--text-secondary);">${log.user_phone || log.userPhone}</div>` : ''}
                                </td>
                                <td style="padding: 12px;">${log.productName || '未知商品'}</td>
                                <td style="padding: 12px;">¥${log.productPrice || 0}</td>
                                <td style="padding: 12px;">${new Date(log.browseTime).toLocaleString('zh-CN')}</td>
                                <td style="padding: 12px; font-size: 12px; color: var(--text-secondary);">${log.ipAddress || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            const content = document.getElementById('browsingLogsContent');
            if (content) {
                content.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        <svg width="64" height="64" class="icon" aria-hidden="true"><use xlink:href="#icon-time"></use></svg>
                        <p style="margin-top: 16px;">加载失败，请稍后重试</p>
                    </div>
                `;
            }
        }
    },

    // 显示购买日志
    async showPurchaseLogs() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-shopping-bag"></use></svg> 客户购买日志</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body" style="padding: 20px; max-height: 500px; overflow-y: auto;">
                    <div id="purchaseLogsContent">
                        <div class="loading-text">加载中...</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="this.closest('.modal').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // 从后端API加载购买日志数据
        try {
            const logs = await utils.request('/merchant/logs/purchase?limit=50');
            const content = document.getElementById('purchaseLogsContent');
            if (!content) return;

            console.log('购买日志数据:', logs); // 调试信息

            if (!logs || logs.length === 0) {
                content.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        <svg width="64" height="64" class="icon" aria-hidden="true"><use xlink:href="#icon-shopping-bag"></use></svg>
                        <p style="margin-top: 16px;">暂无购买日志</p>
                        <p style="font-size: 12px; margin-top: 8px;">提示：客户购买商品后会在此显示记录</p>
                    </div>
                `;
                return;
            }

            content.innerHTML = `
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--bg-secondary); text-align: left;">
                            <th style="padding: 12px; border-bottom: 2px solid var(--border-light);">用户</th>
                            <th style="padding: 12px; border-bottom: 2px solid var(--border-light);">订单ID</th>
                            <th style="padding: 12px; border-bottom: 2px solid var(--border-light);">商品数量</th>
                            <th style="padding: 12px; border-bottom: 2px solid var(--border-light);">订单金额</th>
                            <th style="padding: 12px; border-bottom: 2px solid var(--border-light);">购买时间</th>
                            <th style="padding: 12px; border-bottom: 2px solid var(--border-light);">IP地址</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map(log => `
                            <tr style="border-bottom: 1px solid var(--border-light);">
                                <td style="padding: 12px;">
                                    <div style="font-weight: 500;">${log.user_name || log.userName || '用户#' + log.userId}</div>
                                    ${log.user_phone || log.userPhone ? `<div style="font-size: 12px; color: var(--text-secondary);">${log.user_phone || log.userPhone}</div>` : ''}
                                </td>
                                <td style="padding: 12px;">#${log.orderId}</td>
                                <td style="padding: 12px;">${log.itemCount || 0} 件</td>
                                <td style="padding: 12px; color: var(--danger); font-weight: 600;">¥${log.totalAmount || 0}</td>
                                <td style="padding: 12px;">${new Date(log.purchaseTime).toLocaleString('zh-CN')}</td>
                                <td style="padding: 12px; font-size: 12px; color: var(--text-secondary);">${log.ipAddress || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            const content = document.getElementById('purchaseLogsContent');
            if (content) {
                content.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        <svg width="64" height="64" class="icon" aria-hidden="true"><use xlink:href="#icon-shopping-bag"></use></svg>
                        <p style="margin-top: 16px;">加载失败，请稍后重试</p>
                    </div>
                `;
            }
        }
    }
};

// 全局辅助函数
function showMessage(message, type = 'info') {
    if (typeof utils !== 'undefined' && utils.showToast) {
        utils.showToast(message, type);
    } else {
        alert(message);
    }
}

// 筛选订单
function filterOrders(status) {
    // 更新标签状态
    document.querySelectorAll('.order-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.status === status) {
            tab.classList.add('active');
        }
    });

    // 加载对应状态的订单
    ProfileService.loadOrders(status);
}
