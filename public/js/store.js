// Store - 状态管理模块

const Store = {
    // 获取当前用户
    getCurrentUser() {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    },

    // 设置当前用户
    setCurrentUser(user) {
        localStorage.setItem('userInfo', JSON.stringify(user));
    },

    // 清除当前用户
    clearCurrentUser() {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
    },

    // 获取订单筛选状态
    getOrderFilter() {
        return localStorage.getItem('orderFilter') || 'all';
    },

    // 设置订单筛选状态
    setOrderFilter(status) {
        localStorage.setItem('orderFilter', status);
    },

    // ==================== 浏览历史管理 ====================
    
    // 添加浏览历史
    addBrowsingHistory(product) {
        const user = this.getCurrentUser();
        if (!user) return; // 未登录用户不记录

        const history = this.getBrowsingHistory();
        
        // 移除已存在的相同商品
        const filtered = history.filter(item => item.id !== product.id);
        
        // 添加到开头
        filtered.unshift({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image_url || product.main_image || product.mainImage,
            description: product.description,
            timestamp: new Date().toISOString()
        });
        
        // 只保留最近50条
        const limited = filtered.slice(0, 50);
        
        localStorage.setItem('browsingHistory', JSON.stringify(limited));
        
        // 同时记录到服务器（如果需要）
        this.logBrowsingToServer(product.id);
    },

    // 获取浏览历史
    getBrowsingHistory() {
        const history = localStorage.getItem('browsingHistory');
        return history ? JSON.parse(history) : [];
    },

    // 清除浏览历史
    clearBrowsingHistory() {
        localStorage.removeItem('browsingHistory');
    },

    // 删除单条浏览历史
    removeBrowsingHistory(productId) {
        const history = this.getBrowsingHistory();
        const filtered = history.filter(item => item.id !== productId);
        localStorage.setItem('browsingHistory', JSON.stringify(filtered));
    },

    // 记录浏览到服务器
    async logBrowsingToServer(productId) {
        const user = this.getCurrentUser();
        if (!user) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await fetch(`${CONFIG.API_BASE}/user/log/browse`, {
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
        } catch (error) {
            console.log('浏览日志记录失败:', error);
        }
    },

    // 记录购买到服务器
    async logPurchaseToServer(orderId, items) {
        const user = this.getCurrentUser();
        if (!user) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await fetch(`${CONFIG.API_BASE}/user/log/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    orderId: orderId,
                    items: items,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.log('购买日志记录失败:', error);
        }
    }
};