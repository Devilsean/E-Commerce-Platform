// 订单服务模块

const OrderService = {
    /**
     * 创建订单
     */
    async createOrder(orderData) {
        const token = utils.getToken();
        if (!token) {
            utils.showToast('请先登录', 'warning');
            return null;
        }

        try {
            const response = await fetch(`${API_BASE}/user/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();

            if (data.code === 200) {
                utils.showToast('订单创建成功', 'success');
                return data.data;
            } else {
                utils.showToast(data.message || '订单创建失败', 'error');
                return null;
            }
        } catch (error) {
            console.error('Create order error:', error);
            utils.showToast('订单创建失败', 'error');
            return null;
        }
    },

    /**
     * 获取订单列表（支持高级筛选）
     */
    async getOrders(status = null, filters = {}) {
        const token = utils.getToken();
        if (!token) {
            utils.showToast('请先登录', 'warning');
            return [];
        }

        try {
            let url = `${API_BASE}/user/orders`;
            const params = new URLSearchParams();

            if (status !== null) {
                params.append('status', status);
            }

            // 添加高级筛选参数
            if (filters.startDate) {
                params.append('startDate', filters.startDate);
            }
            if (filters.endDate) {
                params.append('endDate', filters.endDate);
            }
            if (filters.minAmount) {
                params.append('minAmount', filters.minAmount);
            }
            if (filters.maxAmount) {
                params.append('maxAmount', filters.maxAmount);
            }
            if (filters.keyword) {
                params.append('keyword', filters.keyword);
            }

            const queryString = params.toString();
            if (queryString) {
                url += `?${queryString}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.code === 200) {
                return data.data || [];
            } else {
                utils.showToast(data.message || '获取订单失败', 'error');
                return [];
            }
        } catch (error) {
            console.error('Get orders error:', error);
            utils.showToast('获取订单失败', 'error');
            return [];
        }
    },

    /**
     * 获取订单统计信息
     */
    async getOrderStatistics() {
        const token = utils.getToken();
        if (!token) {
            return null;
        }

        try {
            const response = await fetch(`${API_BASE}/user/orders/statistics`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.code === 200) {
                return data.data;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Get order statistics error:', error);
            return null;
        }
    },

    /**
     * 获取订单详情
     */
    async getOrderDetail(orderId) {
        const token = utils.getToken();
        if (!token) {
            utils.showToast('请先登录', 'warning');
            return null;
        }

        try {
            const response = await fetch(`${API_BASE}/user/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.code === 200) {
                return data.data;
            } else {
                utils.showToast(data.message || '获取订单详情失败', 'error');
                return null;
            }
        } catch (error) {
            console.error('Get order detail error:', error);
            utils.showToast('获取订单详情失败', 'error');
            return null;
        }
    },

    /**
     * 支付订单
     */
    async payOrder(orderId, paymentType = 1) {
        const token = utils.getToken();
        if (!token) {
            utils.showToast('请先登录', 'warning');
            return false;
        }

        try {
            const response = await fetch(`${API_BASE}/user/orders/${orderId}/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ paymentType })
            });

            const data = await response.json();

            if (data.code === 200) {
                utils.showToast('支付成功', 'success');
                return true;
            } else {
                utils.showToast(data.message || '支付失败', 'error');
                return false;
            }
        } catch (error) {
            console.error('Pay order error:', error);
            utils.showToast('支付失败', 'error');
            return false;
        }
    },

    /**
     * 取消订单
     */
    async cancelOrder(orderId) {
        const token = utils.getToken();
        if (!token) {
            utils.showToast('请先登录', 'warning');
            return false;
        }

        if (!confirm('确定要取消该订单吗？')) {
            return false;
        }

        try {
            const response = await fetch(`${API_BASE}/user/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.code === 200) {
                utils.showToast('订单已取消', 'success');
                return true;
            } else {
                utils.showToast(data.message || '取消失败', 'error');
                return false;
            }
        } catch (error) {
            console.error('Cancel order error:', error);
            utils.showToast('取消失败', 'error');
            return false;
        }
    },

    /**
     * 确认收货
     */
    async confirmOrder(orderId) {
        const token = utils.getToken();
        if (!token) {
            utils.showToast('请先登录', 'warning');
            return false;
        }

        if (!confirm('确认已收到货物吗？')) {
            return false;
        }

        try {
            const response = await fetch(`${API_BASE}/user/orders/${orderId}/confirm`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.code === 200) {
                utils.showToast('确认收货成功', 'success');
                return true;
            } else {
                utils.showToast(data.message || '确认失败', 'error');
                return false;
            }
        } catch (error) {
            console.error('Confirm order error:', error);
            utils.showToast('确认失败', 'error');
            return false;
        }
    },

    /**
     * 删除订单
     */
    async deleteOrder(orderId) {
        const token = utils.getToken();
        if (!token) {
            utils.showToast('请先登录', 'warning');
            return false;
        }

        if (!confirm('确定要删除该订单吗？')) {
            return false;
        }

        try {
            const response = await fetch(`${API_BASE}/user/orders/${orderId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.code === 200) {
                utils.showToast('删除成功', 'success');
                return true;
            } else {
                utils.showToast(data.message || '删除失败', 'error');
                return false;
            }
        } catch (error) {
            console.error('Delete order error:', error);
            utils.showToast('删除失败', 'error');
            return false;
        }
    },

    /**
     * 渲染订单列表
     */
    renderOrderList(orders, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <div class="empty-icon-small"><svg width="56" height="56" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg></div>
                    <p>暂无订单</p>
                    <button class="btn btn-primary" onclick="app.router.navigate('/')">去购物</button>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <span class="order-no">订单号：${order.orderNo}</span>
                        <span class="order-time">${this.formatDate(order.createTime)}</span>
                    </div>
                    <span class="order-status status-${order.status}">${order.statusText}</span>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <div class="order-item-image">
                                ${item.productImage ? `<img src="${item.productImage}" alt="${item.productName}">` : '<svg width="40" height="40" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg>'}
                            </div>
                            <div class="order-item-info">
                                <h4>${item.productName}</h4>
                                <p>¥${item.price} × ${item.quantity}</p>
                            </div>
                            <div class="order-item-subtotal">
                                ¥${item.subtotal}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="order-footer">
                    <div class="order-total">
                        <span>订单总额：</span>
                        <span class="order-amount">¥${order.totalAmount}</span>
                    </div>
                    <div class="order-actions">
                        ${this.renderOrderActions(order)}
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * 渲染订单操作按钮
     */
    renderOrderActions(order) {
        const actions = [];

        // 查看详情
        actions.push(`<button class="btn btn-sm" onclick="OrderService.showOrderDetail(${order.id})">查看详情</button>`);

        // 根据订单状态显示不同操作
        switch (order.status) {
            case 0: // 待支付
                actions.push(`<button class="btn btn-sm btn-primary" onclick="OrderService.handlePayOrder(${order.id})">立即支付</button>`);
                actions.push(`<button class="btn btn-sm btn-secondary" onclick="OrderService.handleCancelOrder(${order.id})">取消订单</button>`);
                break;
            case 3: // 已发货
                actions.push(`<button class="btn btn-sm btn-success" onclick="OrderService.handleConfirmOrder(${order.id})">确认收货</button>`);
                break;
            case 4: // 已完成
                actions.push(`<button class="btn btn-sm" onclick="OrderService.handleDeleteOrder(${order.id})">删除订单</button>`);
                break;
            case 5: // 已取消
                actions.push(`<button class="btn btn-sm" onclick="OrderService.handleDeleteOrder(${order.id})">删除订单</button>`);
                break;
        }

        return actions.join('');
    },

    /**
     * 显示订单详情
     */
    async showOrderDetail(orderId) {
        const order = await this.getOrderDetail(orderId);
        if (!order) return;

        const modal = document.createElement('div');
        modal.id = 'orderDetailModal';
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-order"></use></svg> 订单详情</h3>
                    <button class="modal-close" onclick="document.getElementById('orderDetailModal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="order-detail-section">
                        <h4>订单信息</h4>
                        <div class="detail-row">
                            <span class="detail-label">订单号：</span>
                            <span class="detail-value">${order.orderNo}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">订单状态：</span>
                            <span class="detail-value status-${order.status}">${order.statusText}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">下单时间：</span>
                            <span class="detail-value">${this.formatDateTime(order.createTime)}</span>
                        </div>
                        ${order.paymentTime ? `
                            <div class="detail-row">
                                <span class="detail-label">支付时间：</span>
                                <span class="detail-value">${this.formatDateTime(order.paymentTime)}</span>
                            </div>
                        ` : ''}
                        ${order.deliveryTime ? `
                            <div class="detail-row">
                                <span class="detail-label">发货时间：</span>
                                <span class="detail-value">${this.formatDateTime(order.deliveryTime)}</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="order-detail-section">
                        <h4>收货信息</h4>
                        <div class="detail-row">
                            <span class="detail-label">收货人：</span>
                            <span class="detail-value">${order.receiverName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">联系电话：</span>
                            <span class="detail-value">${order.receiverPhone}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">收货地址：</span>
                            <span class="detail-value">${order.receiverAddress}</span>
                        </div>
                        ${order.logisticsCompany ? `
                            <div class="detail-row">
                                <span class="detail-label">物流公司：</span>
                                <span class="detail-value">${order.logisticsCompany}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">物流单号：</span>
                                <span class="detail-value">${order.logisticsNo}</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="order-detail-section">
                        <h4>商品清单</h4>
                        <div class="order-items-detail">
                            ${order.items.map(item => `
                                <div class="order-item-detail">
                                    <div class="item-image">
                                        ${item.productImage ? `<img src="${item.productImage}" alt="${item.productName}">` : '<svg width="40" height="40" class="icon" aria-hidden="true"><use xlink:href="#icon-box"></use></svg>'}
                                    </div>
                                    <div class="item-info">
                                        <h5>${item.productName}</h5>
                                        <p>¥${item.price} × ${item.quantity}</p>
                                    </div>
                                    <div class="item-subtotal">¥${item.subtotal}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="order-detail-section">
                        <div class="order-summary">
                            <div class="summary-row">
                                <span>商品总额：</span>
                                <span>¥${order.totalAmount}</span>
                            </div>
                            <div class="summary-row summary-total">
                                <span>实付金额：</span>
                                <span class="total-amount">¥${order.actualAmount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    /**
     * 处理支付订单
     */
    async handlePayOrder(orderId) {
        const success = await this.payOrder(orderId);
        if (success) {
            // 刷新订单列表
            if (window.app && window.app.currentOrderStatus !== undefined) {
                this.loadAndDisplayOrders(window.app.currentOrderStatus);
            }
        }
    },

    /**
     * 处理取消订单
     */
    async handleCancelOrder(orderId) {
        const success = await this.cancelOrder(orderId);
        if (success) {
            // 刷新订单列表
            if (window.app && window.app.currentOrderStatus !== undefined) {
                this.loadAndDisplayOrders(window.app.currentOrderStatus);
            }
        }
    },

    /**
     * 处理确认收货
     */
    async handleConfirmOrder(orderId) {
        const success = await this.confirmOrder(orderId);
        if (success) {
            // 刷新订单列表
            if (window.app && window.app.currentOrderStatus !== undefined) {
                this.loadAndDisplayOrders(window.app.currentOrderStatus);
            }
        }
    },

    /**
     * 处理删除订单
     */
    async handleDeleteOrder(orderId) {
        const success = await this.deleteOrder(orderId);
        if (success) {
            // 刷新订单列表
            if (window.app && window.app.currentOrderStatus !== undefined) {
                this.loadAndDisplayOrders(window.app.currentOrderStatus);
            }
        }
    },

    /**
     * 加载并显示订单列表
     */
    async loadAndDisplayOrders(status = null, filters = {}) {
        const orders = await this.getOrders(status, filters);
        this.renderOrderList(orders, 'ordersList');
    },

    /**
     * 显示高级筛选对话框
     */
    showAdvancedFilter() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-filter"></use></svg> 高级筛选</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <form onsubmit="OrderService.handleAdvancedFilter(event)">
                    <div class="form-group">
                        <label>关键词搜索</label>
                        <input type="text" name="keyword" class="form-input" placeholder="订单号、收货人姓名或电话">
                    </div>
                    <div class="form-group">
                        <label>日期范围</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <input type="date" name="startDate" class="form-input" placeholder="开始日期">
                            <input type="date" name="endDate" class="form-input" placeholder="结束日期">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>金额范围</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <input type="number" name="minAmount" class="form-input" placeholder="最低金额" step="0.01" min="0">
                            <input type="number" name="maxAmount" class="form-input" placeholder="最高金额" step="0.01" min="0">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                        <button type="button" class="btn" onclick="OrderService.resetFilter(); this.closest('.modal').remove();">重置</button>
                        <button type="submit" class="btn btn-primary">应用筛选</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    /**
     * 处理高级筛选
     */
    async handleAdvancedFilter(event) {
        event.preventDefault();
        const form = event.target;

        const filters = {
            keyword: form.keyword.value.trim(),
            startDate: form.startDate.value,
            endDate: form.endDate.value,
            minAmount: form.minAmount.value,
            maxAmount: form.maxAmount.value
        };

        // 移除空值
        Object.keys(filters).forEach(key => {
            if (!filters[key]) {
                delete filters[key];
            }
        });

        // 保存筛选条件
        this.currentFilters = filters;

        // 关闭模态框
        form.closest('.modal').remove();

        // 重新加载订单
        if (window.app && window.app.currentOrderStatus !== undefined) {
            await this.loadAndDisplayOrders(window.app.currentOrderStatus, filters);
        } else {
            await this.loadAndDisplayOrders(null, filters);
        }

        utils.showToast('筛选已应用', 'success');
    },

    /**
     * 重置筛选
     */
    async resetFilter() {
        this.currentFilters = {};
        if (window.app && window.app.currentOrderStatus !== undefined) {
            await this.loadAndDisplayOrders(window.app.currentOrderStatus);
        } else {
            await this.loadAndDisplayOrders();
        }
        utils.showToast('筛选已重置', 'success');
    },

    /**
     * 格式化日期
     */
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    },

    /**
     * 格式化日期时间
     */
    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN');
    }
};