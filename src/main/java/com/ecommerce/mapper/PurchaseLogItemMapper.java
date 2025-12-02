package com.ecommerce.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ecommerce.entity.PurchaseLogItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 购买日志商品明细Mapper
 */
@Mapper
public interface PurchaseLogItemMapper extends BaseMapper<PurchaseLogItem> {
    
    /**
     * 根据日志ID获取商品明细
     */
    @Select("SELECT * FROM purchase_log_item WHERE log_id = #{logId} ORDER BY create_time DESC")
    List<PurchaseLogItem> getItemsByLogId(@Param("logId") Long logId);
    
    /**
     * 批量插入商品明细
     */
    default void batchInsert(List<PurchaseLogItem> items) {
        items.forEach(this::insert);
    }
}