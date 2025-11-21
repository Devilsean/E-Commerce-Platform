package com.ecommerce.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ecommerce.entity.ProductReview;
import org.apache.ibatis.annotations.Mapper;

/**
 * 商品评价Mapper接口
 */
@Mapper
public interface ProductReviewMapper extends BaseMapper<ProductReview> {
}