// 客户管理模块 - 管理员视角

const CustomerManagement = {
    currentPage: 1,
    pageSize: 20,
    customers: [],

    /**
     * 初始化客户管理页面
     */
    async init() {
        await this.loadCustomers();
    },

    /**
     * 加载客户列表
     */
    async loadCustomers(keyword = '') {
        try {
            const url = keyword
                ? `${API_BASE}/api/admin/customers?keyword=${encodeURIComponent(keyword)}`
                : `${API_BASE}/api/admin/customers`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${utils.getToken()}`
                }
            });

            const data = await response.json();

            if (data.code === 200) {
                this.customers = data.data || [];
                this.renderCustomerList();
            } else {
                utils.showToast(data.message || '加载客户列表失败', 'error');
            }
        } catch (error) {
            console.error('Load customers error:', error);
            utils.showToast('加载客户列表失败', 'error');
        }
    },

    /**
     * 渲染客户列表
     */
    renderCustomerList() {
        const container = document.getElementById('customerList');
        if (!container) return;

        if (this.customers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" class="icon" aria-hidden="true"><use xlink:href="#icon-user"></use></svg>
                    <p>暂无客户数据</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>用户ID</th>
                        <th>用户名</th>
                        <th>联系方式</th>
                        <th>用户类型</th>
                        <th>订单数</th>
                        <th>浏览次数</th>
                        <th>注册时间</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.customers.map(customer => `
                        <tr>
                            <td>#${customer.id}</td>
                            <td>${customer.username || '-'}</td>
                            <td>
                                ${customer.phone ? `<div>${customer.phone}</div>` : ''}
                                ${customer.email ? `<div style="font-size: 12px; color: var(--text-secondary);">${customer.email}</div>` : ''}
                                ${!customer.phone && !customer.email ? '-' : ''}
                            </td>
                            <td>
                                <span class="badge badge-${customer.userType === 2 ? 'merchant' : 'user'}">
                                    ${customer.userType === 2 ? '商家' : '普通用户'}
                                </span>
                            </td>
                            <td>${customer.orderCount || 0}</td>
                            <td>${customer.browseCount || 0}</td>
                            <td>${this.formatDate(customer.createTime)}</td>
                            <td>
                                <span class="badge badge-${customer.status === 1 ? 'success' : 'secondary'}">
                                    ${customer.status === 1 ? '正常' : '禁用'}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm" onclick="CustomerManagement.viewCustomerDetail(${customer.id})">
                                    详情
                                </button>
                                <button class="btn btn-sm" onclick="CustomerManagement.viewCustomerLogs(${customer.id}, '${customer.username}')">
                                    日志
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * 查看客户详情
     */
    async viewCustomerDetail(customerId) {
        try {
            const response = await fetch(`${API_BASE}/api/admin/customers/${customerId}/stats`, {
                headers: {
                    'Authorization': `Bearer ${utils.getToken()}`
                }
            });

            const data = await response.json();

            if (data.code === 200) {
                this.showCustomerDetailModal(customerId, data.data);
            } else {
                utils.showToast(data.message || '获取客户详情失败', 'error');
            }
        } catch (error) {
            console.error('View customer detail error:', error);
            utils.showToast('获取客户详情失败', 'error');
        }
    },

    /**
     * 显示客户详情模态框
     */
    showCustomerDetailModal(customerId, stats) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-user"></use></svg> 客户统计 #${customerId}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                        <div class="stat-card">
                            <h4>总浏览次数</h4>
                            <div class="stat-value">${stats.browseStats?.totalBrowse || 0}</div>
                            <div class="stat-label">最近7天: ${stats.browseStats?.recentBrowse || 0}</div>
                        </div>
                        <div class="stat-card">
                            <h4>总订单数</h4>
                            <div class="stat-value">${stats.purchaseStats?.totalOrders || 0}</div>
                            <div class="stat-label">最近30天: ${stats.purchaseStats?.recentOrders || 0}</div>
                        </div>
                        <div class="stat-card">
                            <h4>总消费金额</h4>
                            <div class="stat-value">¥${stats.purchaseStats?.totalAmount || 0}</div>
                            <div class="stat-label">最近30天: ¥${stats.purchaseStats?.recentAmount || 0}</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 24px;">
                        <h4 style="margin-bottom: 12px;">订单统计</h4>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
                            <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; text-align: center;">
                                <div style="font-size: 24px; font-weight: 600; color: var(--primary);">${stats.orderStats?.totalOrders || 0}</div>
                                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">总订单</div>
                            </div>
                            <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; text-align: center;">
                                <div style="font-size: 24px; font-weight: 600; color: var(--warning);">${stats.orderStats?.pendingOrders || 0}</div>
                                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">待支付</div>
                            </div>
                            <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; text-align: center;">
                                <div style="font-size: 24px; font-weight: 600; color: var(--success);">${stats.orderStats?.completedOrders || 0}</div>
                                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">已完成</div>
                            </div>
                            <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; text-align: center;">
                                <div style="font-size: 24px; font-weight: 600; color: var(--text-secondary);">${stats.orderStats?.cancelledOrders || 0}</div>
                                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">已取消</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="this.closest('.modal').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    /**
     * 查看客户日志
     */
    viewCustomerLogs(customerId, username) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-time"></use></svg> 客户日志 - ${username}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div class="tabs" style="margin-bottom: 20px;">
                        <button class="tab-btn active" onclick="CustomerManagement.switchLogTab(${customerId}, 'browse', this)">
                            浏览日志
                        </button>
                        <button class="tab-btn" onclick="CustomerManagement.switchLogTab(${customerId}, 'purchase', this)">
                            购买日志
                        </button>
                    </div>
                    <div id="customerLogContent">
                        <div class="loading-text">加载中...</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="this.closest('.modal').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // 默认加载浏览日志
        this.loadBrowseLogs(customerId);
    },

    /**
     * 切换日志标签
     */
    switchLogTab(customerId, type, btn) {
        // 更新标签状态
        document.querySelectorAll('.tab-btn').forEach(tab => tab.classList.remove('active'));
        btn.classList.add('active');

        // 加载对应日志
        if (type === 'browse') {
            this.loadBrowseLogs(customerId);
        } else {
            this.loadPurchaseLogs(customerId);
        }
    },

    /**
     * 加载浏览日志
     */
    async loadBrowseLogs(customerId) {
        const container = document.getElementById('customerLogContent');
        if (!container) return;

        container.innerHTML = '<div class="loading-text">加载中...</div>';

        try {
            const response = await fetch(`${API_BASE}/api/admin/customers/${customerId}/browse-logs?limit=50`, {
                headers: {
                    'Authorization': `Bearer ${utils.getToken()}`
                }
            });

            const data = await response.json();

            if (data.code === 200) {
                const logs = data.data || [];

                if (logs.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <svg width="64" height="64" class="icon" aria-hidden="true"><use xlink:href="#icon-time"></use></svg>
                            <p>暂无浏览日志</p>
                        </div>
                    `;
                    return;
                }

                container.innerHTML = `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>商品名称</th>
                                <th>价格</th>
                                <th>浏览时间</th>
                                <th>IP地址</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.map(log => `
                                <tr>
                                    <td>${log.productName || '未知商品'}</td>
                                    <td>¥${log.productPrice || 0}</td>
                                    <td>${this.formatDateTime(log.browseTime)}</td>
                                    <td style="font-size: 12px; color: var(--text-secondary);">${log.ipAddress || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } else {
                container.innerHTML = `<div class="empty-state"><p>加载失败</p></div>`;
            }
        } catch (error) {
            console.error('Load browse logs error:', error);
            container.innerHTML = `<div class="empty-state"><p>加载失败</p></div>`;
        }
    },

    /**
     * 加载购买日志
     */
    async loadPurchaseLogs(customerId) {
        const container = document.getElementById('customerLogContent');
        if (!container) return;

        container.innerHTML = '<div class="loading-text">加载中...</div>';

        try {
            const response = await fetch(`${API_BASE}/api/admin/customers/${customerId}/purchase-logs?limit=50`, {
                headers: {
                    'Authorization': `Bearer ${utils.getToken()}`
                }
            });

            const data = await response.json();

            if (data.code === 200) {
                const logs = data.data || [];

                if (logs.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <svg width="64" height="64" class="icon" aria-hidden="true"><use xlink:href="#icon-shopping-bag"></use></svg>
                            <p>暂无购买日志</p>
                        </div>
                    `;
                    return;
                }

                container.innerHTML = `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>订单ID</th>
                                <th>商品数量</th>
                                <th>订单金额</th>
                                <th>购买时间</th>
                                <th>IP地址</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.map(log => `
                                <tr>
                                    <td>#${log.orderId}</td>
                                    <td>${log.itemCount || 0} 件</td>
                                    <td style="color: var(--danger); font-weight: 600;">¥${log.totalAmount || 0}</td>
                                    <td>${this.formatDateTime(log.purchaseTime)}</td>
                                    <td style="font-size: 12px; color: var(--text-secondary);">${log.ipAddress || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } else {
                container.innerHTML = `<div class="empty-state"><p>加载失败</p></div>`;
            }
        } catch (error) {
            console.error('Load purchase logs error:', error);
            container.innerHTML = `<div class="empty-state"><p>加载失败</p></div>`;
        }
    },

    /**
     * 搜索客户
     */
    handleSearch() {
        const keyword = document.getElementById('customerSearchInput')?.value || '';
        this.loadCustomers(keyword);
    },

    /**
     * 格式化日期
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    },

    /**
     * 格式化日期时间
     */
    formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN');
    }
};

// 导出到全局
window.CustomerManagement = CustomerManagement;