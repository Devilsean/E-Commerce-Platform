// ==================== 图片加载优化工具 ====================

const ImageLoader = {
    // 预加载图片
    preloadImage(src) {
        return new Promise((resolve, reject) => {
            if (!src) {
                reject(new Error('No image source'));
                return;
            }

            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = src;
        });
    },

    // 批量预加载图片
    async preloadImages(sources) {
        const promises = sources.filter(src => src).map(src => this.preloadImage(src));
        return Promise.allSettled(promises);
    },

    // 为图片元素添加加载处理
    setupImageElement(imgElement) {
        if (!imgElement || imgElement.complete) {
            if (imgElement) imgElement.classList.add('loaded');
            return;
        }

        imgElement.style.opacity = '0';

        imgElement.addEventListener('load', function onLoad() {
            this.style.opacity = '1';
            this.classList.add('loaded');
            imgElement.removeEventListener('load', onLoad);
        });

        imgElement.addEventListener('error', function onError() {
            this.style.opacity = '1';
            this.classList.add('error');
            imgElement.removeEventListener('error', onError);
        });
    },

    // 初始化页面所有图片
    initPageImages() {
        const images = document.querySelectorAll('img:not(.loaded)');
        images.forEach(img => this.setupImageElement(img));
    },

    // 懒加载观察器
    lazyLoadObserver: null,

    // 初始化懒加载
    initLazyLoad() {
        if ('IntersectionObserver' in window) {
            this.lazyLoadObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.dataset.src;

                        if (src) {
                            img.src = src;
                            img.removeAttribute('data-src');
                            this.setupImageElement(img);
                        }

                        this.lazyLoadObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px'
            });

            // 观察所有带data-src的图片
            document.querySelectorAll('img[data-src]').forEach(img => {
                this.lazyLoadObserver.observe(img);
            });
        } else {
            // 降级处理：直接加载所有图片
            document.querySelectorAll('img[data-src]').forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                this.setupImageElement(img);
            });
        }
    },

    // 创建带加载状态的图片HTML
    createImageHTML(src, alt = '', className = '') {
        if (!src) {
            return `<div class="image-placeholder ${className}">
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
            </div>`;
        }

        return `<img src="${src}" alt="${alt}" class="${className}" 
                     onload="this.style.opacity='1'; this.classList.add('loaded')" 
                     onerror="this.style.opacity='1'; this.classList.add('error'); this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2214%22%3E加载失败%3C/text%3E%3C/svg%3E'"
                     style="opacity: 0; transition: opacity 0.3s ease-in-out;">`;
    }
};

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ImageLoader.initPageImages();
        ImageLoader.initLazyLoad();
    });
} else {
    ImageLoader.initPageImages();
    ImageLoader.initLazyLoad();
}

// 监听动态内容变化
if ('MutationObserver' in window) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    if (node.tagName === 'IMG') {
                        ImageLoader.setupImageElement(node);
                    } else {
                        const images = node.querySelectorAll('img:not(.loaded)');
                        images.forEach(img => ImageLoader.setupImageElement(img));
                    }
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}