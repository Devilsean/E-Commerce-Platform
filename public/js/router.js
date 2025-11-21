// 路由管理模块

const Router = {
    // 页面历史记录
    history: [],

    // 导航到指定页面
    navigate(pageName) {
        // 保存当前页面到历史记录
        const currentPage = Store.getCurrentPage();
        if (currentPage && currentPage !== pageName) {
            this.history.push(currentPage);
        }

        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // 显示目标页面
        const targetPage = document.getElementById(pageName + '-page');
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // 更新导航状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // 保存当前页面
        Store.setCurrentPage(pageName);

        // 加载页面数据
        this.loadPageData(pageName);

        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // 返回上一页
    goBack() {
        if (this.history.length > 0) {
            // 从历史记录中取出上一页
            const previousPage = this.history.pop();
            // 导航到上一页，不记录到历史
            this.navigateWithoutHistory(previousPage);
        } else {
            // 如果没有历史记录，返回首页
            this.navigateWithoutHistory('home');
        }

        // 输出调试信息
        console.log('返回操作 - 当前历史记录:', this.history);
    },

    // 导航但不记录历史
    navigateWithoutHistory(pageName) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // 显示目标页面
        const targetPage = document.getElementById(pageName + '-page');
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // 更新导航状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // 保存当前页面
        Store.setCurrentPage(pageName);

        // 加载页面数据
        this.loadPageData(pageName);

        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // 加载页面数据
    loadPageData(pageName) {
        switch (pageName) {
            case 'home':
            case 'products':
                ProductService.loadProducts();
                break;
            case 'cart':
                CartService.loadCart();
                break;
            case 'profile':
                ProfileService.loadProfile();
                break;
        }
    }
};

// 页面切换函数（保持向后兼容）
function showPage(pageName) {
    Router.navigate(pageName);
}