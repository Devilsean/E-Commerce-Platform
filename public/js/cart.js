// ==================== 购物车模块 ====================
const CartService = {
    cart: JSON.parse(localStorage.getItem('cart') || '[]'),

    // 渲染购物车页面
    renderCart() {
        const content = document.getElementById('main-content');

        if (this.cart.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🛒</div>
                    <h3>购物车是空的</h3>
                    <p>快去挑选心仪的商品吧</p>
                    <button class="btn btn-primary btn-lg" onclick="window.location.hash='/'">
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
                        <button class="btn btn-primary btn-lg btn-block" onclick="CartService.checkout()">
                            💳 立即结算
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
                utils.showToast('✅ 已加入购物车', 'success');
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

    // 结算
    checkout() {
        const user = utils.getUserInfo();
        if (!user) {
            utils.showToast('请先登录', 'warning');
            window.location.hash = '/login';
            return;
        }

        utils.showToast('订单已提交（演示功能）', 'success');
        this.cart = [];
        this.saveCart();
        this.updateCartCount();
        window.location.hash = '/profile';
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