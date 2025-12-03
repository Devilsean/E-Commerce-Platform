package com.ecommerce.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ecommerce.entity.UserPurchaseLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 用户购买日志Mapper
 */
@Mapper
public interface UserPurchaseLogMapper extends BaseMapper<UserPurchaseLog> {
    
    /**
     * 获取用户最近的购买记录
     */
    @Select("SELECT * FROM user_purchase_log WHERE user_id = #{userId} ORDER BY purchase_time DESC LIMIT #{limit}")
    List<UserPurchaseLog> getRecentPurchaseLog(@Param("userId") Long userId, @Param("limit") Integer limit);
    
    /**
     * 获取商家的购买日志（通过订单关联，包含用户信息）
     */
    @Select("SELECT DISTINCT upl.*, u.username as user_name, u.phone as user_phone " +
            "FROM user_purchase_log upl " +
            "INNER JOIN `order` o ON upl.order_id = o.id " +
            "INNER JOIN order_item oi ON o.id = oi.order_id " +
            "INNER JOIN product p ON oi.product_id = p.id " +
            "LEFT JOIN user u ON upl.user_id = u.id " +
            "WHERE p.merchant_id = #{merchantId} AND p.deleted = 0 " +
            "ORDER BY upl.purchase_time DESC " +
            "LIMIT #{limit}")
    List<UserPurchaseLog> getMerchantPurchaseLog(@Param("merchantId") Long merchantId, @Param("limit") Integer limit);
}