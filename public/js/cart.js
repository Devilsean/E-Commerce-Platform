// ==================== 购物车模块 ====================
const CartService = {
    cart: JSON.parse(localStorage.getItem('cart') || '[]'),

    // 渲染购物车页面
    renderCart() {
        const content = document.getElementById('main-content');

        if (this.cart.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><svg width="96" height="96" class="icon" aria-hidden="true"><use xlink:href="#icon-cart"></use></svg></div>
                    <h3>购物车是空的</h3>
                    <p>快去挑选心仪的商品吧</p>
                    <button class="btn btn-primary btn-lg" onclick="window.location.hash='/'">
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
                        <button class="btn btn-sm" onclick="CartService.clearCart()">清空购物车</button>
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
                                    <button class="qty-btn" onclick="CartService.decreaseQuantity(${index})">-</button>
                                    <input type="number" value="${item.quantity}" min="1" max="99"
                                        onchange="CartService.updateQuantity(${index}, this.value)" 
                                        class="qty-input">
                                    <button class="qty-btn" onclick="CartService.increaseQuantity(${index})">+</button>
                                </div>
                            </div>
                            <div class="col-total">
                                <span class="price-bold">¥${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            <div class="col-action">
                                <button class="btn-link btn-danger" onclick="CartService.removeItem(${index})">
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
                        <button class="btn btn-primary btn-lg btn-block" onclick="CartService.checkout()">
                            <svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-credit-card"></use></svg> 立即结算
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // 添加到购物车
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

            this.saveCart();
            this.updateCartCount();
        } catch (error) {
            console.error('Add to cart error:', error);
        }
    },

    // 增加数量
    increaseQuantity(index) {
        if (this.cart[index].quantity < 99) {
            this.cart[index].quantity++;
            this.saveCart();
            this.renderCart();
            this.updateCartCount();
        }
    },

    // 减少数量
    decreaseQuantity(index) {
        if (this.cart[index].quantity > 1) {
            this.cart[index].quantity--;
            this.saveCart();
            this.renderCart();
            this.updateCartCount();
        }
    },

    // 更新数量
    updateQuantity(index, quantity) {
        const qty = parseInt(quantity);
        if (qty > 0 && qty <= 99) {
            this.cart[index].quantity = qty;
            this.saveCart();
            this.renderCart();
            this.updateCartCount();
        }
    },

    // 移除商品
    removeItem(index) {
        if (confirm('确定要删除此商品吗？')) {
            this.cart.splice(index, 1);
            this.saveCart();
            this.renderCart();
            this.updateCartCount();
            utils.showToast('已移除', 'success');
        }
    },

    // 清空购物车
    clearCart() {
        if (confirm('确定要清空购物车吗？')) {
            this.cart = [];
            this.saveCart();
            this.renderCart();
            this.updateCartCount();
            utils.showToast('购物车已清空', 'success');
        }
    },

    // 结算 - 显示结算弹窗
    checkout() {
        const user = utils.getUserInfo();
        if (!user) {
            utils.showToast('请先登录', 'warning');
            window.location.hash = '/login';
            return;
        }

        if (this.cart.length === 0) {
            utils.showToast('购物车是空的', 'warning');
            return;
        }

        // 显示结算弹窗
        this.showCheckoutModal(user);
    },

    // 显示结算弹窗
    showCheckoutModal(user) {
        const total = this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'checkoutModal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-credit-card"></use></svg> 确认订单</h3>
                    <button class="modal-close" onclick="document.getElementById('checkoutModal').remove()">×</button>
                </div>
                <form id="checkoutForm" onsubmit="CartService.submitOrder(event)">
                    <div class="modal-body" style="padding: 20px; max-height: 60vh; overflow-y: auto;">
                        <!-- 订单商品摘要 -->
                        <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                            <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #666;">订单摘要</h4>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span>商品数量：</span>
                                <span>${itemCount} 件</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: var(--primary);">
                                <span>订单总额：</span>
                                <span>¥${total.toFixed(2)}</span>
                            </div>
                        </div>

                        <!-- 收货信息 -->
                        <div style="margin-bottom: 20px;">
                            <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #333;">
                                <svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-location"></use></svg>
                                收货信息
                            </h4>
                            <div class="form-group">
                                <label>收货人姓名 <span class="label-required">*</span></label>
                                <input type="text" name="receiverName" required class="form-input"
                                    placeholder="请输入收货人姓名" value="${user.nickname || user.username || ''}">
                            </div>
                            <div class="form-group">
                                <label>联系电话 <span class="label-required">*</span></label>
                                <input type="tel" name="receiverPhone" required pattern="[0-9]{11}" class="form-input"
                                    placeholder="请输入11位手机号" value="${user.phone || ''}">
                            </div>
                            <div class="form-group">
                                <label>收货地址 <span class="label-required">*</span></label>
                                <textarea name="receiverAddress" required rows="2" class="form-input"
                                    placeholder="请输入详细收货地址"></textarea>
                            </div>
                        </div>

                        <!-- 通知邮箱 -->
                        <div style="margin-bottom: 20px;">
                            <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #333;">
                                <svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-email"></use></svg>
                                订单通知
                            </h4>
                            <div class="form-group">
                                <label>
                                    通知邮箱 <span class="label-required">*</span>
                                    <span style="color: #f59e0b; font-size: 12px; margin-left: 8px;"> 用于接收订单状态通知</span>
                                </label>
                                <input type="email" name="notificationEmail" required class="form-input"
                                    placeholder="请输入邮箱地址" value="${user.email || ''}"
                                    style="${!user.email ? 'border-color: #f59e0b;' : ''}">
                                <div class="form-hint" style="color: #666; font-size: 12px; margin-top: 4px;">
                                     您将在支付成功和商家发货时收到邮件通知
                                </div>
                            </div>
                            ${!user.email ? `
                            <div style="background: #fef3c7; border-radius: 8px; padding: 12px; margin-top: 8px;">
                                <div style="display: flex; align-items: center; gap: 8px; color: #92400e; font-size: 13px;">
                                    <span></span>
                                    <span>您尚未在个人信息中设置邮箱，建议<a href="#/profile" style="color: var(--primary); text-decoration: underline;">前往设置</a>以便下次自动填充</span>
                                </div>
                            </div>
                            ` : ''}
                        </div>

                        <!-- 订单备注 -->
                        <div class="form-group">
                            <label>订单备注（选填）</label>
                            <textarea name="remark" rows="2" class="form-input"
                                placeholder="如有特殊要求，请在此备注"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer" style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('checkoutModal').remove()">取消</button>
                        <button type="submit" class="btn btn-primary">
                            <svg width="16" height="16" class="icon" aria-hidden="true"><use xlink:href="#icon-check"></use></svg>
                            提交订单
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    // 提交订单
    async submitOrder(event) {
        event.preventDefault();
        const form = event.target;

        // 获取表单数据
        const orderData = {
            items: this.cart.map(item => ({
                productId: item.id,
                quantity: item.quantity
            })),
            receiverName: form.receiverName.value.trim(),
            receiverPhone: form.receiverPhone.value.trim(),
            receiverAddress: form.receiverAddress.value.trim(),
            notificationEmail: form.notificationEmail.value.trim(),
            remark: form.remark.value.trim()
        };

        // 验证邮箱格式
        if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(orderData.notificationEmail)) {
            utils.showToast('请输入正确的邮箱格式', 'error');
            return;
        }

        // 验证手机号格式
        if (!/^1[3-9]\d{9}$/.test(orderData.receiverPhone)) {
            utils.showToast('请输入正确的手机号格式', 'error');
            return;
        }

        // 显示加载状态
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> 提交中...';
        submitBtn.disabled = true;

        try {
            // 调用订单创建API
            const result = await OrderService.createOrder(orderData);

            if (result) {
                // 关闭弹窗
                document.getElementById('checkoutModal').remove();

                // 清空购物车
                this.cart = [];
                this.saveCart();
                this.updateCartCount();

                // 显示成功提示
                utils.showToast(`订单创建成功！订单号：${result.orderNo}`, 'success');

                // 如果有通知邮箱，显示邮件提示
                if (result.notificationEmail) {
                    setTimeout(() => {
                        utils.showToast(`支付成功后将发送通知至 ${result.notificationEmail}`, 'info');
                    }, 1500);
                }

                // 跳转到订单页面
                setTimeout(() => {
                    window.location.hash = '/orders';
                }, 2000);
            }
        } catch (error) {
            console.error('Submit order error:', error);
            utils.showToast('订单提交失败，请重试', 'error');
        } finally {
            // 恢复按钮状态
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    },

    // 保存购物车
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    },

    // 更新购物车数量显示
    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = this.cart.length;
        }
    },

    // 获取购物车数量
    getCartCount() {
        return this.cart.length;
    }
};