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
    }
};