package com.ecommerce.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 用户浏览日志实体类
 */
@Data
@TableName("user_browse_log")
public class UserBrowseLog {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long userId;
    
    private Long productId;
    
    private String productName;
    
    private BigDecimal productPrice;
    
    private LocalDateTime browseTime;
    
    private String ipAddress;
    
    private String userAgent;
    
    private LocalDateTime createTime;
}