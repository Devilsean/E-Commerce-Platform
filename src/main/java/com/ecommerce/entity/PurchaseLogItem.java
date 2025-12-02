package com.ecommerce.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 购买日志商品明细实体类
 */
@Data
@TableName("purchase_log_item")
public class PurchaseLogItem {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long logId;
    
    private Long productId;
    
    private String productName;
    
    private BigDecimal productPrice;
    
    private Integer quantity;
    
    private BigDecimal subtotal;
    
    private LocalDateTime createTime;
}