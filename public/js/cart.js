// 购物车服务模块

const CartService = {
    // 加载购物车
    loadCart() {
        const container = document.getElementById('cartItems');
        const totalElement = document.getElementById('totalPrice');
        const totalSection = document.getElementById('cartTotalSection');

        if (!container) return;

        const cart = Store.getCart();

        if (cart.length === 0) {
            container.innerHTML = '<p class="empty-cart">购物车空空如也，快去选购商品吧！</p>';
            if (totalSection) totalSection.style.display = 'none';
            return;
        }

        let total = 0;
        container.innerHTML = cart.map(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            return `
                <div class="cart-item">
                    <div>
                        <h3>${escapeHtml(item.name)}</h3>
                        <p style="color: var(--text-secondary);">单价: ¥${item.price.toFixed(2)} × ${item.quantity} 件</p>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px;">
                        <strong>¥${itemTotal.toFixed(2)}</strong>
                        <button class="btn" onclick="CartService.removeFromCart(${item.id})" style="background:#ff4d4f;color:white;">🗑️ 删除</button>
                    </div>
                </div>
            `;
        }).join('');

        if (totalElement) totalElement.textContent = total.toFixed(2);
        if (totalSection) totalSection.style.display = 'block';
    },

    // 从购物车移除
    removeFromCart(id) {
        if (confirm('确定要删除这件商品吗？')) {
            Store.removeFromCart(id);
            this.loadCart();
            showMessage('已从购物车移除', 'success');
        }
    },

    // 结算
    checkout() {
        const cart = Store.getCart();

        if (cart.length === 0) {
            showMessage('购物车是空的', 'error');
            return;
        }

        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        if (confirm(`确认支付 ¥${total.toFixed(2)} 吗？`)) {
            showMessage('订单提交成功！感谢您的购买 🎉', 'success');
            Store.clearCart();
            this.loadCart();

            // 2秒后跳转到首页
            setTimeout(() => {
                Router.navigate('home');
            }, 2000);
        }
    }
};

// 向后兼容的全局函数
function removeFromCart(id) {
    CartService.removeFromCart(id);
}

function checkout() {
    CartService.checkout();
}