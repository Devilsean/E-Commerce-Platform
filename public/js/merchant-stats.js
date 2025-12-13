/**
 * 商家数据分析模块 - 独立版本
 */
const MerchantStatsService = {
    /**
     * 显示商家数据分析弹窗
     */
    async show() {
        // 移除已存在的弹窗
        const existingModal = document.getElementById('merchant-stats-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // 创建弹窗
        const modal = document.createElement('div');
        modal.id = 'merchant-stats-modal';
        modal.className = 'modal';
        modal.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; justify-content: center; align-items: center;';

        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; width: 90%; max-width: 800px; max-height: 90vh; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
                <div style="padding: 16px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 18px;">商家数据分析</h3>
                    <button onclick="document.getElementById('merchant-stats-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>
                </div>
                <div id="merchant-stats-body" style="padding: 20px; max-height: calc(90vh - 120px); overflow-y: auto;">
                    <div style="text-align: center; padding: 40px;">
                        <div style="width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top-color: #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                        <p style="margin-top: 16px; color: #666;">正在加载数据...</p>
                    </div>
                </div>
                <div style="padding: 12px 20px; border-top: 1px solid #eee; text-align: right;">
                    <button onclick="document.getElementById('merchant-stats-modal').remove()" style="padding: 8px 24px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer;">关闭</button>
                </div>
            </div>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        `;

        document.body.appendChild(modal);

        // 加载数据
        await this.loadData();
    },

    /**
     * 加载统计数据
     */
    async loadData() {
        const container = document.getElementById('merchant-stats-body');
        if (!container) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                this.showError(container, '请先登录');
                return;
            }

            // 检查用户类型
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                try {
                    const user = JSON.parse(userInfo);
                    if (user.userType !== 2) {
                        this.showError(container, '只有商家账户才能查看数据分析');
                        return;
                    }
                } catch (e) {
                    console.error('解析用户信息失败:', e);
                }
            }

            // 构建请求 URL - 检查 API_BASE 是否已定义
            const apiBase = (typeof API_BASE !== 'undefined') ? API_BASE : '/api';
            const requestUrl = apiBase + '/merchant/statistics';

            console.log('请求数据分析接口:', requestUrl);

            // 发送请求
            const response = await fetch(requestUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });

            console.log('响应状态:', response.status, response.statusText);

            if (!response.ok) {
                // 尝试读取错误信息
                let errorMsg = `HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorMsg = errorData.message;
                    }
                } catch (e) {
                    // 无法解析 JSON，使用默认错误信息
                    if (response.status === 404) {
                        errorMsg = '接口不存在，请确认后端服务已启动';
                    } else if (response.status === 401) {
                        errorMsg = '登录已过期，请重新登录';
                    } else if (response.status === 403) {
                        errorMsg = '无权限访问，请以商家身份登录';
                    }
                }
                throw new Error(errorMsg);
            }

            const text = await response.text();
            if (!text) {
                throw new Error('服务器返回空响应');
            }

            const result = JSON.parse(text);
            console.log('API 响应:', result);

            if (result.code !== 200) {
                throw new Error(result.message || '加载失败');
            }

            const stats = result.data;

            if (!stats) {
                this.showError(container, '数据为空');
                return;
            }

            // 渲染数据
            this.render(container, stats);

        } catch (error) {
            console.error('加载商家统计失败:', error);
            this.showError(container, error.message || '网络错误，请检查后端服务是否正常运行');
        }
    },

    /**
     * 渲染统计数据
     */
    render(container, stats) {
        const productStats = stats.productStats || {};
        const orderStats = stats.orderStats || {};
        const topProducts = stats.topProducts || [];

        container.innerHTML = `
            <!-- 核心指标卡片 -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px;">
                <div style="background: #000000ff; color: white; padding: 16px; border-radius: 10px;">
                    <div style="font-size: 13px; opacity: 0.9;">商品总数</div>
                    <div style="font-size: 28px; font-weight: bold; margin: 6px 0;">${productStats.totalProducts || 0}</div>
                    <div style="font-size: 11px; opacity: 0.8;">在线 ${productStats.onlineProducts || 0} / 下线 ${productStats.offlineProducts || 0}</div>
                </div>
                <div style="background: #000000ff; color: white; padding: 16px; border-radius: 10px;">
                    <div style="font-size: 13px; opacity: 0.9;">总销量</div>
                    <div style="font-size: 28px; font-weight: bold; margin: 6px 0;">${productStats.totalSales || 0}</div>
                    <div style="font-size: 11px; opacity: 0.8;">库存 ${productStats.totalStock || 0}</div>
                </div>
                <div style="background: #000000ff; color: white; padding: 16px; border-radius: 10px;">
                    <div style="font-size: 13px; opacity: 0.9;">订单总数</div>
                    <div style="font-size: 28px; font-weight: bold; margin: 6px 0;">${orderStats.totalOrders || 0}</div>
                    <div style="font-size: 11px; opacity: 0.8;">已完成 ${orderStats.completedOrders || 0}</div>
                </div>
                <div style="background: #000000ff; color: white; padding: 16px; border-radius: 10px;">
                    <div style="font-size: 13px; opacity: 0.9;">预估收入</div>
                    <div style="font-size: 28px; font-weight: bold; margin: 6px 0;">¥${this.formatNumber(orderStats.totalRevenue)}</div>
                    <div style="font-size: 11px; opacity: 0.8;">待收 ¥${this.formatNumber(orderStats.pendingRevenue)}</div>
                </div>
            </div>

            <!-- 订单状态 -->
            <div style="background: #f8f9fa; padding: 16px; border-radius: 10px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #333;"> 订单状态分布</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    <div style="flex: 1; min-width: 70px; text-align: center; padding: 10px; background: #fff3e0; border-radius: 6px;">
                        <div style="font-size: 20px; font-weight: bold; color: #ff9800;">${orderStats.pendingOrders || 0}</div>
                        <div style="font-size: 11px; color: #666;">待付款</div>
                    </div>
                    <div style="flex: 1; min-width: 70px; text-align: center; padding: 10px; background: #e3f2fd; border-radius: 6px;">
                        <div style="font-size: 20px; font-weight: bold; color: #2196f3;">${orderStats.paidOrders || 0}</div>
                        <div style="font-size: 11px; color: #666;">待发货</div>
                    </div>
                    <div style="flex: 1; min-width: 70px; text-align: center; padding: 10px; background: #f3e5f5; border-radius: 6px;">
                        <div style="font-size: 20px; font-weight: bold; color: #9c27b0;">${orderStats.shippedOrders || 0}</div>
                        <div style="font-size: 11px; color: #666;">已发货</div>
                    </div>
                    <div style="flex: 1; min-width: 70px; text-align: center; padding: 10px; background: #e8f5e9; border-radius: 6px;">
                        <div style="font-size: 20px; font-weight: bold; color: #4caf50;">${orderStats.completedOrders || 0}</div>
                        <div style="font-size: 11px; color: #666;">已完成</div>
                    </div>
                    <div style="flex: 1; min-width: 70px; text-align: center; padding: 10px; background: #ffebee; border-radius: 6px;">
                        <div style="font-size: 20px; font-weight: bold; color: #f44336;">${orderStats.cancelledOrders || 0}</div>
                        <div style="font-size: 11px; color: #666;">已取消</div>
                    </div>
                </div>
            </div>

            <!-- 热销商品 -->
            <div style="background: #f8f9fa; padding: 16px; border-radius: 10px;">
                <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #333;"> 热销商品 TOP5</h4>
                ${topProducts.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <thead>
                            <tr style="background: #fff;">
                                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">商品</th>
                                <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">单价</th>
                                <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">销量</th>
                                <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">收入</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topProducts.map((p, i) => `
                                <tr style="background: ${i % 2 === 0 ? '#fff' : '#fafafa'};">
                                    <td style="padding: 8px;">
                                        <span style="display: inline-block; width: 18px; height: 18px; line-height: 18px; text-align: center; background: ${i < 3 ? '#ff9800' : '#bbb'}; color: white; border-radius: 50%; font-size: 10px; margin-right: 6px;">${i + 1}</span>
                                        ${this.escapeHtml(p.name || '未知')}
                                    </td>
                                    <td style="padding: 8px; text-align: right;">¥${this.formatNumber(p.price)}</td>
                                    <td style="padding: 8px; text-align: right; font-weight: 600;">${p.sales || 0}</td>
                                    <td style="padding: 8px; text-align: right; color: #f44336; font-weight: 600;">¥${this.formatNumber(p.revenue)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p style="text-align: center; color: #999; padding: 20px;">暂无销售数据</p>'}
            </div>
        `;
    },

    /**
     * 显示错误信息
     */
    showError(container, message) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="color: #666; margin-bottom: 8px;">加载失败</p>
                <p style="font-size: 12px; color: #999; margin-bottom: 16px;">${this.escapeHtml(message)}</p>
                <button onclick="MerchantStatsService.loadData()" style="padding: 8px 20px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer;">重试</button>
            </div>
        `;
    },

    /**
     * 格式化数字
     */
    formatNumber(value) {
        const num = parseFloat(value || 0);
        return num.toFixed(2);
    },

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// 全局函数，方便调用
function showMerchantStatsModal() {
    MerchantStatsService.show();
}