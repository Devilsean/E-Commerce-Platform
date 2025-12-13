package com.ecommerce.service;

import com.ecommerce.entity.User;

/**
 * 用户服务接口
 */
public interface UserService {
    
    /**
     * 用户注册
     */
    User register(String username, String password, String phone, String email, Integer userType);
    
    /**
     * 用户登录
     */
    String login(String account, String password, Integer userType);
    
    /**
     * 根据ID获取用户信息
     */
    User getUserById(Long userId);
    
    /**
     * 根据用户名获取用户
     */
    User getUserByUsername(String username);
    
    /**
     * 根据手机号获取用户
     */
    User getUserByPhone(String phone);
    
    /**
     * 更新用户信息
     */
    boolean updateUser(User user);
    
    /**
     * 修改密码
     */
    boolean changePassword(Long userId, String oldPassword, String newPassword);
    
    /**
     * 发送验证码
     */
    boolean sendVerificationCode(String phone);
    
    /**
     * 验证验证码
     */
    boolean verifyCode(String phone, String code);
    
    /**
     * 注销账户
     */
    boolean deleteAccount(Long userId, String password);
    
    /**
     * 获取用户账户统计信息
     * @param userId 用户ID
     * @return 统计信息Map，包含总订单数、总消费金额、会员等级、注册天数等
     */
    java.util.Map<String, Object> getAccountStats(Long userId);
}