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
        const [path, ...params] = hash.split('/').filter(Boolean);
        const route = '/' + (path || '');

        this.currentRoute = route;

        // 更新导航高亮
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + route);
        });

        const handler = this.routes[route] || this.routes['/404'];
        if (handler) {
            handler(params);
        }
    }
}