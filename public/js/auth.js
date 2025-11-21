// 认证服务模块

const Auth = {
    // 用户注册
    async register(userData) {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/user/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (data.code === 200) {
                showMessage('注册成功！请登录', 'success');
                Router.navigate('login');
                return true;
            } else {
                showMessage(data.message || '注册失败', 'error');
                return false;
            }
        } catch (error) {
            showMessage('网络错误，请稍后重试', 'error');
            return false;
        }
    },

    // 用户登录
    async login(account, password, userType) {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ account, password, userType })
            });

            const data = await response.json();

            if (data.code === 200) {
                // 保存登录信息
                localStorage.setItem('token', data.data.token);
                
                // 确保用户信息包含userType
                const userInfo = data.data.userInfo;
                if (!userInfo.userType) {
                    userInfo.userType = userType;
                }
                
                Store.setCurrentUser(userInfo);

                const userTypeText = userType === 2 ? '商家' : '用户';
                showMessage(`${userTypeText}登录成功！`, 'success');
                Router.navigate('home');
                return true;
            } else {
                showMessage(data.message || '登录失败', 'error');
                return false;
            }
        } catch (error) {
            showMessage('网络错误，请稍后重试', 'error');
            return false;
        }
    },

    // 退出登录
    logout() {
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('cart');
            Store.setCurrentUser(null);
            Store.clearCart();
            showMessage('已退出登录', 'success');
            Router.navigate('home');
        }
    },

    // 检查登录状态
    isLoggedIn() {
        return !!Store.getCurrentUser() && !!localStorage.getItem('token');
    },

    // 获取Token
    getToken() {
        return localStorage.getItem('token');
    }
};

// 注册表单处理
async function register(event) {
    event.preventDefault();

    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const phone = document.getElementById('regPhone').value;
    const email = document.getElementById('regEmail').value;
    
    // 获取用户选择的身份类型
    const userType = document.querySelector('input[name="userType"]:checked').value;

    await Auth.register({ username, password, phone, email, userType: parseInt(userType) });
}

// 登录表单处理
async function login(event) {
    event.preventDefault();

    const account = document.getElementById('loginAccount').value;
    const password = document.getElementById('loginPassword').value;
    
    // 获取用户选择的身份类型
    const userType = document.querySelector('input[name="loginUserType"]:checked').value;

    await Auth.login(account, password, parseInt(userType));
}

// 退出登录
function logout() {
    Auth.logout();
}