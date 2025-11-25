// ==================== 商家订单管理模块 ====================
const MerchantService = {
    currentOrderStatus: null,

    /**
     * 加载商家订单列表
     */
    async loadMerchantOrders(status = null) {
        const container = document.getElementById('merchant-orders-list');
        if (!container) return;

        container.innerHTML = '<div class="loading-text">加载中...</div>';

        try {
            const url = status !== null ? `/merchant/orders?status=${status}` : '/merchant/orders';
            const orders = await utils.request(url);

            if (!orders || orders.length === 0) {
                container.innerHTML = `
                    <div class="empty-state-small">
                        <div class="empty-icon-small">📦</div>
                        <p>暂无订单</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = orders.map(order => this.renderMerchantOrderCard(order)).join('');
        } catch (error) {
            console.error('Load merchant orders error:', error);
            container.innerHTML = '<div class="error">加载订单失败</div>';
        }
    },

    /**
     * 渲染商家订单卡片
     */
    renderMerchantOrderCard(order) {
        const statusClass = this.getOrderStatusClass(order.status);
        const statusText = order.statusText || this.getOrderStatusText(order.status);

        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <span class="order-no">订单号: ${order.orderNo}</span>
                        <span class="order-time">${this.formatDateTime(order.createTime)}</span>
                    </div>
                    <span class="order-status status-${statusClass}">${statusText}</span>
                </div>
                
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <div class="item-info">
                                <span class="item-name">${item.productName || '商品'}</span>
                                <span class="item-spec">¥${item.price} × ${item.quantity}</span>
                            </div>
                            <div class="item-total">¥${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="order-footer">
                    <div class="order-address">
                        <div class="address-label">
                            <svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-location"></use></svg>
                            收货信息
                        </div>
                        <div class="address-detail">
                            ${order.receiverName} ${order.receiverPhone}<br>
                            ${order.receiverAddress}
                        </div>
                    </div>
                    
                    <div class="order-summary">
                        <div class="summary-row">
                            <span>订单金额：</span>
                            <span class="amount">¥${order.actualAmount || order.totalAmount}</span>
                        </div>
                        <div class="order-actions">
                            ${this.renderOrderActions(order)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 渲染订单操作按钮
     */
    renderOrderActions(order) {
        const actions = [];

        // 已支付状态可以发货
        if (order.status === 1) {
            actions.push(`
                <button class="btn btn-sm btn-primary" onclick="MerchantService.showShipModal(${order.id}, '${order.orderNo}')">
                    <svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-truck"></use></svg>
                    发货
                </button>
            `);
        }

        // 已发货状态显示物流信息
        if (order.status === 3 && order.logisticsCompany) {
            actions.push(`
                <button class="btn btn-sm btn-outline" onclick="MerchantService.showLogisticsInfo('${order.logisticsCompany}', '${order.logisticsNo}')">
                    <svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-info"></use></svg>
                    物流信息
                </button>
            `);
        }

        // 查看详情
        actions.push(`
            <button class="btn btn-sm btn-outline" onclick="MerchantService.showOrderDetail(${order.id})">
                <svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-eye"></use></svg>
                详情
            </button>
        `);

        return actions.join('');
    },

    /**
     * 显示发货模态框
     */
    showShipModal(orderId, orderNo) {
        const modal = document.createElement('div');
        modal.id = 'shipModal';
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>
                        <svg width="24" height="24" class="icon" aria-hidden="true"><use xlink:href="#icon-truck"></use></svg>
                        订单发货
                    </h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <form id="shipForm" onsubmit="MerchantService.handleShipOrder(event, ${orderId})">
                    <div class="modal-body">
                        <div class="form-group">
                            <label>订单号</label>
                            <input type="text" value="${orderNo}" disabled class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <span class="label-required">*</span>
                                物流公司
                            </label>
                            <select name="logisticsCompany" required class="form-input">
                                <option value="">请选择物流公司</option>
                                <option value="顺丰速运">顺丰速运</option>
                                <option value="中通快递">中通快递</option>
                                <option value="圆通速递">圆通速递</option>
                                <option value="申通快递">申通快递</option>
                                <option value="韵达快递">韵达快递</option>
                                <option value="百世快递">百世快递</option>
                                <option value="邮政EMS">邮政EMS</option>
                                <option value="京东物流">京东物流</option>
                                <option value="德邦快递">德邦快递</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <span class="label-required">*</span>
                                物流单号
                            </label>
                            <input type="text" name="logisticsNo" required 
                                   placeholder="请输入物流单号" class="form-input">
                        </div>
                        
                        <div class="form-tips">
                            <p>💡 提示：请确认物流信息准确无误后再提交</p>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                        <button type="submit" class="btn btn-primary">确认发货</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    /**
     * 处理发货操作
     */
    async handleShipOrder(event, orderId) {
        event.preventDefault();
        const form = event.target;
        const data = {
            logisticsCompany: form.logisticsCompany.value,
            logisticsNo: form.logisticsNo.value
        };

        utils.showLoading();
        try {
            await utils.request(`/merchant/orders/${orderId}/ship`, {
                method: 'POST',
                body: JSON.stringify(data)
            });

            utils.showToast('发货成功', 'success');
            document.getElementById('shipModal').remove();

            // 重新加载订单列表
            this.loadMerchantOrders(this.currentOrderStatus);
        } catch (error) {
            console.error('Ship order error:', error);
        } finally {
            utils.showLoading(false);
        }
    },

    /**
     * 显示物流信息
     */
    showLogisticsInfo(company, trackingNo) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>
                        <svg width="24" height="24" class="icon" aria-hidden="true"><use xlink:href="#icon-truck"></use></svg>
                        物流信息
                    </h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="logistics-info">
                        <div class="info-row">
                            <span class="info-label">物流公司：</span>
                            <span class="info-value">${company}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">物流单号：</span>
                            <span class="info-value">${trackingNo}</span>
                        </div>
                    </div>
                    <div class="form-tips">
                        <p>💡 提示：您可以在物流公司官网查询详细物流信息</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    /**
     * 显示订单详情
     */
    async showOrderDetail(orderId) {
        utils.showLoading();
        try {
            const orders = await utils.request('/merchant/orders');
            const order = orders.find(o => o.id === orderId);

            if (!order) {
                utils.showToast('订单不存在', 'error');
                return;
            }

            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'flex';
            modal.innerHTML = `
                <div class="modal-content modal-large">
                    <div class="modal-header">
                        <h3>
                            <svg width="24" height="24" class="icon" aria-hidden="true"><use xlink:href="#icon-order"></use></svg>
                            订单详情
                        </h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="order-detail-section">
                            <h4>订单信息</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">订单号：</span>
                                    <span class="detail-value">${order.orderNo}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">订单状态：</span>
                                    <span class="detail-value status-${this.getOrderStatusClass(order.status)}">
                                        ${order.statusText || this.getOrderStatusText(order.status)}
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">下单时间：</span>
                                    <span class="detail-value">${this.formatDateTime(order.createTime)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">订单金额：</span>
                                    <span class="detail-value amount">¥${order.actualAmount || order.totalAmount}</span>
                                </div>
                            </div>
                        </div>

                        <div class="order-detail-section">
                            <h4>收货信息</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">收货人：</span>
                                    <span class="detail-value">${order.receiverName}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">联系电话：</span>
                                    <span class="detail-value">${order.receiverPhone}</span>
                                </div>
                                <div class="detail-item full-width">
                                    <span class="detail-label">收货地址：</span>
                                    <span class="detail-value">${order.receiverAddress}</span>
                                </div>
                            </div>
                        </div>

                        ${order.logisticsCompany ? `
                            <div class="order-detail-section">
                                <h4>物流信息</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <span class="detail-label">物流公司：</span>
                                        <span class="detail-value">${order.logisticsCompany}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">物流单号：</span>
                                        <span class="detail-value">${order.logisticsNo}</span>
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        <div class="order-detail-section">
                            <h4>商品清单</h4>
                            <div class="order-items-detail">
                                ${order.items.map(item => `
                                    <div class="order-item-detail">
                                        <div class="item-info">
                                            <div class="item-name">${item.productName || '商品'}</div>
                                            <div class="item-spec">¥${item.price} × ${item.quantity}</div>
                                        </div>
                                        <div class="item-total">¥${(item.price * item.quantity).toFixed(2)}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="this.closest('.modal').remove()">关闭</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } catch (error) {
            console.error('Load order detail error:', error);
        } finally {
            utils.showLoading(false);
        }
    },

    /**
     * 筛选订单
     */
    filterMerchantOrders(status) {
        this.currentOrderStatus = status;

        // 更新标签激活状态
        document.querySelectorAll('.order-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');

        // 加载订单
        this.loadMerchantOrders(status);
    },

    /**
     * 获取订单状态文本
     */
    getOrderStatusText(status) {
        const statusMap = {
            0: '待支付',
            1: '已支付',
            2: '待发货',
            3: '已发货',
            4: '已完成',
            5: '已取消'
        };
        return statusMap[status] || '未知';
    },

    /**
     * 获取订单状态样式类
     */
    getOrderStatusClass(status) {
        const classMap = {
            0: 'pending',
            1: 'paid',
            2: 'processing',
            3: 'shipped',
            4: 'completed',
            5: 'cancelled'
        };
        return classMap[status] || 'unknown';
    },

    /**
     * 格式化日期时间
     */
    formatDateTime(dateTime) {
        if (!dateTime) return '-';
        const date = new Date(dateTime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    /**
     * 加载商家统计数据
     */
    async loadMerchantStats() {
        try {
            const stats = await utils.request('/merchant/stats');

            // 更新统计数据
            const statsContainer = document.getElementById('merchant-stats-grid');
            if (statsContainer) {
                statsContainer.innerHTML = `
                    <div class="stat-card">
                        <div class="stat-icon">📦</div>
                        <div class="stat-info">
                            <div class="stat-label">商品总数</div>
                            <div class="stat-value">${stats.totalProducts || 0}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-info">
                            <div class="stat-label">总销量</div>
                            <div class="stat-value">${stats.totalSales || 0}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">💰</div>
                        <div class="stat-info">
                            <div class="stat-label">总收入</div>
                            <div class="stat-value">¥${(stats.totalRevenue || 0).toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📊</div>
                        <div class="stat-info">
                            <div class="stat-label">库存总量</div>
                            <div class="stat-value">${stats.totalStock || 0}</div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Load merchant stats error:', error);
        }
    }
};