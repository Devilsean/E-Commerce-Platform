// ==================== 路由系统 ====================
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;

        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    register(path, handler) {
        this.routes[path] = handler;
    }

    navigate(path) {
        window.location.hash = path;
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        
        // 尝试匹配完整路径（如 /help/order）
        let route = hash;
        let params = [];
        
        // 如果路由中包含参数（如 /product/123），需要提取
        if (hash.includes('/') && hash !== '/') {
            const parts = hash.split('/').filter(Boolean);
            
            // 先尝试匹配完整路径（用于 /help/order 这样的路由）
            route = '/' + parts.join('/');
            
            // 如果完整路径没有匹配，尝试匹配第一部分+参数的形式（用于 /product/123）
            if (!this.routes[route]) {
                route = '/' + parts[0];
                params = parts.slice(1);
            }
        } else if (hash === '/') {
            route = '/';
        }

        this.currentRoute = route;

        // 更新导航高亮
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + route);
        });

        const handler = this.routes[route] || this.routes['/404'];
        if (handler) {
            handler(params);
        } else {
            console.warn('No handler found for route:', route);
            console.log('Available routes:', Object.keys(this.routes));
        }
    }
}