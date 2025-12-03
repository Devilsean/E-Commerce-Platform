// ==================== 商品详情页模块 ====================

const ProductDetailService = {
    currentProduct: null,
    currentImages: [],
    currentImageIndex: 0,

    /**
     * 渲染商品详情页
     */
    async render(productId) {
        const content = document.getElementById('main-content');
        content.innerHTML = '<div class="loading-text">加载商品详情...</div>';

        try {
            // 获取商品详情
            const product = await utils.request(`/guest/product/${productId}`);
            this.currentProduct = product;

            // 记录浏览历史到本地存储
            if (typeof Store !== 'undefined') {
                Store.addBrowsingHistory(product);
            }

            // 记录浏览日志到数据库（如果用户已登录）
            this.logBrowseToServer(productId);

            // 处理图片数组
            this.currentImages = this.parseProductImages(product);
            this.currentImageIndex = 0;

            // 获取评论数据
            const reviewData = await this.loadReviews(productId);

            // 渲染页面
            content.innerHTML = this.buildDetailHTML(product, reviewData);

            // 初始化交互功能
            this.initInteractions();

        } catch (error) {
            content.innerHTML = `
                <div class="error-state">
                    <svg width="120" height="120" class="icon" aria-hidden="true"><use xlink:href="#icon-alert"></use></svg>
                    <h2>商品不存在</h2>
                    <p>该商品可能已下架或不存在</p>
                    <button class="btn btn-primary btn-lg" onclick="history.back()">
                        <svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-arrow-left"></use></svg>
                        返回上一页
                    </button>
                </div>
            `;
        }
    },

    /**
     * 解析商品图片
     */
    parseProductImages(product) {
        const images = [];

        // 添加主图
        if (product.main_image || product.mainImage) {
            images.push(product.main_image || product.mainImage);
        }

        // 添加其他图片
        if (product.images) {
            try {
                const additionalImages = JSON.parse(product.images);
                if (Array.isArray(additionalImages)) {
                    images.push(...additionalImages.filter(img => img && img.trim()));
                }
            } catch (e) {
                // 如果不是JSON，尝试按逗号分割
                const additionalImages = product.images.split(',')
                    .map(img => img.trim())
                    .filter(img => img);
                images.push(...additionalImages);
            }
        }

        return images.length > 0 ? images : null;
    },

    /**
     * 加载评论数据
     */
    async loadReviews(productId) {
        try {
            const data = await utils.request(`/guest/product/${productId}/reviews?page=1&size=5`);
            return data || { reviews: [], total: 0, stats: {} };
        } catch (error) {
            return { reviews: [], total: 0, stats: {} };
        }
    },

    /**
     * 构建详情页HTML
     */
    buildDetailHTML(product, reviewData) {
        const hasDiscount = product.original_price && product.original_price > product.price;
        const discountPercent = hasDiscount ?
            Math.round((1 - product.price / product.original_price) * 100) : 0;

        return `
            <div class="product-detail-page">
                <!-- 面包屑导航 -->
                <div class="detail-breadcrumb">
                    <button class="btn-text" onclick="history.back()">
                        <svg width="16" height="16" class="icon"><use xlink:href="#icon-arrow-left"></use></svg>
                        返回
                    </button>
                    <span class="breadcrumb-separator">/</span>
                    <span class="breadcrumb-current">${product.category_name || '商品详情'}</span>
                </div>

                <!-- 主要内容区 -->
                <div class="detail-main-container">
                    <!-- 左侧：滚动区域（图片+标签页） -->
                    <div class="detail-left-section">
                        <!-- 图片展示区 -->
                        <div class="detail-gallery">
                            ${this.buildGalleryHTML()}
                        </div>

                        <!-- 详情标签页 -->
                        <div class="detail-tabs-section">
                            <div class="tabs-nav-modern">
                                <button class="tab-nav-btn active" data-tab="details">
                                    <svg width="18" height="18" class="icon"><use xlink:href="#icon-order"></use></svg>
                                    商品详情
                                </button>
                                <button class="tab-nav-btn" data-tab="specs">
                                    <svg width="18" height="18" class="icon"><use xlink:href="#icon-note"></use></svg>
                                    规格参数
                                </button>
                                <button class="tab-nav-btn" data-tab="reviews">
                                    <svg width="18" height="18" class="icon"><use xlink:href="#icon-star"></use></svg>
                                    用户评价 (${reviewData.total || 0})
                                </button>
                            </div>

                            <div class="tabs-content-modern">
                                <!-- 商品详情 -->
                                <div class="tab-panel active" data-panel="details">
                                    ${this.buildDetailsTabHTML(product)}
                                </div>

                                <!-- 规格参数 -->
                                <div class="tab-panel" data-panel="specs">
                                    ${this.buildSpecsTabHTML(product)}
                                </div>

                                <!-- 用户评价 -->
                                <div class="tab-panel" data-panel="reviews">
                                    ${this.buildReviewsTabHTML(reviewData, product.id)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 右侧：固定商品信息区 -->
                    <div class="detail-info-panel">
                        <!-- 商品标题 -->
                        <h1 class="detail-product-title">${product.name}</h1>

                        <!-- 商品标签 -->
                        <div class="detail-tags">
                            ${product.sales > 100 ? '<span class="tag tag-hot">热销</span>' : ''}
                            ${hasDiscount ? '<span class="tag tag-discount">限时优惠</span>' : ''}
                            ${product.stock < 10 ? '<span class="tag tag-warning">库存紧张</span>' : ''}
                        </div>

                        <!-- 价格区域 -->
                        <div class="detail-price-box">
                            <div class="price-main">
                                <span class="price-label">价格</span>
                                <span class="price-current">¥${product.price}</span>
                                ${hasDiscount ? `
                                    <span class="price-original">¥${product.original_price}</span>
                                    <span class="price-discount-badge">${discountPercent}% OFF</span>
                                ` : ''}
                            </div>
                            ${hasDiscount ? `
                                <div class="price-save">
                                    已省 ¥${(product.original_price - product.price).toFixed(2)}
                                </div>
                            ` : ''}
                        </div>

                        <!-- 商品信息卡片 -->
                        <div class="detail-info-cards">
                            <div class="info-card-item">
                                <svg width="20" height="20" class="icon"><use xlink:href="#icon-box"></use></svg>
                                <div class="info-card-content">
                                    <span class="info-card-label">库存</span>
                                    <span class="info-card-value ${product.stock < 10 ? 'text-warning' : ''}">${product.stock} 件</span>
                                </div>
                            </div>
                            <div class="info-card-item">
                                <svg width="20" height="20" class="icon"><use xlink:href="#icon-fire"></use></svg>
                                <div class="info-card-content">
                                    <span class="info-card-label">销量</span>
                                    <span class="info-card-value">${product.sales || 0} 件</span>
                                </div>
                            </div>
                            <div class="info-card-item">
                                <svg width="20" height="20" class="icon"><use xlink:href="#icon-star"></use></svg>
                                <div class="info-card-content">
                                    <span class="info-card-label">评价</span>
                                    <span class="info-card-value">${reviewData.total || 0} 条</span>
                                </div>
                            </div>
                            ${product.merchant_name ? `
                                <div class="info-card-item">
                                    <svg width="20" height="20" class="icon"><use xlink:href="#icon-merchant"></use></svg>
                                    <div class="info-card-content">
                                        <span class="info-card-label">商家</span>
                                        <span class="info-card-value">${product.merchant_name}</span>
                                    </div>
                                </div>
                            ` : ''}
                        </div>

                        <!-- 购买操作区 -->
                        <div class="detail-purchase-box">
                            <div class="quantity-selector-modern">
                                <label class="quantity-label">购买数量</label>
                                <div class="quantity-controls">
                                    <button class="qty-btn" onclick="ProductDetailService.decreaseQuantity()" ${product.stock < 1 ? 'disabled' : ''}>
                                        <svg width="16" height="16" class="icon"><use xlink:href="#icon-minus"></use></svg>
                                    </button>
                                    <input type="number" id="productQuantity" value="1" min="1" max="${product.stock}" class="qty-input" readonly>
                                    <button class="qty-btn" onclick="ProductDetailService.increaseQuantity(${product.stock})" ${product.stock < 1 ? 'disabled' : ''}>
                                        <svg width="16" height="16" class="icon"><use xlink:href="#icon-plus"></use></svg>
                                    </button>
                                </div>
                            </div>

                            <div class="purchase-actions">
                                <button class="btn btn-primary btn-lg btn-block" 
                                        onclick="ProductDetailService.addToCart()"
                                        ${product.stock < 1 ? 'disabled' : ''}>
                                    <svg width="20" height="20" class="icon"><use xlink:href="#icon-cart"></use></svg>
                                    ${product.stock < 1 ? '已售罄' : '加入购物车'}
                                </button>
                                <button class="btn btn-outline btn-lg" 
                                        onclick="ProductDetailService.buyNow()"
                                        ${product.stock < 1 ? 'disabled' : ''}>
                                    <svg width="20" height="20" class="icon"><use xlink:href="#icon-credit-card"></use></svg>
                                    立即购买
                                </button>
                            </div>
                        </div>

                        <!-- 服务保障 -->
                        <div class="detail-services-box">
                            <div class="service-badge">
                                <svg width="18" height="18" class="icon"><use xlink:href="#icon-check"></use></svg>
                                <span>正品保证</span>
                            </div>
                            <div class="service-badge">
                                <svg width="18" height="18" class="icon"><use xlink:href="#icon-truck"></use></svg>
                                <span>全国包邮</span>
                            </div>
                            <div class="service-badge">
                                <svg width="18" height="18" class="icon"><use xlink:href="#icon-refresh"></use></svg>
                                <span>7天退换</span>
                            </div>
                            <div class="service-badge">
                                <svg width="18" height="18" class="icon"><use xlink:href="#icon-credit-card"></use></svg>
                                <span>安全支付</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 构建图片画廊HTML
     */
    buildGalleryHTML() {
        if (!this.currentImages || this.currentImages.length === 0) {
            return `
                <div class="gallery-placeholder">
                    <svg width="120" height="120" class="icon"><use xlink:href="#icon-box"></use></svg>
                    <p>暂无图片</p>
                </div>
            `;
        }

        return `
            <div class="gallery-main-image">
                <img id="mainGalleryImage" 
                     src="${this.currentImages[0]}" 
                     alt="${this.currentProduct.name}"
                     onclick="ProductDetailService.openImageViewer(0)"
                     onerror="this.parentElement.innerHTML='<div class=\\'gallery-placeholder\\'><svg width=\\'120\\' height=\\'120\\' class=\\'icon\\'><use xlink:href=\\'#icon-box\\'></use></svg></div>'">
                <button class="gallery-zoom-btn" onclick="ProductDetailService.openImageViewer(0)">
                    <svg width="20" height="20" class="icon"><use xlink:href="#icon-search"></use></svg>
                </button>
            </div>
            ${this.currentImages.length > 1 ? `
                <div class="gallery-thumbnails">
                    ${this.currentImages.map((img, idx) => `
                        <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" 
                             data-index="${idx}"
                             onclick="ProductDetailService.switchImage(${idx})">
                            <img src="${img}" alt="图片${idx + 1}"
                                 onerror="this.parentElement.innerHTML='<svg width=\\'40\\' height=\\'40\\' class=\\'icon\\'><use xlink:href=\\'#icon-box\\'></use></svg>'">
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    },

    /**
     * 构建详情标签页HTML
     */
    buildDetailsTabHTML(product) {
        return `
            <div class="tab-content-box">
                <h3 class="content-title">商品详细信息</h3>
                <div class="content-text">
                    <p>${product.description || '优质商品，品质保证'}</p>
                </div>
                ${this.currentImages && this.currentImages.length > 0 ? `
                    <div class="detail-images-grid">
                        ${this.currentImages.map((img, idx) => `
                            <img src="${img}" 
                                 alt="商品详情图${idx + 1}"
                                 onclick="ProductDetailService.openImageViewer(${idx})"
                                 onerror="this.style.display='none'">
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * 构建规格标签页HTML
     */
    buildSpecsTabHTML(product) {
        return `
            <div class="tab-content-box">
                <div class="specs-table-modern">
                    <div class="spec-row">
                        <span class="spec-label">商品名称</span>
                        <span class="spec-value">${product.name}</span>
                    </div>
                    <div class="spec-row">
                        <span class="spec-label">商品价格</span>
                        <span class="spec-value">¥${product.price}</span>
                    </div>
                    ${product.original_price ? `
                        <div class="spec-row">
                            <span class="spec-label">原价</span>
                            <span class="spec-value">¥${product.original_price}</span>
                        </div>
                    ` : ''}
                    <div class="spec-row">
                        <span class="spec-label">库存数量</span>
                        <span class="spec-value">${product.stock} 件</span>
                    </div>
                    <div class="spec-row">
                        <span class="spec-label">累计销量</span>
                        <span class="spec-value">${product.sales || 0} 件</span>
                    </div>
                    ${product.category_name ? `
                        <div class="spec-row">
                            <span class="spec-label">商品分类</span>
                            <span class="spec-value">${product.category_name}</span>
                        </div>
                    ` : ''}
                    ${product.merchant_name ? `
                        <div class="spec-row">
                            <span class="spec-label">所属商家</span>
                            <span class="spec-value">${product.merchant_name}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * 构建评价标签页HTML
     */
    buildReviewsTabHTML(reviewData, productId) {
        if (!reviewData.reviews || reviewData.reviews.length === 0) {
            return `
                <div class="tab-content-box">
                    <div class="empty-reviews">
                        <svg width="80" height="80" class="icon"><use xlink:href="#icon-star"></use></svg>
                        <p>暂无评价</p>
                        <button class="btn btn-primary" onclick="ProductDetailService.writeReview()">
                            <svg width="18" height="18" class="icon"><use xlink:href="#icon-write"></use></svg>
                            写第一条评价
                        </button>
                    </div>
                </div>
            `;
        }

        const stats = reviewData.stats || {};
        const avgRating = stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : '0.0';

        return `
            <div class="tab-content-box">
                <!-- 评价统计 -->
                <div class="review-stats-box">
                    <div class="review-score">
                        <div class="score-number">${avgRating}</div>
                        <div class="score-stars">
                            ${this.renderStars(parseFloat(avgRating))}
                        </div>
                        <div class="score-count">${reviewData.total} 条评价</div>
                    </div>
                    <div class="review-distribution">
                        ${[5, 4, 3, 2, 1].map(star => {
            const count = stats[`${['', '', 'one', 'two', 'three', 'four', 'five'][star]}_star`] || 0;
            const percent = stats.total_count > 0 ? (count / stats.total_count * 100).toFixed(0) : 0;
            return `
                                <div class="distribution-row">
                                    <span class="distribution-label">${star}星</span>
                                    <div class="distribution-bar">
                                        <div class="distribution-fill" style="width: ${percent}%"></div>
                                    </div>
                                    <span class="distribution-count">${count}</span>
                                </div>
                            `;
        }).join('')}
                    </div>
                </div>

                <!-- 评价列表 -->
                <div class="reviews-list">
                    ${reviewData.reviews.map(review => this.buildReviewItemHTML(review)).join('')}
                </div>

                ${reviewData.total > 5 ? `
                    <div class="reviews-more">
                        <button class="btn btn-outline" onclick="ProductDetailService.loadMoreReviews(${productId})">
                            查看更多评价
                        </button>
                    </div>
                ` : ''}

                <div class="reviews-action">
                    <button class="btn btn-primary" onclick="ProductDetailService.writeReview()">
                        <svg width="18" height="18" class="icon"><use xlink:href="#icon-write"></use></svg>
                        写评价
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * 构建单条评价HTML
     */
    buildReviewItemHTML(review) {
        return `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-user">
                        <div class="user-avatar">
                            ${review.avatar ? `<img src="${review.avatar}" alt="${review.nickname || review.username}">` :
                `<svg width="32" height="32" class="icon"><use xlink:href="#icon-user"></use></svg>`}
                        </div>
                        <div class="user-info">
                            <div class="user-name">${review.nickname || review.username || '匿名用户'}</div>
                            <div class="review-time">${this.formatTime(review.create_time)}</div>
                        </div>
                    </div>
                    <div class="review-rating">
                        ${this.renderStars(review.rating)}
                    </div>
                </div>
                <div class="review-content">
                    ${review.content || '用户未填写评价内容'}
                </div>
                ${review.images ? `
                    <div class="review-images">
                        ${this.parseReviewImages(review.images).map((img, idx) => `
                            <img src="${img}" alt="评价图片${idx + 1}" 
                                 onclick="openImageViewer('${img}')"
                                 onerror="this.style.display='none'">
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * 渲染星级
     */
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let html = '';
        for (let i = 0; i < fullStars; i++) {
            html += '<svg width="16" height="16" class="star star-full"><use xlink:href="#icon-star"></use></svg>';
        }
        if (hasHalfStar) {
            html += '<svg width="16" height="16" class="star star-half"><use xlink:href="#icon-star"></use></svg>';
        }
        for (let i = 0; i < emptyStars; i++) {
            html += '<svg width="16" height="16" class="star star-empty"><use xlink:href="#icon-star"></use></svg>';
        }
        return html;
    },

    /**
     * 解析评价图片
     */
    parseReviewImages(images) {
        if (!images) return [];
        try {
            const parsed = JSON.parse(images);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return images.split(',').map(img => img.trim()).filter(img => img);
        }
    },

    /**
     * 格式化时间
     */
    formatTime(timeStr) {
        if (!timeStr) return '';
        const date = new Date(timeStr);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return '今天';
        if (days === 1) return '昨天';
        if (days < 7) return `${days}天前`;
        return date.toLocaleDateString('zh-CN');
    },

    /**
     * 初始化交互功能
     */
    initInteractions() {
        // 标签页切换
        document.querySelectorAll('.tab-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });
    },

    /**
     * 切换标签页
     */
    switchTab(tabName) {
        // 更新按钮状态
        document.querySelectorAll('.tab-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // 更新面板状态
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === tabName);
        });
    },

    /**
     * 切换图片
     */
    switchImage(index) {
        if (!this.currentImages || index >= this.currentImages.length) return;

        this.currentImageIndex = index;
        const mainImage = document.getElementById('mainGalleryImage');
        if (mainImage) {
            mainImage.src = this.currentImages[index];
        }

        // 更新缩略图激活状态
        document.querySelectorAll('.gallery-thumb').forEach((thumb, idx) => {
            thumb.classList.toggle('active', idx === index);
        });
    },

    /**
     * 打开图片查看器
     */
    openImageViewer(index) {
        if (typeof openImageGallery !== 'undefined' && this.currentImages) {
            openImageGallery(this.currentImages, index);
        } else if (typeof openImageViewer !== 'undefined' && this.currentImages) {
            openImageViewer(this.currentImages[index]);
        }
    },

    /**
     * 增加数量
     */
    increaseQuantity(maxStock) {
        const input = document.getElementById('productQuantity');
        if (input) {
            const current = parseInt(input.value) || 1;
            if (current < maxStock) {
                input.value = current + 1;
            }
        }
    },

    /**
     * 减少数量
     */
    decreaseQuantity() {
        const input = document.getElementById('productQuantity');
        if (input) {
            const current = parseInt(input.value) || 1;
            if (current > 1) {
                input.value = current - 1;
            }
        }
    },

    /**
     * 加入购物车
     */
    async addToCart() {
        if (!this.currentProduct) return;

        const quantity = parseInt(document.getElementById('productQuantity').value) || 1;

        if (typeof app !== 'undefined' && typeof app.addToCart === 'function') {
            await app.addToCart(this.currentProduct.id, quantity);
        } else {
            utils.showToast('加入购物车功能暂不可用', 'warning');
        }
    },

    /**
     * 立即购买
     */
    async buyNow() {
        if (!this.currentProduct) return;

        const user = utils.getUserInfo();
        if (!user) {
            utils.showToast('请先登录', 'warning');
            if (typeof app !== 'undefined' && app.router) {
                app.router.navigate('/login');
            }
            return;
        }

        // 先加入购物车
        await this.addToCart();

        // 跳转到结算页面
        if (typeof app !== 'undefined' && app.router) {
            app.router.navigate('/checkout');
        }
    },

    /**
     * 写评价
     */
    writeReview() {
        if (typeof ReviewService !== 'undefined' && this.currentProduct) {
            ReviewService.showReviewModal(this.currentProduct.id, this.currentProduct.name);
        } else {
            utils.showToast('评价功能暂不可用', 'warning');
        }
    },

    /**
     * 加载更多评价
     */
    async loadMoreReviews(productId) {
        utils.showToast('加载更多评价功能开发中', 'info');
    },

    /**
     * 记录浏览日志到服务器
     */
    async logBrowseToServer(productId) {
        try {
            const token = utils.getToken();
            if (!token) {
                // 用户未登录，不记录到数据库
                return;
            }

            // 调用后端API记录浏览日志
            await fetch(`${API_BASE}/user/log/browse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: productId,
                    timestamp: new Date().toISOString()
                })
            });

            console.log('浏览日志已记录到数据库');
        } catch (error) {
            // 静默失败，不影响用户体验
            console.error('记录浏览日志失败:', error);
        }
    }
};

// 向后兼容：将服务挂载到全局
if (typeof window !== 'undefined') {
    window.ProductDetailService = ProductDetailService;
}