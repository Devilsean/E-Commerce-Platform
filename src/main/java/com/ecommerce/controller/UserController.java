package com.ecommerce.controller;

import com.ecommerce.common.Result;
import com.ecommerce.entity.User;
import com.ecommerce.entity.UserBrowseLog;
import com.ecommerce.entity.UserPurchaseLog;
import com.ecommerce.mapper.UserBrowseLogMapper;
import com.ecommerce.mapper.UserPurchaseLogMapper;
import com.ecommerce.service.UserService;
import com.ecommerce.utils.JwtUtil;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户控制器
 */
@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserBrowseLogMapper browseLogMapper;

    @Autowired
    private UserPurchaseLogMapper purchaseLogMapper;

    /**
     * 用户注册
     */
    @PostMapping("/register")
    public Result<User> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.register(
                request.getUsername(),
                request.getPassword(),
                request.getPhone(),
                request.getEmail(),
                request.getUserType()
        );
        return Result.success(user);
    }

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        String token = userService.login(request.getAccount(), request.getPassword(), request.getUserType());
        
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        
        // 从token中获取用户信息
        Long userId = jwtUtil.getUserIdFromToken(token);
        User user = userService.getUserById(userId);
        data.put("userInfo", user);
        
        return Result.success(data);
    }

    /**
     * 获取当前用户信息
     */
    @GetMapping("/info")
    public Result<User> getUserInfo(@RequestHeader("Authorization") String token) {
        // 去除Bearer前缀
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        Long userId = jwtUtil.getUserIdFromToken(token);
        User user = userService.getUserById(userId);
        return Result.success(user);
    }

    /**
     * 更新用户信息
     */
    @PutMapping("/update")
    public Result<Void> updateUser(@RequestHeader("Authorization") String token,
                                    @RequestBody User user) {
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        Long userId = jwtUtil.getUserIdFromToken(token);
        user.setId(userId);
        
        boolean success = userService.updateUser(user);
        return success ? Result.success() : Result.error("更新失败");
    }

    /**
     * 修改密码
     */
    @PostMapping("/change-password")
    public Result<Void> changePassword(@RequestHeader("Authorization") String token,
                                        @Valid @RequestBody ChangePasswordRequest request) {
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        Long userId = jwtUtil.getUserIdFromToken(token);
        boolean success = userService.changePassword(userId, request.getOldPassword(), request.getNewPassword());
        if (success) {
            return Result.success("密码修改成功");
        } else {
            return Result.error("密码修改失败");
        }
    }

    /**
     * 发送验证码
     */
    @PostMapping("/send-code")
    public Result<Void> sendVerificationCode(@Valid @RequestBody SendCodeRequest request) {
        boolean success = userService.sendVerificationCode(request.getPhone());
        if (success) {
            return Result.success("验证码已发送");
        } else {
            return Result.error("发送失败");
        }
    }

    /**
     * 验证验证码
     */
    @PostMapping("/verify-code")
    public Result<Void> verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        boolean success = userService.verifyCode(request.getPhone(), request.getCode());
        if (success) {
            return Result.success("验证成功");
        } else {
            return Result.error("验证失败");
        }
    }

    /**
     * 提交商品评论
     */
    @PostMapping("/review")
    public Result<Void> submitReview(@RequestHeader("Authorization") String token,
                                      @Valid @RequestBody ReviewRequest request) {
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        Long userId = jwtUtil.getUserIdFromToken(token);
        
        try {
            // 检查是否已经评论过该商品
            String checkSql;
            Integer count;
            if (request.getOrderId() != null) {
                // 有订单ID时，检查同一订单是否已评论
                checkSql = "SELECT COUNT(*) FROM product_review WHERE user_id = ? AND product_id = ? AND order_id = ? AND deleted = 0";
                count = jdbcTemplate.queryForObject(checkSql, Integer.class, userId, request.getProductId(), request.getOrderId());
            } else {
                // 无订单ID时，允许评论（或者可以检查是否购买过该商品）
                checkSql = "SELECT COUNT(*) FROM product_review WHERE user_id = ? AND product_id = ? AND order_id IS NULL AND deleted = 0";
                count = jdbcTemplate.queryForObject(checkSql, Integer.class, userId, request.getProductId());
            }
            
            if (count != null && count > 0) {
                return Result.error("您已经评论过该商品");
            }
            
            // 插入评论
            String insertSql = "INSERT INTO product_review (order_id, product_id, user_id, rating, content, images, deleted, create_time, update_time) " +
                              "VALUES (?, ?, ?, ?, ?, ?, 0, NOW(), NOW())";
            jdbcTemplate.update(insertSql,
                request.getOrderId(),
                request.getProductId(),
                userId,
                request.getRating(),
                request.getContent(),
                request.getImages()
            );
            
            return Result.success("评论提交成功");
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("评论提交失败：" + e.getMessage());
        }
    }

    /**
     * 获取用户的评论列表
     */
    @GetMapping("/reviews")
    public Result<List<Map<String, Object>>> getUserReviews(@RequestHeader("Authorization") String token) {
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        Long userId = jwtUtil.getUserIdFromToken(token);
        
        try {
            String sql = "SELECT r.*, p.name as product_name, p.main_image as product_image " +
                        "FROM product_review r " +
                        "LEFT JOIN product p ON r.product_id = p.id " +
                        "WHERE r.user_id = ? AND r.deleted = 0 " +
                        "ORDER BY r.create_time DESC";
            List<Map<String, Object>> reviews = jdbcTemplate.queryForList(sql, userId);
            return Result.success(reviews);
        } catch (Exception e) {
            return Result.error("获取评论列表失败：" + e.getMessage());
        }
    }

    /**
     * 删除评论
     */
    @DeleteMapping("/review/{reviewId}")
    public Result<Void> deleteReview(@RequestHeader("Authorization") String token,
                                      @PathVariable Long reviewId) {
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        Long userId = jwtUtil.getUserIdFromToken(token);
        
        try {
            // 只能删除自己的评论
            String sql = "UPDATE product_review SET deleted = 1, update_time = NOW() WHERE id = ? AND user_id = ?";
            int rows = jdbcTemplate.update(sql, reviewId, userId);
            if (rows > 0) {
                return Result.success("删除成功");
            } else {
                return Result.error("评论不存在或无权删除");
            }
        } catch (Exception e) {
            return Result.error("删除失败：" + e.getMessage());
        }
    }

    /**
     * 记录用户浏览日志
     */
    @PostMapping("/log/browse")
    public Result<Void> logBrowse(@RequestHeader("Authorization") String token,
                                   @Valid @RequestBody BrowseLogRequest request,
                                   HttpServletRequest httpRequest) {
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        Long userId = jwtUtil.getUserIdFromToken(token);
        
        try {
            // 获取商品信息
            String sql = "SELECT name, price FROM product WHERE id = ?";
            Map<String, Object> product = jdbcTemplate.queryForMap(sql, request.getProductId());
            
            // 创建浏览日志
            UserBrowseLog log = new UserBrowseLog();
            log.setUserId(userId);
            log.setProductId(request.getProductId());
            log.setProductName((String) product.get("name"));
            log.setProductPrice((BigDecimal) product.get("price"));
            log.setBrowseTime(LocalDateTime.now());
            log.setIpAddress(getClientIp(httpRequest));
            log.setUserAgent(httpRequest.getHeader("User-Agent"));
            log.setCreateTime(LocalDateTime.now());
            
            browseLogMapper.insert(log);
            return Result.success("浏览日志记录成功");
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("记录失败：" + e.getMessage());
        }
    }

    /**
     * 记录用户购买日志
     */
    @PostMapping("/log/purchase")
    public Result<Void> logPurchase(@RequestHeader("Authorization") String token,
                                     @Valid @RequestBody PurchaseLogRequest request,
                                     HttpServletRequest httpRequest) {
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        Long userId = jwtUtil.getUserIdFromToken(token);
        
        try {
            // 获取订单信息
            String sql = "SELECT total_amount FROM `order` WHERE id = ?";
            Map<String, Object> order = jdbcTemplate.queryForMap(sql, request.getOrderId());
            
            // 创建购买日志
            UserPurchaseLog log = new UserPurchaseLog();
            log.setUserId(userId);
            log.setOrderId(request.getOrderId());
            log.setTotalAmount((BigDecimal) order.get("total_amount"));
            log.setItemCount(request.getItems() != null ? request.getItems().size() : 0);
            log.setPurchaseTime(LocalDateTime.now());
            log.setIpAddress(getClientIp(httpRequest));
            log.setCreateTime(LocalDateTime.now());
            
            purchaseLogMapper.insert(log);
            return Result.success("购买日志记录成功");
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("记录失败：" + e.getMessage());
        }
    }

    /**
     * 获取用户浏览历史
     */
    @GetMapping("/browse-history")
    public Result<List<UserBrowseLog>> getBrowseHistory(@RequestHeader("Authorization") String token,
                                                         @RequestParam(defaultValue = "50") Integer limit) {
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        Long userId = jwtUtil.getUserIdFromToken(token);
        List<UserBrowseLog> logs = browseLogMapper.getRecentBrowseLog(userId, limit);
        return Result.success(logs);
    }

    /**
     * 获取客户端IP地址
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }

    // ========== 请求DTO类 ==========

    @Data
    static class RegisterRequest {
        @NotBlank(message = "用户名不能为空")
        private String username;

        @NotBlank(message = "密码不能为空")
        private String password;

        private String phone;
        private String email;
        
        /**
         * 用户类型：1-普通用户，2-商家
         */
        private Integer userType = 1;
    }

    @Data
    static class LoginRequest {
        @NotBlank(message = "账号不能为空")
        private String account;

        @NotBlank(message = "密码不能为空")
        private String password;
        
        /**
         * 用户类型：1-普通用户，2-商家
         */
        private Integer userType = 1;
    }

    @Data
    static class ChangePasswordRequest {
        @NotBlank(message = "原密码不能为空")
        private String oldPassword;

        @NotBlank(message = "新密码不能为空")
        private String newPassword;
    }

    @Data
    static class SendCodeRequest {
        @NotBlank(message = "手机号不能为空")
        private String phone;
    }

    @Data
    static class VerifyCodeRequest {
        @NotBlank(message = "手机号不能为空")
        private String phone;

        @NotBlank(message = "验证码不能为空")
        private String code;
    }

    @Data
    static class ReviewRequest {
        private Long orderId;

        @NotNull(message = "商品ID不能为空")
        private Long productId;

        @NotNull(message = "评分不能为空")
        @Min(value = 1, message = "评分最低为1星")
        @Max(value = 5, message = "评分最高为5星")
        private Integer rating;

        private String content;
        
        private String images;
    }

    @Data
    static class BrowseLogRequest {
        @NotNull(message = "商品ID不能为空")
        private Long productId;
        
        private String timestamp;
    }

    @Data
    static class PurchaseLogRequest {
        @NotNull(message = "订单ID不能为空")
        private Long orderId;
        
        private List<Map<String, Object>> items;
        
        private String timestamp;
    }
}