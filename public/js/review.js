// 评论服务模块

const ReviewService = {
    // 加载商品评论
    async loadProductReviews(productId, page = 1, size = 10) {
        try {
            const response = await fetch(`${API_BASE}/guest/product/${productId}/reviews?page=${page}&size=${size}`);
            const data = await response.json();

            if (data.code === 200) {
                return data.data;
            } else {
                throw new Error(data.message || '获取评论失败');
            }
        } catch (error) {
            console.error('Load reviews error:', error);
            throw error;
        }
    },

    // 提交评论
    async submitReview(reviewData) {
        const token = utils.getToken();
        if (!token) {
            utils.showToast('请先登录', 'warning');
            return false;
        }

        try {
            const response = await fetch(`${API_BASE}/user/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reviewData)
            });

            const data = await response.json();

            if (data.code === 200) {
                utils.showToast('评论提交成功', 'success');
                return true;
            } else {
                utils.showToast(data.message || '评论提交失败', 'error');
                return false;
            }
        } catch (error) {
            console.error('Submit review error:', error);
            utils.showToast('评论提交失败', 'error');
            return false;
        }
    },

    // 删除评论
    async deleteReview(reviewId) {
        const token = utils.getToken();
        if (!token) {
            utils.showToast('请先登录', 'warning');
            return false;
        }

        try {
            const response = await fetch(`${API_BASE}/user/review/${reviewId}`, {
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
            console.error('Delete review error:', error);
            utils.showToast('删除失败', 'error');
            return false;
        }
    },

    // 渲染评论区域
    renderReviewSection(containerId, productId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="reviews-section">
                <div class="reviews-header">
                    <h3>📝 商品评价</h3>
                    <div class="reviews-stats" id="reviewsStats">
                        <span class="loading-text">加载中...</span>
                    </div>
                </div>
                
                <div class="reviews-filter" id="reviewsFilter" style="display:none;">
                    <button class="filter-btn active" data-filter="all">全部</button>
                    <button class="filter-btn" data-filter="5">5星</button>
                    <button class="filter-btn" data-filter="4">4星</button>
                    <button class="filter-btn" data-filter="3">3星</button>
                    <button class="filter-btn" data-filter="2">2星</button>
                    <button class="filter-btn" data-filter="1">1星</button>
                </div>
                
                <div class="reviews-list" id="reviewsList">
                    <div class="loading-text">加载评论中...</div>
                </div>
                
                <div class="reviews-pagination" id="reviewsPagination" style="display:none;"></div>
            </div>
        `;

        this.loadAndDisplayReviews(productId, 1);
    },

    // 加载并显示评论
    async loadAndDisplayReviews(productId, page = 1) {
        const listContainer = document.getElementById('reviewsList');
        const statsContainer = document.getElementById('reviewsStats');
        const filterContainer = document.getElementById('reviewsFilter');
        const paginationContainer = document.getElementById('reviewsPagination');

        try {
            const data = await this.loadProductReviews(productId, page);

            // 显示统计信息
            if (data.stats) {
                const stats = data.stats;
                const avgRating = stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : '0.0';
                const totalCount = stats.total_count || 0;

                statsContainer.innerHTML = `
                    <div class="rating-summary">
                        <div class="rating-score">
                            <span class="score-number">${avgRating}</span>
                            <span class="score-stars">${this.renderStars(avgRating)}</span>
                        </div>
                        <div class="rating-count">${totalCount} 条评价</div>
                    </div>
                    <div class="rating-bars">
                        ${this.renderRatingBars(stats)}
                    </div>
                `;

                if (totalCount > 0) {
                    filterContainer.style.display = 'flex';
                }
            }

            // 显示评论列表
            if (data.reviews && data.reviews.length > 0) {
                listContainer.innerHTML = data.reviews.map(review => this.renderReviewItem(review)).join('');

                // 显示分页
                if (data.total > data.size) {
                    const totalPages = Math.ceil(data.total / data.size);
                    paginationContainer.style.display = 'flex';
                    paginationContainer.innerHTML = this.renderPagination(page, totalPages, productId);
                }
            } else {
                listContainer.innerHTML = `
                    <div class="empty-reviews">
                        <div class="empty-icon">💬</div>
                        <p>暂无评价，快来抢沙发吧！</p>
                    </div>
                `;
            }

            // 绑定筛选事件
            this.bindFilterEvents(productId);

        } catch (error) {
            listContainer.innerHTML = `
                <div class="error-reviews">
                    <p>加载评论失败，请刷新重试</p>
                </div>
            `;
        }
    },

    // 渲染单条评论
    renderReviewItem(review) {
        const username = review.nickname || review.username || '匿名用户';
        const avatar = review.avatar || '';
        const createTime = review.create_time ? new Date(review.create_time).toLocaleDateString('zh-CN') : '';
        const images = review.images ? JSON.parse(review.images) : [];

        return `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">
                            ${avatar ? `<img src="${avatar}" alt="${username}">` : '👤'}
                        </div>
                        <div class="reviewer-details">
                            <span class="reviewer-name">${this.escapeHtml(username)}</span>
                            <span class="review-date">${createTime}</span>
                        </div>
                    </div>
                    <div class="review-rating">
                        ${this.renderStars(review.rating)}
                    </div>
                </div>
                <div class="review-content">
                    ${review.content ? this.escapeHtml(review.content) : '<span class="no-content">用户未填写评价内容</span>'}
                </div>
                ${images.length > 0 ? `
                    <div class="review-images">
                        ${images.map(img => `<img src="${img}" alt="评价图片" onclick="ReviewService.showImagePreview('${img}')">`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    },

    // 渲染星级
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '⭐';
        }
        if (hasHalfStar) {
            stars += '✨';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '☆';
        }
        return stars;
    },

    // 渲染评分条
    renderRatingBars(stats) {
        const total = stats.total_count || 1;
        const ratings = [
            { star: 5, count: stats.five_star || 0 },
            { star: 4, count: stats.four_star || 0 },
            { star: 3, count: stats.three_star || 0 },
            { star: 2, count: stats.two_star || 0 },
            { star: 1, count: stats.one_star || 0 }
        ];

        return ratings.map(r => {
            const percent = total > 0 ? (r.count / total * 100).toFixed(0) : 0;
            return `
                <div class="rating-bar-item">
                    <span class="bar-label">${r.star}星</span>
                    <div class="bar-track">
                        <div class="bar-fill" style="width: ${percent}%"></div>
                    </div>
                    <span class="bar-count">${r.count}</span>
                </div>
            `;
        }).join('');
    },

    // 渲染分页
    renderPagination(currentPage, totalPages, productId) {
        let html = '';

        if (currentPage > 1) {
            html += `<button class="page-btn" onclick="ReviewService.loadAndDisplayReviews(${productId}, ${currentPage - 1})">上一页</button>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                html += `<button class="page-btn active">${i}</button>`;
            } else if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                html += `<button class="page-btn" onclick="ReviewService.loadAndDisplayReviews(${productId}, ${i})">${i}</button>`;
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                html += `<span class="page-ellipsis">...</span>`;
            }
        }

        if (currentPage < totalPages) {
            html += `<button class="page-btn" onclick="ReviewService.loadAndDisplayReviews(${productId}, ${currentPage + 1})">下一页</button>`;
        }

        return html;
    },

    // 绑定筛选事件
    bindFilterEvents(productId) {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // TODO: 实现按星级筛选
            });
        });
    },

    // 显示图片预览
    showImagePreview(imageUrl) {
        const modal = document.createElement('div');
        modal.className = 'image-preview-modal';
        modal.innerHTML = `
            <div class="image-preview-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="image-preview-content">
                <img src="${imageUrl}" alt="预览图片">
                <button class="image-preview-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        document.body.appendChild(modal);
    },

    // 显示评论表单弹窗
    showReviewModal(productId, productName, orderId = null) {
        const user = utils.getUserInfo();
        if (!user) {
            utils.showToast('请先登录', 'warning');
            if (window.app && window.app.router) {
                window.app.router.navigate('/login');
            }
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'reviewModal';
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📝 发表评价</h3>
                    <button class="modal-close" onclick="document.getElementById('reviewModal').remove()">×</button>
                </div>
                <form id="reviewForm" onsubmit="ReviewService.handleSubmitReview(event, ${productId}, ${orderId})">
                    <div class="form-group">
                        <label>商品</label>
                        <div class="review-product-name">${this.escapeHtml(productName)}</div>
                    </div>
                    
                    <div class="form-group">
                        <label>评分 <span class="label-required">*</span></label>
                        <div class="star-rating" id="starRating">
                            <span class="star" data-value="1">☆</span>
                            <span class="star" data-value="2">☆</span>
                            <span class="star" data-value="3">☆</span>
                            <span class="star" data-value="4">☆</span>
                            <span class="star" data-value="5">☆</span>
                        </div>
                        <input type="hidden" id="ratingValue" name="rating" value="5" required>
                        <span class="rating-text" id="ratingText">非常满意</span>
                    </div>
                    
                    <div class="form-group">
                        <label>评价内容</label>
                        <textarea id="reviewContent" name="content" rows="4"
                            placeholder="分享您的使用体验，帮助其他买家做出选择..."
                            class="form-input" maxlength="500"></textarea>
                        <div class="char-count"><span id="contentLength">0</span>/500</div>
                    </div>
                    
                    <div class="form-group">
                        <label>晒图（可选）</label>
                        <div class="image-upload-area">
                            <div class="upload-tip">
                                <span>📷</span>
                                <p>支持输入图片URL，多个URL用逗号分隔</p>
                            </div>
                            <textarea id="reviewImages" name="images" rows="2"
                                placeholder="https://example.com/img1.jpg,https://example.com/img2.jpg"
                                class="form-input"></textarea>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('reviewModal').remove()">取消</button>
                        <button type="submit" class="btn btn-primary">提交评价</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        // 初始化星级选择
        this.initStarRating();

        // 初始化字数统计
        const textarea = document.getElementById('reviewContent');
        textarea.addEventListener('input', () => {
            document.getElementById('contentLength').textContent = textarea.value.length;
        });
    },

    // 初始化星级选择
    initStarRating() {
        const stars = document.querySelectorAll('#starRating .star');
        const ratingInput = document.getElementById('ratingValue');
        const ratingText = document.getElementById('ratingText');
        const texts = ['', '非常差', '比较差', '一般', '比较满意', '非常满意'];

        // 默认5星
        this.updateStars(stars, 5);

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const value = parseInt(star.dataset.value);
                ratingInput.value = value;
                ratingText.textContent = texts[value];
                this.updateStars(stars, value);
            });

            star.addEventListener('mouseenter', () => {
                const value = parseInt(star.dataset.value);
                this.updateStars(stars, value);
            });
        });

        document.getElementById('starRating').addEventListener('mouseleave', () => {
            const value = parseInt(ratingInput.value);
            this.updateStars(stars, value);
        });
    },

    // 更新星级显示
    updateStars(stars, value) {
        stars.forEach(star => {
            const starValue = parseInt(star.dataset.value);
            star.textContent = starValue <= value ? '⭐' : '☆';
            star.classList.toggle('active', starValue <= value);
        });
    },

    // 处理提交评论
    async handleSubmitReview(event, productId, orderId) {
        event.preventDefault();

        const rating = parseInt(document.getElementById('ratingValue').value);
        const content = document.getElementById('reviewContent').value.trim();

        if (!rating || rating < 1 || rating > 5) {
            utils.showToast('请选择评分', 'warning');
            return;
        }

        // 处理 orderId，确保 null 值正确传递
        const actualOrderId = (orderId === null || orderId === 'null' || orderId === undefined) ? null : orderId;

        const images = document.getElementById('reviewImages').value.trim();
        const imageArray = images ? images.split(',').map(url => url.trim()).filter(url => url) : [];

        const reviewData = {
            productId: productId,
            orderId: actualOrderId,
            rating: rating,
            content: content || '',
            images: imageArray.length > 0 ? JSON.stringify(imageArray) : null
        };

        console.log('Submitting review:', reviewData);

        const success = await this.submitReview(reviewData);
        if (success) {
            document.getElementById('reviewModal').remove();
            // 刷新评论列表
            this.loadAndDisplayReviews(productId, 1);
        }
    },

    // HTML转义
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};