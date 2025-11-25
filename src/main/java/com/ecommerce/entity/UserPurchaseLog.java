package com.ecommerce.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 用户购买日志实体类
 */
@Data
@TableName("user_purchase_log")
public class UserPurchaseLog {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long userId;
    
    private Long orderId;
    
    private BigDecimal totalAmount;
    
    private Integer itemCount;
    
    private LocalDateTime purchaseTime;
    
    private String ipAddress;
    
    private LocalDateTime createTime;
}