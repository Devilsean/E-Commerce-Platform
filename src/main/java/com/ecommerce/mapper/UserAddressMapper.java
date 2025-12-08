package com.ecommerce.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ecommerce.entity.UserAddress;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 用户地址Mapper接口
 */
@Mapper
public interface UserAddressMapper extends BaseMapper<UserAddress> {
    
    /**
     * 获取用户的所有地址
     */
    @Select("SELECT * FROM user_address WHERE user_id = #{userId} AND deleted = 0 ORDER BY is_default DESC, create_time DESC")
    List<UserAddress> getUserAddresses(Long userId);
    
    /**
     * 获取用户的默认地址
     */
    @Select("SELECT * FROM user_address WHERE user_id = #{userId} AND is_default = 1 AND deleted = 0 LIMIT 1")
    UserAddress getDefaultAddress(Long userId);
}