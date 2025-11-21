package com.ecommerce.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ecommerce.common.Result;
import com.ecommerce.entity.Product;
import com.ecommerce.mapper.ProductMapper;
import com.ecommerce.utils.JwtUtil;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 商家控制器
 * 提供商家商品管理相关接口
 */
@RestController
@RequestMapping("/merchant")
public class MerchantController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ProductMapper productMapper;

    /**
     * 从请求头中提取并验证Token，返回商家ID
     */
    private Long getMerchantIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        
        String token = authHeader.substring(7);
        
        // 验证token是否有效
        if (!jwtUtil.validateToken(token)) {
            return null;
        }
        
        // 验证用户类型是否为商家
        Integer userType = jwtUtil.getUserTypeFromToken(token);
        if (userType == null || userType != 2) {
            return null;
        }
        
        // 返回用户ID作为商家ID
        return jwtUtil.getUserIdFromToken(token);
    }

    /**
     * 获取商家所有商品列表
     */
    @GetMapping("/products")
    public Result<List<Product>> getProducts(@RequestHeader("Authorization") String authHeader) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限访问，请以商家身份登录");
        }
        
        // 从数据库查询该商家的商品
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Product::getMerchantId, merchantId)
               .orderByDesc(Product::getCreateTime);
        List<Product> products = productMapper.selectList(wrapper);
        
        return Result.success(products);
    }

    /**
     * 根据ID获取商品详情
     */
    @GetMapping("/products/{id}")
    public Result<Product> getProduct(@PathVariable Long id, 
                                      @RequestHeader("Authorization") String authHeader) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限访问，请以商家身份登录");
        }
        
        Product product = productMapper.selectById(id);
        if (product == null) {
            return Result.error("商品不存在");
        }
        
        // 验证商品是否属于该商家
        if (!merchantId.equals(product.getMerchantId())) {
            return Result.error("无权限访问该商品");
        }
        
        return Result.success(product);
    }

    /**
     * 添加新商品
     */
    @PostMapping("/products")
    public Result<Product> addProduct(@RequestBody ProductRequest request,
                                      @RequestHeader("Authorization") String authHeader) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限操作，请以商家身份登录");
        }
        
        // 验证必填字段
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            return Result.error("商品名称不能为空");
        }
        if (request.getPrice() == null || request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            return Result.error("商品价格必须大于0");
        }
        if (request.getStock() == null || request.getStock() < 0) {
            return Result.error("库存数量不能为负数");
        }

        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setOriginalPrice(request.getOriginalPrice());
        product.setStock(request.getStock());
        product.setSales(0);
        product.setMainImage(request.getMainImage());
        product.setImages(request.getImages());
        product.setStatus(request.getStatus() != null ? request.getStatus() : 1);
        product.setCategoryId(request.getCategoryId() != null ? request.getCategoryId() : 1L);
        product.setMerchantId(merchantId); // 使用从token中获取的商家ID
        
        // 保存到数据库
        int result = productMapper.insert(product);
        if (result <= 0) {
            return Result.error("添加商品失败");
        }
        
        return Result.success(product);
    }

    /**
     * 更新商品信息
     */
    @PutMapping("/products/{id}")
    public Result<Product> updateProduct(@PathVariable Long id, 
                                         @RequestBody ProductRequest request,
                                         @RequestHeader("Authorization") String authHeader) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限操作，请以商家身份登录");
        }
        
        Product existingProduct = productMapper.selectById(id);
        if (existingProduct == null) {
            return Result.error("商品不存在");
        }
        
        // 验证商品是否属于该商家
        if (!merchantId.equals(existingProduct.getMerchantId())) {
            return Result.error("无权限修改该商品");
        }

        // 验证必填字段
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            return Result.error("商品名称不能为空");
        }
        if (request.getPrice() == null || request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            return Result.error("商品价格必须大于0");
        }
        if (request.getStock() == null || request.getStock() < 0) {
            return Result.error("库存数量不能为负数");
        }

        // 更新商品信息
        existingProduct.setName(request.getName());
        existingProduct.setDescription(request.getDescription());
        existingProduct.setPrice(request.getPrice());
        existingProduct.setOriginalPrice(request.getOriginalPrice());
        existingProduct.setStock(request.getStock());
        existingProduct.setMainImage(request.getMainImage());
        existingProduct.setImages(request.getImages());
        if (request.getStatus() != null) {
            existingProduct.setStatus(request.getStatus());
        }
        if (request.getCategoryId() != null) {
            existingProduct.setCategoryId(request.getCategoryId());
        }
        
        // 更新到数据库
        int result = productMapper.updateById(existingProduct);
        if (result <= 0) {
            return Result.error("更新商品失败");
        }
        
        return Result.success(existingProduct);
    }

    /**
     * 删除商品
     */
    @DeleteMapping("/products/{id}")
    public Result<Void> deleteProduct(@PathVariable Long id,
                                      @RequestHeader("Authorization") String authHeader) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限操作，请以商家身份登录");
        }
        
        Product product = productMapper.selectById(id);
        if (product == null) {
            return Result.error("商品不存在");
        }
        
        // 验证商品是否属于该商家
        if (!merchantId.equals(product.getMerchantId())) {
            return Result.error("无权限删除该商品");
        }
        
        // 逻辑删除
        int result = productMapper.deleteById(id);
        if (result <= 0) {
            return Result.error("删除商品失败");
        }
        
        return Result.success(null);
    }

    /**
     * 更新商品状态（上架/下架）
     */
    @PutMapping("/products/{id}/status")
    public Result<Product> updateProductStatus(@PathVariable Long id, 
                                                @RequestBody Map<String, Integer> request,
                                                @RequestHeader("Authorization") String authHeader) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限操作，请以商家身份登录");
        }
        
        Product product = productMapper.selectById(id);
        if (product == null) {
            return Result.error("商品不存在");
        }
        
        // 验证商品是否属于该商家
        if (!merchantId.equals(product.getMerchantId())) {
            return Result.error("无权限修改该商品状态");
        }
        
        Integer status = request.get("status");
        if (status == null || (status != 0 && status != 1)) {
            return Result.error("状态值无效");
        }
        
        product.setStatus(status);
        
        // 更新到数据库
        int result = productMapper.updateById(product);
        if (result <= 0) {
            return Result.error("更新状态失败");
        }
        
        return Result.success(product);
    }

    /**
     * 获取商家统计数据
     */
    @GetMapping("/stats")
    public Result<Map<String, Object>> getStats(@RequestHeader("Authorization") String authHeader) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限访问，请以商家身份登录");
        }
        
        Map<String, Object> stats = new ConcurrentHashMap<>();
        
        // 从数据库查询该商家的商品
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Product::getMerchantId, merchantId);
        List<Product> products = productMapper.selectList(wrapper);
        
        stats.put("totalProducts", products.size());
        stats.put("totalSales", products.stream().mapToInt(p -> p.getSales() != null ? p.getSales() : 0).sum());
        stats.put("totalStock", products.stream().mapToInt(p -> p.getStock() != null ? p.getStock() : 0).sum());
        stats.put("totalRevenue", products.stream()
                .mapToDouble(p -> {
                    BigDecimal price = p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO;
                    Integer sales = p.getSales() != null ? p.getSales() : 0;
                    return price.doubleValue() * sales;
                })
                .sum());
        stats.put("onlineProducts", products.stream().filter(p -> p.getStatus() != null && p.getStatus() == 1).count());
        stats.put("offlineProducts", products.stream().filter(p -> p.getStatus() != null && p.getStatus() == 0).count());
        
        return Result.success(stats);
    }

    /**
     * 商品请求DTO
     */
    @Data
    public static class ProductRequest {
        private String name;
        private String description;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private Integer stock;
        private String mainImage;
        private String images;
        private Integer status;
        private Long categoryId;
    }
}