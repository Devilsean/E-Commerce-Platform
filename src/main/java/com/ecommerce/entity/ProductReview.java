package com.ecommerce.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 商品评价实体类
 */
@Data
@TableName("product_review")
public class ProductReview {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 订单ID
     */
    private Long orderId;
    
    /**
     * 商品ID
     */
    private Long productId;
    
    /**
     * 用户ID
     */
    private Long userId;
    
    /**
     * 评分：1-5星
     */
    private Integer rating;
    
    /**
     * 评价内容
     */
    private String content;
    
    /**
     * 评价图片（JSON数组）
     */
    private String images;
    
    /**
     * 逻辑删除：0-未删除，1-已删除
     */
    @TableLogic
    private Integer deleted;
    
    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    
    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}