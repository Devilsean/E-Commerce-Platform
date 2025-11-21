package com.ecommerce.controller;

import com.ecommerce.common.Result;
import com.ecommerce.entity.User;
import com.ecommerce.service.UserService;
import com.ecommerce.utils.JwtUtil;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.HashMap;
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
}