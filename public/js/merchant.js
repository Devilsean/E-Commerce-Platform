// 商家服务模块

const MerchantService = {
    // 加载商家商品列表
    async loadMerchantProducts() {
        const container = document.getElementById('merchantProductsList');
        if (!container) return;

        container.innerHTML = '<div class="loading">正在加载商品数据</div>';

        try {
            const response = await fetch(`${CONFIG.API_BASE}/merchant/products`, {
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });
            const data = await response.json();

            if (data.code === 200 && data.data) {
                this.displayMerchantProducts(data.data);
                this.updateMerchantStats(data.data);
            } else {
                container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">暂无商品</div></div>';
            }
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">加载失败，请刷新重试</div></div>';
        }
    },

    // 显示商家商品列表
    displayMerchantProducts(products) {
        const container = document.getElementById('merchantProductsList');

        if (products.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">暂无商品，点击上方按钮添加商品</div></div>';
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>商品名称</th>
                        <th>价格</th>
                        <th>库存</th>
                        <th>销量</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td>${product.id}</td>
                            <td>${escapeHtml(product.name)}</td>
                            <td>¥${product.price}</td>
                            <td>${product.stock || 0}</td>
                            <td>${product.sales || 0}</td>
                            <td>
                                <span class="badge ${product.status === 1 ? 'badge-success' : 'badge-danger'}">
                                    ${product.status === 1 ? '上架' : '下架'}
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-small btn-primary" onclick="MerchantService.editProduct(${product.id})">✏️ 编辑</button>
                                    <button class="btn btn-small ${product.status === 1 ? 'btn-warning' : 'btn-success'}" 
                                            onclick="MerchantService.toggleProductStatus(${product.id}, ${product.status})">
                                        ${product.status === 1 ? '下架' : '上架'}
                                    </button>
                                    <button class="btn btn-small btn-danger" onclick="MerchantService.deleteProduct(${product.id})">🗑️ 删除</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    // 更新商家统计数据
    updateMerchantStats(products) {
        const totalProducts = products.length;
        const totalSales = products.reduce((sum, p) => sum + (p.sales || 0), 0);
        const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);

        const elements = {
            totalProducts: document.getElementById('totalProducts'),
            totalSales: document.getElementById('totalSales'),
            totalStock: document.getElementById('totalStock')
        };
        if (elements.totalProducts) elements.totalProducts.textContent = totalProducts;
        if (elements.totalSales) elements.totalSales.textContent = totalSales;
        if (elements.totalStock) elements.totalStock.textContent = totalStock;
    },

    // 编辑商品
    async editProduct(productId) {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/merchant/products/${productId}`, {
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });
            const data = await response.json();

            if (data.code === 200 && data.data) {
                const product = data.data;

                // 填充表单
                document.getElementById('productId').value = product.id;
                document.getElementById('productName').value = product.name;
                document.getElementById('productPrice').value = product.price;
                document.getElementById('productOriginalPrice').value = product.originalPrice || '';
                document.getElementById('productStock').value = product.stock || 0;
                document.getElementById('productDescription').value = product.description || '';
                document.getElementById('productMainImage').value = product.mainImage || '';
                document.getElementById('productImages').value = product.images || '';
                document.getElementById('productStatus').value = product.status !== undefined ? product.status : 1;

                // 更新图片预览
                this.updateImagePreview();

                // 更新模态框标题
                document.getElementById('modalTitle').textContent = '✏️ 编辑商品';

                // 显示模态框
                document.getElementById('productModal').classList.add('active');
            } else {
                showMessage('获取商品信息失败', 'error');
            }
        } catch (error) {
            showMessage('网络错误，请稍后重试', 'error');
        }
    },

    // 更新图片预览
    updateImagePreview() {
        const mainImageUrl = document.getElementById('productMainImage').value.trim();
        const previewContainer = document.getElementById('mainImagePreview');

        if (mainImageUrl && previewContainer) {
            previewContainer.innerHTML = `
                <div class="image-preview-item">
                    <img src="${escapeHtml(mainImageUrl)}" alt="主图预览" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3E加载失败%3C/text%3E%3C/svg%3E'">
                </div>
            `;
        } else if (previewContainer) {
            previewContainer.innerHTML = '<div class="image-preview-placeholder">暂无图片</div>';
        }
    },

    // 切换商品状态
    async toggleProductStatus(productId, currentStatus) {
        const newStatus = currentStatus === 1 ? 0 : 1;
        const statusText = newStatus === 1 ? '上架' : '下架';

        if (!confirm(`确定要${statusText}该商品吗？`)) return;

        try {
            const response = await fetch(`${CONFIG.API_BASE}/merchant/products/${productId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await response.json();

            if (data.code === 200) {
                showMessage(`商品已${statusText}`, 'success');
                this.loadMerchantProducts();
            } else {
                showMessage(data.message || '操作失败', 'error');
            }
        } catch (error) {
            showMessage('网络错误，请稍后重试', 'error');
        }
    },

    // 删除商品
    async deleteProduct(productId) {
        if (!confirm('确定要删除该商品吗？此操作不可恢复！')) return;

        try {
            const response = await fetch(`${CONFIG.API_BASE}/merchant/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });
            const data = await response.json();

            if (data.code === 200) {
                showMessage('商品已删除', 'success');
                this.loadMerchantProducts();
            } else {
                showMessage(data.message || '删除失败', 'error');
            }
        } catch (error) {
            showMessage('网络错误，请稍后重试', 'error');
        }
    }
};

// 全局函数 - 显示添加商品模态框
function showAddProductModal() {
    // 清空表单
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';

    // 更新模态框标题
    document.getElementById('modalTitle').textContent = '➕ 添加商品';

    // 显示模态框
    document.getElementById('productModal').classList.add('active');
}

// 全局函数 - 保存商品
async function saveProduct(event) {
    event.preventDefault();

    const productId = document.getElementById('productId').value;
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);

    // 表单验证
    if (!name) {
        showMessage('请输入商品名称', 'error');
        return;
    }
    if (isNaN(price) || price <= 0) {
        showMessage('请输入有效的商品价格', 'error');
        return;
    }
    if (isNaN(stock) || stock < 0) {
        showMessage('请输入有效的库存数量', 'error');
        return;
    }

    const productData = {
        name: name,
        price: price,
        originalPrice: document.getElementById('productOriginalPrice').value ? parseFloat(document.getElementById('productOriginalPrice').value) : null,
        stock: stock,
        description: document.getElementById('productDescription').value.trim(),
        mainImage: document.getElementById('productMainImage').value.trim(),
        images: document.getElementById('productImages').value.trim(),
        status: parseInt(document.getElementById('productStatus').value)
    };

    try {
        const url = productId
            ? `${CONFIG.API_BASE}/merchant/products/${productId}`
            : `${CONFIG.API_BASE}/merchant/products`;

        const method = productId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify(productData)
        });

        const data = await response.json();

        if (data.code === 200) {
            showMessage(productId ? '商品更新成功' : '商品添加成功', 'success');
            closeProductModal();
            MerchantService.loadMerchantProducts();
        } else {
            showMessage(data.message || '操作失败', 'error');
        }
    } catch (error) {
        showMessage('网络错误，请稍后重试', 'error');
    }
}

// 全局函数 - 关闭模态框
function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('active');
}