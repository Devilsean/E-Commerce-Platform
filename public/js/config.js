// 应用配置
const CONFIG = {
    API_BASE: '/api',
    APP_NAME: '精品商城',
    VERSION: '1.0.0'
};

// 订单状态映射
const ORDER_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    SHIPPED: 'shipped',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

// 订单状态文本
const ORDER_STATUS_TEXT = {
    all: '全部',
    pending: '待付款',
    paid: '待发货',
    shipped: '待收货',
    completed: '已完成',
    cancelled: '已取消'
};

// 订单状态徽章样式
const ORDER_STATUS_BADGE = {
    pending: 'badge-warning',
    paid: 'badge-info',
    shipped: 'badge-info',
    completed: 'badge-success',
    cancelled: 'badge-danger'
};