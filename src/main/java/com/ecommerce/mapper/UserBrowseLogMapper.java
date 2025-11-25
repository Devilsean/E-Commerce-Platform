package com.ecommerce.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ecommerce.entity.UserBrowseLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 用户浏览日志Mapper
 */
@Mapper
public interface UserBrowseLogMapper extends BaseMapper<UserBrowseLog> {
    
    /**
     * 获取用户最近的浏览记录
     */
    @Select("SELECT * FROM user_browse_log WHERE user_id = #{userId} ORDER BY browse_time DESC LIMIT #{limit}")
    List<UserBrowseLog> getRecentBrowseLog(@Param("userId") Long userId, @Param("limit") Integer limit);
    
    /**
     * 获取商家商品的浏览日志
     */
    @Select("SELECT ubl.* FROM user_browse_log ubl " +
            "INNER JOIN product p ON ubl.product_id = p.id " +
            "WHERE p.merchant_id = #{merchantId} " +
            "ORDER BY ubl.browse_time DESC " +
            "LIMIT #{limit}")
    List<UserBrowseLog> getMerchantProductBrowseLog(@Param("merchantId") Long merchantId, @Param("limit") Integer limit);
}