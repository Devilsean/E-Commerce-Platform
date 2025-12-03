package com.ecommerce.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ecommerce.common.Result;
import com.ecommerce.entity.*;
import com.ecommerce.mapper.*;
import com.ecommerce.service.UserLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Map<Long, User> userStore = new ConcurrentHashMap<>();
    private static final Map<Long, Merchant> merchantStore = new ConcurrentHashMap<>();
    private static final Map<Long, Product> productStore = new ConcurrentHashMap<>();
    private static final Map<Long, Order> orderStore = new ConcurrentHashMap<>();

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private OrderMapper orderMapper;

    @Autowired
    private UserBrowseLogMapper browseLogMapper;

    @Autowired
    private UserPurchaseLogMapper purchaseLogMapper;

    @Autowired
    private UserLogService userLogService;

    // 用户管理
    @GetMapping("/users")
    public Result<List<User>> getUsers() {
        return Result.success(new ArrayList<>(userStore.values()));
    }

    @DeleteMapping("/users/{id}")
    public Result<Void> deleteUser(@PathVariable Long id) {
        userStore.remove(id);
        return Result.success(null);
    }

    @PutMapping("/users/{id}/status")
    public Result<Void> updateUserStatus(@PathVariable Long id, @RequestParam Integer status) {
        User user = userStore.get(id);
        if (user == null) {
            return Result.error("用户不存在");
        }
        user.setStatus(status);
        return Result.success(null);
    }

    // 商家管理
    @GetMapping("/merchants")
    public Result<List<Merchant>> getMerchants() {
        return Result.success(new ArrayList<>(merchantStore.values()));
    }

    @PutMapping("/merchants/{id}/status")
    public Result<Void> updateMerchantStatus(@PathVariable Long id, @RequestParam Integer status) {
        Merchant merchant = merchantStore.get(id);
        if (merchant == null) {
            return Result.error("商家不存在");
        }
        merchant.setStatus(status);
        return Result.success(null);
    }

    @DeleteMapping("/merchants/{id}")
    public Result<Void> deleteMerchant(@PathVariable Long id) {
        merchantStore.remove(id);
        return Result.success(null);
    }

    // 商品管理
    @GetMapping("/products")
    public Result<List<Product>> getProducts() {
        return Result.success(new ArrayList<>(productStore.values()));
    }

    @DeleteMapping("/products/{id}")
    public Result<Void> deleteProduct(@PathVariable Long id) {
        productStore.remove(id);
        return Result.success(null);
    }

    @PutMapping("/products/{id}/status")
    public Result<Void> updateProductStatus(@PathVariable Long id, @RequestParam Integer status) {
        Product product = productStore.get(id);
        if (product == null) {
            return Result.error("商品不存在");
        }
        product.setStatus(status);
        return Result.success(null);
    }

    // 订单管理
    @GetMapping("/orders")
    public Result<List<Order>> getOrders() {
        return Result.success(new ArrayList<>(orderStore.values()));
    }

    @GetMapping("/orders/{id}")
    public Result<Order> getOrder(@PathVariable Long id) {
        Order order = orderStore.get(id);
        if (order == null) {
            return Result.error("订单不存在");
        }
        return Result.success(order);
    }

    // 平台统计
    @GetMapping("/stats")
    public Result<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userStore.size());
        stats.put("totalMerchants", merchantStore.size());
        stats.put("totalProducts", productStore.size());
        stats.put("totalOrders", orderStore.size());
        
        // 计算总销售额
        double totalRevenue = orderStore.values().stream()
                .mapToDouble(order -> order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0.0)
                .sum();
        stats.put("totalRevenue", totalRevenue);
        
        return Result.success(stats);
    }

    // 分类管理
    @GetMapping("/categories")
    public Result<List<Map<String, Object>>> getCategories() {
        List<Map<String, Object>> categories = new ArrayList<>();
        Map<String, Object> cat1 = new HashMap<>();
        cat1.put("id", 1);
        cat1.put("name", "电子产品");
        cat1.put("productCount", 150);
        categories.add(cat1);
        
        Map<String, Object> cat2 = new HashMap<>();
        cat2.put("id", 2);
        cat2.put("name", "服装鞋包");
        cat2.put("productCount", 320);
        categories.add(cat2);
        
        return Result.success(categories);
    }

    // 客户管理 - 获取所有用户列表
    @GetMapping("/customers")
    public Result<List<Map<String, Object>>> getCustomers(@RequestParam(required = false) String keyword) {
        try {
            LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
            if (keyword != null && !keyword.trim().isEmpty()) {
                wrapper.and(w -> w.like(User::getUsername, keyword)
                        .or().like(User::getPhone, keyword)
                        .or().like(User::getEmail, keyword));
            }
            wrapper.orderByDesc(User::getCreateTime);
            
            List<User> users = userMapper.selectList(wrapper);
            List<Map<String, Object>> result = new ArrayList<>();
            
            for (User user : users) {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("username", user.getUsername());
                userMap.put("phone", user.getPhone());
                userMap.put("email", user.getEmail());
                userMap.put("userType", user.getUserType());
                userMap.put("status", user.getStatus());
                userMap.put("createTime", user.getCreateTime());
                
                // 统计用户订单数
                LambdaQueryWrapper<Order> orderWrapper = new LambdaQueryWrapper<>();
                orderWrapper.eq(Order::getUserId, user.getId());
                Long orderCount = orderMapper.selectCount(orderWrapper);
                userMap.put("orderCount", orderCount);
                
                // 统计浏览次数
                Long browseCount = browseLogMapper.selectCount(
                    new LambdaQueryWrapper<UserBrowseLog>().eq(UserBrowseLog::getUserId, user.getId())
                );
                userMap.put("browseCount", browseCount);
                
                result.add(userMap);
            }
            
            return Result.success(result);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("获取客户列表失败：" + e.getMessage());
        }
    }

    // 获取指定用户的浏览日志
    @GetMapping("/customers/{userId}/browse-logs")
    public Result<List<UserBrowseLog>> getCustomerBrowseLogs(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "50") Integer limit) {
        try {
            List<UserBrowseLog> logs = browseLogMapper.getRecentBrowseLog(userId, limit);
            return Result.success(logs);
        } catch (Exception e) {
            return Result.error("获取浏览日志失败：" + e.getMessage());
        }
    }

    // 获取指定用户的购买日志
    @GetMapping("/customers/{userId}/purchase-logs")
    public Result<List<Map<String, Object>>> getCustomerPurchaseLogs(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "50") Integer limit) {
        try {
            List<Map<String, Object>> logs = userLogService.getUserPurchaseHistory(userId, limit);
            return Result.success(logs);
        } catch (Exception e) {
            return Result.error("获取购买日志失败：" + e.getMessage());
        }
    }

    // 获取指定用户的统计信息
    @GetMapping("/customers/{userId}/stats")
    public Result<Map<String, Object>> getCustomerStats(@PathVariable Long userId) {
        try {
            Map<String, Object> stats = new HashMap<>();
            
            // 浏览统计
            Map<String, Object> browseStats = userLogService.getUserBrowseStats(userId);
            stats.put("browseStats", browseStats);
            
            // 购买统计
            Map<String, Object> purchaseStats = userLogService.getUserPurchaseStats(userId);
            stats.put("purchaseStats", purchaseStats);
            
            // 订单统计
            LambdaQueryWrapper<Order> orderWrapper = new LambdaQueryWrapper<>();
            orderWrapper.eq(Order::getUserId, userId);
            List<Order> orders = orderMapper.selectList(orderWrapper);
            
            Map<String, Object> orderStats = new HashMap<>();
            orderStats.put("totalOrders", orders.size());
            orderStats.put("pendingOrders", orders.stream().filter(o -> o.getStatus() == 0).count());
            orderStats.put("completedOrders", orders.stream().filter(o -> o.getStatus() == 4).count());
            orderStats.put("cancelledOrders", orders.stream().filter(o -> o.getStatus() == 5).count());
            stats.put("orderStats", orderStats);
            
            return Result.success(stats);
        } catch (Exception e) {
            return Result.error("获取用户统计失败：" + e.getMessage());
        }
    }

    // 获取所有浏览日志（分页）
    @GetMapping("/logs/browse")
    public Result<List<UserBrowseLog>> getAllBrowseLogs(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "50") Integer pageSize) {
        try {
            // 简单实现，实际应使用分页插件
            List<UserBrowseLog> allLogs = browseLogMapper.selectList(
                new LambdaQueryWrapper<UserBrowseLog>().orderByDesc(UserBrowseLog::getBrowseTime)
            );
            
            int start = (page - 1) * pageSize;
            int end = Math.min(start + pageSize, allLogs.size());
            List<UserBrowseLog> logs = start < allLogs.size() ? allLogs.subList(start, end) : new ArrayList<>();
            
            return Result.success(logs);
        } catch (Exception e) {
            return Result.error("获取浏览日志失败：" + e.getMessage());
        }
    }

    // 获取所有购买日志（分页）
    @GetMapping("/logs/purchase")
    public Result<List<UserPurchaseLog>> getAllPurchaseLogs(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "50") Integer pageSize) {
        try {
            List<UserPurchaseLog> allLogs = purchaseLogMapper.selectList(
                new LambdaQueryWrapper<UserPurchaseLog>().orderByDesc(UserPurchaseLog::getPurchaseTime)
            );
            
            int start = (page - 1) * pageSize;
            int end = Math.min(start + pageSize, allLogs.size());
            List<UserPurchaseLog> logs = start < allLogs.size() ? allLogs.subList(start, end) : new ArrayList<>();
            
            return Result.success(logs);
        } catch (Exception e) {
            return Result.error("获取购买日志失败：" + e.getMessage());
        }
    }
}