// 图片查看器模块

const ImageViewer = {
    currentIndex: 0,
    images: [],
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    modal: null,
    imageElement: null,

    // 打开图片查看器（单图模式）
    open(imageUrl) {
        this.openGallery([imageUrl], 0);
    },

    // 打开图片画廊（多图模式）
    openGallery(images, startIndex = 0) {
        if (!images || images.length === 0) return;

        this.images = images;
        this.currentIndex = startIndex;
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;

        this.createModal();
        this.loadImage();
        this.bindEvents();

        // 阻止body滚动
        document.body.style.overflow = 'hidden';
    },

    // 创建模态框
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'image-viewer-modal';
        this.modal.innerHTML = `
            <div class="image-viewer-backdrop"></div>
            <div class="image-viewer-container">
                <div class="image-viewer-toolbar">
                    <button class="image-viewer-btn" id="viewer-zoom-out" title="缩小">🔍-</button>
                    <button class="image-viewer-btn" id="viewer-zoom-in" title="放大">🔍+</button>
                    <button class="image-viewer-btn" id="viewer-rotate-left" title="向左旋转">↶</button>
                    <button class="image-viewer-btn" id="viewer-rotate-right" title="向右旋转">↷</button>
                    <button class="image-viewer-btn" id="viewer-reset" title="重置">⟲</button>
                    <button class="image-viewer-btn image-viewer-close" id="viewer-close" title="关闭">✕</button>
                </div>
                ${this.images.length > 1 ? `
                    <div class="image-viewer-counter">
                        <span id="viewer-current">${this.currentIndex + 1}</span> / ${this.images.length}
                    </div>
                ` : ''}
                <div class="image-viewer-content">
                    <div class="image-viewer-loading">
                        <div class="image-viewer-spinner"></div>
                    </div>
                    <img class="image-viewer-image" id="viewer-image" alt="查看图片">
                </div>
                ${this.images.length > 1 ? `
                    <button class="image-viewer-nav image-viewer-nav-prev" id="viewer-prev" title="上一张">‹</button>
                    <button class="image-viewer-nav image-viewer-nav-next" id="viewer-next" title="下一张">›</button>
                ` : ''}
                <div class="image-viewer-zoom-info" id="viewer-zoom-info">100%</div>
            </div>
        `;
        document.body.appendChild(this.modal);

        this.imageElement = document.getElementById('viewer-image');
    },

    // 加载图片
    loadImage() {
        const loading = this.modal.querySelector('.image-viewer-loading');
        const imageUrl = this.images[this.currentIndex];

        loading.style.display = 'block';
        this.imageElement.style.display = 'none';

        // 重置变换
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.rotation = 0;
        this.updateTransform();

        // 加载图片
        const img = new Image();
        img.onload = () => {
            this.imageElement.src = imageUrl;
            this.imageElement.style.display = 'block';
            loading.style.display = 'none';
            this.updateNavigationButtons();
        };
        img.onerror = () => {
            loading.innerHTML = '<div style="color: white;">图片加载失败</div>';
            this.updateNavigationButtons();
        };
        img.src = imageUrl;

        // 更新计数器
        if (this.images.length > 1) {
            const counter = document.getElementById('viewer-current');
            if (counter) {
                counter.textContent = this.currentIndex + 1;
            }
        }
    },

    // 更新导航按钮状态
    updateNavigationButtons() {
        if (this.images.length <= 1) return;

        const prevBtn = document.getElementById('viewer-prev');
        const nextBtn = document.getElementById('viewer-next');

        if (prevBtn) {
            prevBtn.disabled = this.currentIndex === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentIndex === this.images.length - 1;
        }
    },

    // 绑定事件
    bindEvents() {
        // 关闭按钮
        const closeBtn = document.getElementById('viewer-close');
        const backdrop = this.modal.querySelector('.image-viewer-backdrop');

        closeBtn.addEventListener('click', () => this.close());
        backdrop.addEventListener('click', () => this.close());

        // 缩放按钮
        document.getElementById('viewer-zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('viewer-zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('viewer-reset').addEventListener('click', () => this.reset());

        // 旋转按钮
        document.getElementById('viewer-rotate-left').addEventListener('click', () => this.rotate(-90));
        document.getElementById('viewer-rotate-right').addEventListener('click', () => this.rotate(90));

        // 导航按钮
        if (this.images.length > 1) {
            const prevBtn = document.getElementById('viewer-prev');
            const nextBtn = document.getElementById('viewer-next');

            if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
            if (nextBtn) nextBtn.addEventListener('click', () => this.next());
        }

        // 键盘事件
        this.keyboardHandler = (e) => {
            switch (e.key) {
                case 'Escape':
                    this.close();
                    break;
                case 'ArrowLeft':
                    this.prev();
                    break;
                case 'ArrowRight':
                    this.next();
                    break;
                case '+':
                case '=':
                    this.zoomIn();
                    break;
                case '-':
                    this.zoomOut();
                    break;
                case '0':
                    this.reset();
                    break;
            }
        };
        document.addEventListener('keydown', this.keyboardHandler);

        // 鼠标滚轮缩放
        this.wheelHandler = (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        };
        this.imageElement.addEventListener('wheel', this.wheelHandler, { passive: false });

        // 拖拽事件
        this.imageElement.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.endDrag());

        // 触摸事件（移动端）
        this.imageElement.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.imageElement.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.imageElement.addEventListener('touchend', () => this.handleTouchEnd());

        // 双击重置
        this.imageElement.addEventListener('dblclick', () => this.reset());
    },

    // 触摸事件处理
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            // 单指拖拽
            this.startDrag({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
        } else if (e.touches.length === 2) {
            // 双指缩放
            e.preventDefault();
            this.initialPinchDistance = this.getPinchDistance(e.touches);
            this.initialScale = this.scale;
        }
    },

    handleTouchMove(e) {
        if (e.touches.length === 1 && this.isDragging) {
            // 单指拖拽
            this.drag({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
        } else if (e.touches.length === 2) {
            // 双指缩放
            e.preventDefault();
            const currentDistance = this.getPinchDistance(e.touches);
            const scaleChange = currentDistance / this.initialPinchDistance;
            this.scale = Math.max(0.5, Math.min(5, this.initialScale * scaleChange));
            this.updateTransform();
            this.updateZoomInfo();
        }
    },

    handleTouchEnd() {
        this.endDrag();
        this.initialPinchDistance = null;
    },

    getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // 开始拖拽
    startDrag(e) {
        if (this.scale <= 1) return;

        this.isDragging = true;
        this.startX = e.clientX - this.translateX;
        this.startY = e.clientY - this.translateY;
        this.imageElement.classList.add('dragging');
    },

    // 拖拽中
    drag(e) {
        if (!this.isDragging) return;

        e.preventDefault();
        this.translateX = e.clientX - this.startX;
        this.translateY = e.clientY - this.startY;
        this.updateTransform();
    },

    // 结束拖拽
    endDrag() {
        this.isDragging = false;
        this.imageElement.classList.remove('dragging');
    },

    // 放大
    zoomIn() {
        this.scale = Math.min(5, this.scale + 0.25);
        this.updateTransform();
        this.updateZoomInfo();

        if (this.scale > 1) {
            this.imageElement.classList.add('zoomed');
        }
    },

    // 缩小
    zoomOut() {
        this.scale = Math.max(0.5, this.scale - 0.25);
        this.updateTransform();
        this.updateZoomInfo();

        if (this.scale <= 1) {
            this.imageElement.classList.remove('zoomed');
            this.translateX = 0;
            this.translateY = 0;
            this.updateTransform();
        }
    },

    // 旋转
    rotate(degrees) {
        this.rotation = (this.rotation || 0) + degrees;
        this.updateTransform();
    },

    // 重置
    reset() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.rotation = 0;
        this.imageElement.classList.remove('zoomed');
        this.updateTransform();
        this.updateZoomInfo();
    },

    // 更新变换
    updateTransform() {
        const rotation = this.rotation || 0;
        this.imageElement.style.transform =
            `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale}) rotate(${rotation}deg)`;
    },

    // 更新缩放信息
    updateZoomInfo() {
        const zoomInfo = document.getElementById('viewer-zoom-info');
        if (zoomInfo) {
            zoomInfo.textContent = `${Math.round(this.scale * 100)}%`;
        }
    },

    // 上一张
    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.loadImage();
        }
    },

    // 下一张
    next() {
        if (this.currentIndex < this.images.length - 1) {
            this.currentIndex++;
            this.loadImage();
        }
    },

    // 关闭查看器
    close() {
        if (this.modal) {
            // 移除事件监听
            document.removeEventListener('keydown', this.keyboardHandler);
            if (this.imageElement && this.wheelHandler) {
                this.imageElement.removeEventListener('wheel', this.wheelHandler);
            }

            // 移除模态框
            this.modal.remove();
            this.modal = null;
            this.imageElement = null;

            // 恢复body滚动
            document.body.style.overflow = '';
        }
    }
};

// 全局快捷方法
window.openImageViewer = (imageUrl) => {
    ImageViewer.open(imageUrl);
};

window.openImageGallery = (images, startIndex = 0) => {
    ImageViewer.openGallery(images, startIndex);
};