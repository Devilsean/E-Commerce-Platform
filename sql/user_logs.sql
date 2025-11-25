-- 用户浏览日志表
CREATE TABLE IF NOT EXISTS user_browse_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    product_name VARCHAR(255) COMMENT '商品名称（冗余字段，便于查询）',
    product_price DECIMAL(10, 2) COMMENT '商品价格（冗余字段）',
    browse_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '浏览时间',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    user_agent VARCHAR(500) COMMENT '用户代理',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id),
    INDEX idx_browse_time (browse_time),
    INDEX idx_user_product (user_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户浏览日志表';

-- 用户购买日志表
CREATE TABLE IF NOT EXISTS user_purchase_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    total_amount DECIMAL(10, 2) NOT NULL COMMENT '订单总金额',
    item_count INT NOT NULL COMMENT '商品数量',
    purchase_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '购买时间',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_id (user_id),
    INDEX idx_order_id (order_id),
    INDEX idx_purchase_time (purchase_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户购买日志表';

-- 购买日志商品明细表
CREATE TABLE IF NOT EXISTS purchase_log_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '明细ID',
    log_id BIGINT NOT NULL COMMENT '购买日志ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    product_name VARCHAR(255) NOT NULL COMMENT '商品名称',
    product_price DECIMAL(10, 2) NOT NULL COMMENT '商品单价',
    quantity INT NOT NULL COMMENT '购买数量',
    subtotal DECIMAL(10, 2) NOT NULL COMMENT '小计金额',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_log_id (log_id),
    INDEX idx_product_id (product_id),
    FOREIGN KEY (log_id) REFERENCES user_purchase_log(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='购买日志商品明细表';