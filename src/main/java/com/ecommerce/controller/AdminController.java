package com.ecommerce.controller;

import com.ecommerce.common.Result;
import com.ecommerce.entity.User;
import com.ecommerce.entity.Merchant;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.Order;
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
}