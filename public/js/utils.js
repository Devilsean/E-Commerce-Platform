// ==================== 工具函数 ====================
const utils = {
    // 显示Toast提示
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast toast-${type} show`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    },

    // 显示/隐藏Loading
    showLoading(show = true) {
        document.getElementById('loading').style.display = show ? 'flex' : 'none';
    },

    // 获取Token
    getToken() {
        return localStorage.getItem('token');
    },

    // 设置Token
    setToken(token) {
        localStorage.setItem('token', token);
    },

    // 移除Token
    removeToken() {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
    },

    // 获取用户信息
    getUserInfo() {
        const info = localStorage.getItem('userInfo');
        return info ? JSON.parse(info) : null;
    },

    // 设置用户信息
    setUserInfo(info) {
        localStorage.setItem('userInfo', JSON.stringify(info));
    },

    // API请求
    async request(url, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        };

        try {
            const response = await fetch(API_BASE + url, {
                ...options,
                headers
            });

            // 检查响应是否为空
            const text = await response.text();
            if (!text) {
                throw new Error('服务器返回空响应');
            }

            const data = JSON.parse(text);

            if (data.code === 200) {
                return data.data;
            } else {
                throw new Error(data.message || '请求失败');
            }
        } catch (error) {
            console.error('API Error:', error);
            this.showToast(error.message || '请求失败', 'error');
            throw error;
        }
    }
};