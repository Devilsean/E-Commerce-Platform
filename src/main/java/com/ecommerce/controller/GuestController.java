package com.ecommerce.controller;

import com.ecommerce.common.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 游客模式控制器
 * 提供无需登录即可访问的功能
 */
@RestController
@RequestMapping("/guest")
public class GuestController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * 游客欢迎页面
     */
    @GetMapping("/welcome")
    public Result<Map<String, Object>> welcome() {
        Map<String, Object> data = new HashMap<>();
        data.put("message", "欢迎访问电商平台");
        data.put("mode", "游客模式");
        data.put("features", List.of(
            "浏览商品列表",
            "查看商品详情",
            "浏览商品分类",
            "搜索商品",
            "查看平台信息"
        ));
        data.put("tips", "注册登录后可以享受更多功能：购物车、下单、收藏、评价等");
        return Result.success(data);
    }

    /**
     * 获取平台统计信息（游客可见）
     */
    @GetMapping("/stats")
    public Result<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // 商品总数
            Integer productCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM product WHERE deleted = 0", 
                Integer.class
            );
            stats.put("productCount", productCount);
            
            // 分类总数
            Integer categoryCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM category WHERE deleted = 0", 
                Integer.class
            );
            stats.put("categoryCount", categoryCount);
            
            // 用户总数
            Integer userCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM user WHERE deleted = 0", 
                Integer.class
            );
            stats.put("userCount", userCount);
            
            // 商家总数
            Integer merchantCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM merchant WHERE deleted = 0", 
                Integer.class
            );
            stats.put("merchantCount", merchantCount);
            
            stats.put("status", "success");
        } catch (Exception e) {
            stats.put("status", "error");
            stats.put("message", e.getMessage());
        }
        
        return Result.success(stats);
    }

    /**
     * 获取所有商品列表（游客可见）
     */
    @GetMapping("/products")
    public Result<List<Map<String, Object>>> getProducts(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        try {
            int offset = (page - 1) * size;
            String sql = "SELECT id, name, price, stock, sales, main_image as image_url, description FROM product " +
                        "WHERE deleted = 0 AND status = 1 " +
                        "ORDER BY create_time DESC LIMIT ? OFFSET ?";
            List<Map<String, Object>> products = jdbcTemplate.queryForList(sql, size, offset);
            return Result.success(products);
        } catch (Exception e) {
            return Result.error("获取商品列表失败：" + e.getMessage());
        }
    }

    /**
     * 获取热门商品（游客可见）
     */
    @GetMapping("/hot-products")
    public Result<List<Map<String, Object>>> getHotProducts(@RequestParam(defaultValue = "10") Integer limit) {
        try {
            String sql = "SELECT id, name, price, stock, sales, main_image as image_url FROM product " +
                        "WHERE deleted = 0 AND status = 1 " +
                        "ORDER BY sales DESC, create_time DESC LIMIT ?";
            List<Map<String, Object>> products = jdbcTemplate.queryForList(sql, limit);
            return Result.success(products);
        } catch (Exception e) {
            return Result.error("获取热门商品失败：" + e.getMessage());
        }
    }

    /**
     * 搜索商品（游客可见）
     */
    @GetMapping("/search")
    public Result<List<Map<String, Object>>> searchProducts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        try {
            int offset = (page - 1) * size;
            String sql = "SELECT id, name, price, stock, sales, main_image as image_url, description FROM product " +
                        "WHERE deleted = 0 AND status = 1 " +
                        "AND (name LIKE ? OR description LIKE ?) " +
                        "ORDER BY sales DESC LIMIT ? OFFSET ?";
            String searchPattern = "%" + keyword + "%";
            List<Map<String, Object>> products = jdbcTemplate.queryForList(
                sql, searchPattern, searchPattern, size, offset
            );
            return Result.success(products);
        } catch (Exception e) {
            return Result.error("搜索失败：" + e.getMessage());
        }
    }

    /**
     * 获取商品分类列表（游客可见）
     */
    @GetMapping("/categories")
    public Result<List<Map<String, Object>>> getCategories() {
        try {
            String sql = "SELECT id, name, icon, sort_order FROM category " +
                        "WHERE deleted = 0 AND status = 1 " +
                        "ORDER BY sort_order ASC, create_time DESC";
            List<Map<String, Object>> categories = jdbcTemplate.queryForList(sql);
            return Result.success(categories);
        } catch (Exception e) {
            return Result.error("获取分类失败：" + e.getMessage());
        }
    }

    /**
     * 按分类获取商品（游客可见）
     */
    @GetMapping("/products/category/{categoryId}")
    public Result<List<Map<String, Object>>> getProductsByCategory(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        try {
            int offset = (page - 1) * size;
            String sql = "SELECT id, name, price, stock, sales, main_image as image_url FROM product " +
                        "WHERE deleted = 0 AND status = 1 AND category_id = ? " +
                        "ORDER BY sales DESC, create_time DESC LIMIT ? OFFSET ?";
            List<Map<String, Object>> products = jdbcTemplate.queryForList(sql, categoryId, size, offset);
            return Result.success(products);
        } catch (Exception e) {
            return Result.error("获取商品失败：" + e.getMessage());
        }
    }

    /**
     * 获取商品详情（游客可见）
     */
    @GetMapping("/product/{productId}")
    public Result<Map<String, Object>> getProductDetail(@PathVariable Long productId) {
        try {
            String sql = "SELECT p.*, c.name as category_name, m.shop_name as merchant_name " +
                        "FROM product p " +
                        "LEFT JOIN category c ON p.category_id = c.id " +
                        "LEFT JOIN merchant m ON p.merchant_id = m.id " +
                        "WHERE p.id = ? AND p.deleted = 0";
            List<Map<String, Object>> result = jdbcTemplate.queryForList(sql, productId);
            if (result.isEmpty()) {
                return Result.error("商品不存在");
            }
            return Result.success(result.get(0));
        } catch (Exception e) {
            return Result.error("获取商品详情失败：" + e.getMessage());
        }
    }

    /**
     * 获取商品评论列表（游客可见）
     */
    @GetMapping("/product/{productId}/reviews")
    public Result<Map<String, Object>> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        try {
            int offset = (page - 1) * size;
            
            // 获取评论列表（包含用户信息）
            String sql = "SELECT r.id, r.rating, r.content, r.images, r.create_time, " +
                        "u.username, u.nickname, u.avatar " +
                        "FROM product_review r " +
                        "LEFT JOIN user u ON r.user_id = u.id " +
                        "WHERE r.product_id = ? AND r.deleted = 0 " +
                        "ORDER BY r.create_time DESC LIMIT ? OFFSET ?";
            List<Map<String, Object>> reviews = jdbcTemplate.queryForList(sql, productId, size, offset);
            
            // 获取评论总数
            String countSql = "SELECT COUNT(*) FROM product_review WHERE product_id = ? AND deleted = 0";
            Integer total = jdbcTemplate.queryForObject(countSql, Integer.class, productId);
            
            // 获取评分统计
            String statsSql = "SELECT " +
                        "COUNT(*) as total_count, " +
                        "AVG(rating) as avg_rating, " +
                        "SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star, " +
                        "SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star, " +
                        "SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star, " +
                        "SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star, " +
                        "SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star " +
                        "FROM product_review WHERE product_id = ? AND deleted = 0";
            Map<String, Object> stats = jdbcTemplate.queryForMap(statsSql, productId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("reviews", reviews);
            result.put("total", total);
            result.put("page", page);
            result.put("size", size);
            result.put("stats", stats);
            
            return Result.success(result);
        } catch (Exception e) {
            return Result.error("获取评论失败：" + e.getMessage());
        }
    }
}