// 账户注销功能模块

// 显示注销账户模态框
function showDeleteAccountModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><svg width="20" height="20" class="icon" aria-hidden="true"><use xlink:href="#icon-warning"></use></svg> 注销账户</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                    <h4 style="color: #856404; margin: 0 0 8px 0; font-size: 16px;">
                        <svg width="20" height="20" class="icon" aria-hidden="true" style="vertical-align: middle;"><use xlink:href="#icon-warning"></use></svg>
                        重要提示
                    </h4>
                    <ul style="color: #856404; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                        <li>注销账户后，您的所有个人信息将被永久删除</li>
                        <li>您的订单历史、收货地址等数据将无法恢复</li>
                        <li>如有未完成的订单，请先处理完毕</li>
                        <li>此操作不可撤销，请谨慎操作</li>
                    </ul>
                </div>
                <form onsubmit="handleDeleteAccount(event)">
                    <div class="form-group">
                        <label>请输入您的密码以确认注销 <span class="label-required">*</span></label>
                        <input type="password" name="password" required class="form-input" placeholder="请输入密码" autocomplete="current-password">
                        <div class="form-hint">为了您的账户安全，请输入密码确认身份</div>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="confirm" required style="width: auto; margin-right: 8px;">
                            我已了解注销账户的后果，确认要注销账户
                        </label>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                        <button type="submit" class="btn btn-danger">确认注销</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// 处理注销账户
async function handleDeleteAccount(event) {
    event.preventDefault();
    const form = event.target;
    const password = form.password.value;
    const confirmed = form.confirm.checked;

    if (!confirmed) {
        if (typeof utils !== 'undefined' && utils.showToast) {
            utils.showToast('请确认您已了解注销账户的后果', 'error');
        } else {
            alert('请确认您已了解注销账户的后果');
        }
        return;
    }

    // 二次确认
    if (!confirm('您确定要注销账户吗？此操作不可撤销！')) {
        return;
    }

    try {
        await utils.request('/user/delete-account', {
            method: 'DELETE',
            body: JSON.stringify({ password })
        });

        if (typeof utils !== 'undefined' && utils.showToast) {
            utils.showToast('账户注销成功，即将退出登录...', 'success');
        } else {
            alert('账户注销成功，即将退出登录...');
        }
        form.closest('.modal').remove();

        // 延迟后退出登录
        setTimeout(() => {
            if (window.app) {
                window.app.logout();
            }
        }, 2000);
    } catch (error) {
        console.error('注销账户失败:', error);
        // 错误已由utils.request处理
    }
}

// 将函数添加到ProfileService
if (typeof ProfileService !== 'undefined') {
    ProfileService.showDeleteAccountModal = showDeleteAccountModal;
    ProfileService.handleDeleteAccount = handleDeleteAccount;
}