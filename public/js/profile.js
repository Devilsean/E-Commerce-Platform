// 个人中心服务模块

const ProfileService = {
    // 加载个人中心
    loadProfile() {
        const currentUser = Store.getCurrentUser();

        if (!currentUser) {
            showMessage('请先登录', 'error');
            Router.navigate('login');
            return;
        }

        // 显示用户信息
        const usernameEl = document.getElementById('profileUsername');
        const emailEl = document.getElementById('profileEmail');
        const roleEl = document.getElementById('profileRole');
        const titleEl = document.getElementById('profileTitle');

        if (usernameEl) {
            usernameEl.textContent = currentUser.username || currentUser.nickname || '用户';
        }
        if (emailEl) {
            emailEl.textContent = currentUser.email || currentUser.phone || '未设置';
        }

        // 判断用户角色
        const isMerchant = currentUser.role === 'merchant' || currentUser.userType === 2;

        if (roleEl) {
            roleEl.textContent = isMerchant ? '商家账号' : '普通用户';
        }
        if (titleEl) {
            titleEl.textContent = isMerchant ? '🏪 店铺中心' : '👤 个人中心';
        }

        // 显示对应的内容区域
        const userOrderSection = document.getElementById('userOrderSection');
        const merchantShopSection = document.getElementById('merchantShopSection');

        if (isMerchant) {
            // 商家用户：显示店铺管理
            if (userOrderSection) userOrderSection.style.display = 'none';
            if (merchantShopSection) merchantShopSection.style.display = 'block';
            MerchantService.loadMerchantProducts();
        } else {
            // 普通用户：显示订单管理
            if (userOrderSection) userOrderSection.style.display = 'block';
            if (merchantShopSection) merchantShopSection.style.display = 'none';
            this.loadOrders();
        }
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
                        <div class="empty-orders-icon">📦</div>
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
        return [
            {
                id: 1001,
                orderNumber: 'ORD20250120001',
                createTime: '2025-01-20 10:30:00',
                status: ORDER_STATUS.PENDING,
                totalAmount: 299.99,
                items: [
                    { name: '测试商品1', quantity: 2, price: 99.99 },
                    { name: '测试商品2', quantity: 1, price: 100.01 }
                ]
            },
            {
                id: 1002,
                orderNumber: 'ORD20250119001',
                createTime: '2025-01-19 15:20:00',
                status: ORDER_STATUS.PAID,
                totalAmount: 199.99,
                items: [
                    { name: '测试商品2', quantity: 1, price: 199.99 }
                ]
            },
            {
                id: 1003,
                orderNumber: 'ORD20250118001',
                createTime: '2025-01-18 09:15:00',
                status: ORDER_STATUS.SHIPPED,
                totalAmount: 399.98,
                items: [
                    { name: '测试商品1', quantity: 4, price: 99.99 }
                ]
            },
            {
                id: 1004,
                orderNumber: 'ORD20250117001',
                createTime: '2025-01-17 14:45:00',
                status: ORDER_STATUS.COMPLETED,
                totalAmount: 599.97,
                items: [
                    { name: '测试商品1', quantity: 3, price: 99.99 },
                    { name: '测试商品2', quantity: 3, price: 100.00 }
                ]
            }
        ];
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
                                    <h4>${escapeHtml(item.name)}</h4>
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
                actions.push(`<button class="btn btn-primary btn-small" onclick="ProfileService.payOrder(${order.id})">💳 立即支付</button>`);
                actions.push(`<button class="btn btn-small" onclick="ProfileService.cancelOrder(${order.id})">取消订单</button>`);
                break;
            case ORDER_STATUS.PAID:
                actions.push(`<button class="btn btn-small" onclick="showMessage('商家正在备货中...', 'success')">📦 查看物流</button>`);
                break;
            case ORDER_STATUS.SHIPPED:
                actions.push(`<button class="btn btn-primary btn-small" onclick="ProfileService.confirmReceipt(${order.id})">✅ 确认收货</button>`);
                actions.push(`<button class="btn btn-small" onclick="showMessage('物流信息功能开发中...', 'success')">📦 查看物流</button>`);
                break;
            case ORDER_STATUS.COMPLETED:
                actions.push(`<button class="btn btn-small" onclick="showMessage('评价功能开发中...', 'success')">⭐ 评价</button>`);
                actions.push(`<button class="btn btn-small" onclick="showMessage('再次购买功能开发中...', 'success')">🔄 再次购买</button>`);
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
            showMessage('支付成功！订单已提交给商家 🎉', 'success');
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
            showMessage('确认收货成功！感谢您的购买 🎉', 'success');
            setTimeout(() => {
                this.loadOrders(Store.getOrderFilter());
            }, 1500);
        }
    }
};

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