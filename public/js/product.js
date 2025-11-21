// 商品服务模块

const ProductService = {
    currentProduct: null,

    // 加载商品列表
    async loadProducts() {
        const container = document.getElementById('homeProducts') || document.getElementById('productsList');
        if (!container) return;

        container.innerHTML = '<div class="loading">加载中...</div>';

        try {
            const response = await fetch(`${CONFIG.API_BASE}/guest/products`);
            const data = await response.json();

            if (data.code === 200 && data.data && data.data.length > 0) {
                this.displayProducts(data.data, container);
            } else {
                container.innerHTML = '<p class="empty-cart">暂无商品</p>';
            }
        } catch (error) {
            container.innerHTML = '<p class="empty-cart">加载失败，请刷新重试</p>';
        }
    },

    // 显示商品列表
    displayProducts(products, container) {
        container.innerHTML = products.map(product => `
            <div class="product-card" onclick="ProductService.showProductDetail(${product.id}, '${escapeHtml(product.name)}', ${product.price}, '${escapeHtml(product.description || '优质商品，品质保证')}', ${product.stock || 100})">
                <div class="product-image">
                    ${product.image_url ? `<img src="${product.image_url}" alt="${escapeHtml(product.name)}" style="width:100%;height:100%;object-fit:cover;">` : '📦'}
                </div>
                <div>
                    <div class="product-name">${escapeHtml(product.name)}</div>
                    <div class="product-price">¥${product.price}</div>
                    <button class="btn btn-primary btn-block" onclick="event.stopPropagation(); ProductService.addToCart(${product.id}, '${escapeHtml(product.name)}', ${product.price})">
                        🛒 加入购物车
                    </button>
                </div>
            </div>
        `).join('');
    },

    // 显示商品详情
    showProductDetail(id, name, price, description, stock) {
        this.currentProduct = { id, name, price, description, stock };

        document.getElementById('detailName').textContent = name;
        document.getElementById('detailPrice').textContent = price;
        document.getElementById('detailDescription').textContent = description;
        document.getElementById('detailStock').textContent = stock;
        document.getElementById('buyQuantity').value = 1;

        Router.navigate('detail');
    },

    // 修改购买数量
    changeQuantity(delta) {
        const input = document.getElementById('buyQuantity');
        const currentValue = parseInt(input.value) || 1;
        const newValue = currentValue + delta;

        if (newValue >= 1 && newValue <= (this.currentProduct?.stock || 100)) {
            input.value = newValue;
        }
    },

    // 从详情页加入购物车
    addToCartFromDetail() {
        if (!this.currentProduct) return;

        const quantity = parseInt(document.getElementById('buyQuantity').value) || 1;

        if (!Auth.isLoggedIn()) {
            showMessage('请先登录', 'error');
            Router.navigate('login');
            return;
        }

        Store.addToCart({
            id: this.currentProduct.id,
            name: this.currentProduct.name,
            price: this.currentProduct.price,
            quantity: quantity
        });

        showMessage(`已添加 ${quantity} 件商品到购物车`, 'success');
    },

    // 添加到购物车
    addToCart(id, name, price) {
        if (!Auth.isLoggedIn()) {
            showMessage('请先登录', 'error');
            Router.navigate('login');
            return;
        }

        Store.addToCart({ id, name, price, quantity: 1 });
        showMessage('已添加到购物车', 'success');
    }
};

// 向后兼容的全局函数
function showProductDetail(id, name, price, description, stock) {
    ProductService.showProductDetail(id, name, price, description, stock);
}

function changeQuantity(delta) {
    ProductService.changeQuantity(delta);
}

function addToCartFromDetail() {
    ProductService.addToCartFromDetail();
}

function addToCart(id, name, price) {
    ProductService.addToCart(id, name, price);
}