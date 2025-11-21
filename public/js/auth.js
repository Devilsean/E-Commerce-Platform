// ==================== 认证模块 ====================
const AuthService = {
    // 渲染登录页面
    renderLogin() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="auth-container">
                <div class="auth-box">
                    <div class="auth-header">
                        <div class="auth-icon">🔐</div>
                        <h2>欢迎登录</h2>
                        <p>登录精品商城，开启购物之旅</p>
                    </div>
                    
                    <form onsubmit="AuthService.handleLogin(event)" class="auth-form">
                        <div class="form-group">
                            <label>
                                <span class="label-icon">👥</span>
                                <span>用户类型</span>
                            </label>
                            <div class="radio-group-modern">
                                <label class="radio-card">
                                    <input type="radio" name="userType" value="1" checked>
                                    <div class="radio-content">
                                        <span class="radio-icon">👤</span>
                                        <span class="radio-text">普通用户</span>
                                    </div>
                                </label>
                                <label class="radio-card">
                                    <input type="radio" name="userType" value="2">
                                    <div class="radio-content">
                                        <span class="radio-icon">🏪</span>
                                        <span class="radio-text">商家</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <span class="label-icon">📧</span>
                                <span>账号</span>
                            </label>
                            <input type="text" name="account" placeholder="请输入用户名/手机号/邮箱" required class="form-input">
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <span class="label-icon">🔒</span>
                                <span>密码</span>
                            </label>
                            <input type="password" name="password" placeholder="请输入密码" required class="form-input">
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block btn-lg">
                            <span>🚀</span> 立即登录
                        </button>
                    </form>
                    
                    <div class="auth-footer">
                        <p>还没有账号？<a href="#/register" class="auth-link-primary">立即注册</a></p>
                    </div>
                </div>
            </div>
        `;
    },

    // 处理登录
    async handleLogin(event) {
        event.preventDefault();
        const form = event.target;
        const data = {
            account: form.account.value,
            password: form.password.value,
            userType: parseInt(form.userType.value)
        };

        utils.showLoading();
        try {
            const result = await utils.request('/user/login', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            utils.setToken(result.token);
            utils.setUserInfo(result.userInfo);
            if (window.app) {
                app.updateUI();
            }
            utils.showToast('登录成功', 'success');
            window.location.hash = '/';
        } catch (error) {
            // Error already shown by utils.request
        } finally {
            utils.showLoading(false);
        }
    },

    // 渲染注册页面
    renderRegister() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="auth-container">
                <div class="auth-box auth-box-large">
                    <div class="auth-header">
                        <div class="auth-icon">📝</div>
                        <h2>创建账号</h2>
                        <p>加入精品商城，享受优质服务</p>
                    </div>
                    
                    <form onsubmit="AuthService.handleRegister(event)" class="auth-form">
                        <div class="form-group">
                            <label>
                                <span class="label-icon">👥</span>
                                <span>用户类型</span>
                            </label>
                            <div class="radio-group-modern">
                                <label class="radio-card">
                                    <input type="radio" name="userType" value="1" checked>
                                    <div class="radio-content">
                                        <span class="radio-icon">👤</span>
                                        <span class="radio-text">普通用户</span>
                                        <span class="radio-desc">购物、下单、评价</span>
                                    </div>
                                </label>
                                <label class="radio-card">
                                    <input type="radio" name="userType" value="2">
                                    <div class="radio-content">
                                        <span class="radio-icon">🏪</span>
                                        <span class="radio-text">商家</span>
                                        <span class="radio-desc">发布商品、管理订单</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>
                                    <span class="label-icon">👤</span>
                                    <span>用户名</span>
                                </label>
                                <input type="text" name="username" placeholder="请输入用户名" required class="form-input">
                            </div>
                            
                            <div class="form-group">
                                <label>
                                    <span class="label-icon">🔒</span>
                                    <span>密码</span>
                                </label>
                                <input type="password" name="password" placeholder="6位以上" required minlength="6" class="form-input">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>
                                    <span class="label-icon">📱</span>
                                    <span>手机号</span>
                                </label>
                                <input type="tel" name="phone" placeholder="请输入手机号" pattern="[0-9]{11}" class="form-input">
                            </div>
                            
                            <div class="form-group">
                                <label>
                                    <span class="label-icon">📧</span>
                                    <span>邮箱</span>
                                </label>
                                <input type="email" name="email" placeholder="请输入邮箱" class="form-input">
                            </div>
                        </div>
                        
                        <div class="form-tips">
                            <p>📌 注册即表示同意用户协议和隐私政策</p>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block btn-lg">
                            <span>✨</span> 立即注册
                        </button>
                    </form>
                    
                    <div class="auth-footer">
                        <p>已有账号？<a href="#/login" class="auth-link-primary">立即登录</a></p>
                    </div>
                </div>
            </div>
        `;
    },

    // 处理注册
    async handleRegister(event) {
        event.preventDefault();
        const form = event.target;
        const data = {
            username: form.username.value,
            password: form.password.value,
            phone: form.phone.value,
            email: form.email.value,
            userType: parseInt(form.userType.value)
        };

        utils.showLoading();
        try {
            await utils.request('/user/register', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            utils.showToast('注册成功，请登录', 'success');
            window.location.hash = '/login';
        } catch (error) {
            // Error already shown
        } finally {
            utils.showLoading(false);
        }
    },

    // 退出登录
    logout() {
        utils.removeToken();
        if (window.app) {
            app.cart = [];
            localStorage.removeItem('cart');
            app.updateUI();
        }
        utils.showToast('已退出登录', 'success');
        window.location.hash = '/';
    }
};