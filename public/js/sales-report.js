/**
 * 销售报表模块
 */
const SalesReportService = {
    /**
     * 初始化销售报表页面
     */
    init() {
        this.loadSalesReport();
        this.loadTopProducts();
        this.setupDateFilter();
    },

    /**
     * 加载销售报表
     */
    async loadSalesReport(startDate = null, endDate = null) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                utils.showToast('请先登录', 'error');
                return;
            }

            let url = `${API_BASE}/merchant/reports/sales`;
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (params.toString()) url += '?' + params.toString();

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.code === 200) {
                this.renderSalesReport(data.data);
            } else {
                utils.showToast(data.message || '加载失败', 'error');
            }
        } catch (error) {
            console.error('加载销售报表失败:', error);
            utils.showToast('加载失败', 'error');
        }
    },

    /**
     * 渲染销售报表
     */
    renderSalesReport(report) {
        const container = document.getElementById('sales-report-container');
        if (!container) return;

        const html = `
            <div class="report-summary">
                <div class="summary-card">
                    <div class="summary-icon" style="background: #4CAF50;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                        </svg>
                    </div>
                    <div class="summary-content">
                        <div class="summary-label">总收入</div>
                        <div class="summary-value">¥${parseFloat(report.totalRevenue || 0).toFixed(2)}</div>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="summary-icon" style="background: #2196F3;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                        </svg>
                    </div>
                    <div class="summary-content">
                        <div class="summary-label">订单总数</div>
                        <div class="summary-value">${report.totalOrders || 0}</div>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="summary-icon" style="background: #FF9800;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                            <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
                        </svg>
                    </div>
                    <div class="summary-content">
                        <div class="summary-label">商品总数</div>
                        <div class="summary-value">${report.totalProducts || 0}</div>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="summary-icon" style="background: #9C27B0;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                            <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                        </svg>
                    </div>
                    <div class="summary-content">
                        <div class="summary-label">已完成订单</div>
                        <div class="summary-value">${report.completedOrders || 0}</div>
                    </div>
                </div>
            </div>

            <div class="report-section">
                <h3>商品销售明细</h3>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>商品名称</th>
                                <th>销量</th>
                                <th>库存</th>
                                <th>单价</th>
                                <th>收入</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${report.productSales && report.productSales.length > 0
                ? report.productSales.map(product => `
                                    <tr>
                                        <td>${product.productName}</td>
                                        <td>${product.sales}</td>
                                        <td>${product.stock}</td>
                                        <td>¥${parseFloat(product.price).toFixed(2)}</td>
                                        <td class="revenue">¥${parseFloat(product.revenue || 0).toFixed(2)}</td>
                                    </tr>
                                `).join('')
                : '<tr><td colspan="5" style="text-align: center;">暂无数据</td></tr>'
            }
                        </tbody>
                    </table>
                </div>
            </div>

            ${report.dailySales && Object.keys(report.dailySales).length > 0 ? `
                <div class="report-section">
                    <h3>每日销售趋势</h3>
                    <div class="chart-container">
                        <canvas id="dailySalesChart"></canvas>
                    </div>
                </div>
            ` : ''}
        `;

        container.innerHTML = html;

        // 绘制图表
        if (report.dailySales && Object.keys(report.dailySales).length > 0) {
            this.renderDailySalesChart(report.dailySales);
        }
    },

    /**
     * 绘制每日销售图表
     */
    renderDailySalesChart(dailySales) {
        const canvas = document.getElementById('dailySalesChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dates = Object.keys(dailySales);
        const values = Object.values(dailySales).map(v => parseFloat(v));

        // 简单的柱状图实现
        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        const maxValue = Math.max(...values);
        const barWidth = chartWidth / dates.length - 10;

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制坐标轴
        ctx.strokeStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();

        // 绘制柱状图
        values.forEach((value, index) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding + index * (barWidth + 10) + 5;
            const y = canvas.height - padding - barHeight;

            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(x, y, barWidth, barHeight);

            // 绘制数值
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`¥${value.toFixed(0)}`, x + barWidth / 2, y - 5);

            // 绘制日期
            ctx.save();
            ctx.translate(x + barWidth / 2, canvas.height - padding + 15);
            ctx.rotate(-Math.PI / 4);
            ctx.fillText(dates[index].substring(5), 0, 0);
            ctx.restore();
        });
    },

    /**
     * 加载热销商品
     */
    async loadTopProducts() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_BASE}/merchant/reports/top-products?limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.code === 200) {
                this.renderTopProducts(data.data);
            }
        } catch (error) {
            console.error('加载热销商品失败:', error);
        }
    },

    /**
     * 渲染热销商品
     */
    renderTopProducts(products) {
        const container = document.getElementById('top-products-container');
        if (!container) return;

        const html = `
            <h3>热销商品排行</h3>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>排名</th>
                            <th>商品名称</th>
                            <th>销量</th>
                            <th>单价</th>
                            <th>总收入</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products && products.length > 0
                ? products.map((product, index) => `
                                <tr>
                                    <td><span class="rank-badge rank-${index + 1}">${index + 1}</span></td>
                                    <td>${product.name}</td>
                                    <td>${product.sales || 0}</td>
                                    <td>¥${parseFloat(product.price).toFixed(2)}</td>
                                    <td class="revenue">¥${parseFloat(product.revenue || 0).toFixed(2)}</td>
                                </tr>
                            `).join('')
                : '<tr><td colspan="5" style="text-align: center;">暂无数据</td></tr>'
            }
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    },

    /**
     * 设置日期筛选
     */
    setupDateFilter() {
        const filterBtn = document.getElementById('apply-date-filter');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                const startDate = document.getElementById('start-date').value;
                const endDate = document.getElementById('end-date').value;
                this.loadSalesReport(startDate, endDate);
            });
        }

        const resetBtn = document.getElementById('reset-date-filter');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                document.getElementById('start-date').value = '';
                document.getElementById('end-date').value = '';
                this.loadSalesReport();
            });
        }
    }
};

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.hash === '#/merchant/reports') {
            SalesReportService.init();
        }
    });
} else {
    if (window.location.hash === '#/merchant/reports') {
        SalesReportService.init();
    }
}