package com.ecommerce.common;

import lombok.Getter;

/**
 * 响应状态码枚举
 */
@Getter
public enum ResultCode {
    
    // 通用状态码
    SUCCESS(200, "操作成功"),
    ERROR(500, "操作失败"),
    PARAM_ERROR(400, "参数错误"),
    UNAUTHORIZED(401, "未授权"),
    FORBIDDEN(403, "禁止访问"),
    NOT_FOUND(404, "资源不存在"),
    
    // 用户相关状态码 (1xxx)
    USER_NOT_FOUND(1001, "用户不存在"),
    USER_ALREADY_EXISTS(1002, "用户已存在"),
    USER_PASSWORD_ERROR(1003, "密码错误"),
    USER_DISABLED(1004, "用户已被禁用"),
    USER_NOT_LOGIN(1005, "用户未登录"),
    USER_TOKEN_EXPIRED(1006, "登录已过期"),
    USER_TOKEN_INVALID(1007, "无效的token"),
    VERIFICATION_CODE_ERROR(1008, "验证码错误"),
    VERIFICATION_CODE_EXPIRED(1009, "验证码已过期"),
    PASSWORD_COMPLEXITY_ERROR(1010, "密码复杂度不符合要求"),
    
    // 商家相关状态码 (2xxx)
    MERCHANT_NOT_FOUND(2001, "商家不存在"),
    MERCHANT_DISABLED(2002, "商家已被禁用"),
    MERCHANT_NOT_AUTHORIZED(2003, "无商家权限"),
    
    // 商品相关状态码 (3xxx)
    PRODUCT_NOT_FOUND(3001, "商品不存在"),
    PRODUCT_STOCK_INSUFFICIENT(3002, "商品库存不足"),
    PRODUCT_OFF_SHELF(3003, "商品已下架"),
    CATEGORY_NOT_FOUND(3004, "分类不存在"),
    CATEGORY_HAS_PRODUCTS(3005, "分类下存在商品，无法删除"),
    
    // 购物车相关状态码 (4xxx)
    CART_ITEM_NOT_FOUND(4001, "购物车商品不存在"),
    CART_ITEM_EXCEED_STOCK(4002, "购物车商品数量超过库存"),
    
    // 订单相关状态码 (5xxx)
    ORDER_NOT_FOUND(5001, "订单不存在"),
    ORDER_STATUS_ERROR(5002, "订单状态错误"),
    ORDER_CANNOT_CANCEL(5003, "订单无法取消"),
    ORDER_ALREADY_PAID(5004, "订单已支付"),
    ORDER_NOT_PAID(5005, "订单未支付"),
    ORDER_TIMEOUT(5006, "订单已超时"),
    
    // 支付相关状态码 (6xxx)
    PAYMENT_ERROR(6001, "支付失败"),
    PAYMENT_TIMEOUT(6002, "支付超时"),
    PAYMENT_AMOUNT_ERROR(6003, "支付金额错误"),
    PAYMENT_VERIFY_ERROR(6004, "支付验证失败"),
    
    // 地址相关状态码 (7xxx)
    ADDRESS_NOT_FOUND(7001, "收货地址不存在"),
    ADDRESS_LIMIT_EXCEEDED(7002, "收货地址数量超过限制"),
    
    // 文件上传相关状态码 (8xxx)
    FILE_UPLOAD_ERROR(8001, "文件上传失败"),
    FILE_TYPE_ERROR(8002, "文件类型不支持"),
    FILE_SIZE_EXCEEDED(8003, "文件大小超过限制"),
    
    // 系统相关状态码 (9xxx)
    SYSTEM_ERROR(9001, "系统错误"),
    DATABASE_ERROR(9002, "数据库错误"),
    REDIS_ERROR(9003, "Redis错误");
    
    private final Integer code;
    private final String message;
    
    ResultCode(Integer code, String message) {
        this.code = code;
        this.message = message;
    }
}