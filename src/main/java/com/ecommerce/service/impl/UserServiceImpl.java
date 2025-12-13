package com.ecommerce.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ecommerce.common.ResultCode;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.User;
import com.ecommerce.exception.BusinessException;
import com.ecommerce.mapper.OrderMapper;
import com.ecommerce.mapper.UserMapper;
import com.ecommerce.service.UserService;
import com.ecommerce.utils.JwtUtil;
import com.ecommerce.utils.RedisUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

/**
 * 用户服务实现类
 */
@Slf4j
@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private OrderMapper orderMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RedisUtil redisUtil;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // 密码复杂度正则：至少8位，包含大小写字母和数字
    private static final String PASSWORD_PATTERN = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$";
    // 手机号正则
    private static final String PHONE_PATTERN = "^1[3-9]\\d{9}$";
    // 邮箱正则
    private static final String EMAIL_PATTERN = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";

    @Override
    public User register(String username, String password, String phone, String email, Integer userType) {
        // 参数校验
        if (!StringUtils.hasText(username) || !StringUtils.hasText(password)) {
            throw new BusinessException(ResultCode.PARAM_ERROR);
        }

        // 校验密码复杂度
        if (!Pattern.matches(PASSWORD_PATTERN, password)) {
            throw new BusinessException(ResultCode.PASSWORD_COMPLEXITY_ERROR);
        }

        // 校验手机号格式
        if (StringUtils.hasText(phone) && !Pattern.matches(PHONE_PATTERN, phone)) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "手机号格式不正确");
        }

        // 校验邮箱格式
        if (StringUtils.hasText(email) && !Pattern.matches(EMAIL_PATTERN, email)) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "邮箱格式不正确");
        }

        // 检查用户名是否已存在
        User existUser = getUserByUsername(username);
        if (existUser != null) {
            throw new BusinessException(ResultCode.USER_ALREADY_EXISTS);
        }

        // 检查手机号是否已被使用
        if (StringUtils.hasText(phone)) {
            User phoneUser = getUserByPhone(phone);
            if (phoneUser != null) {
                throw new BusinessException(ResultCode.USER_ALREADY_EXISTS.getCode(), "手机号已被使用");
            }
        }

        // 检查邮箱是否已被使用
        if (StringUtils.hasText(email)) {
            LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(User::getEmail, email);
            User emailUser = userMapper.selectOne(wrapper);
            if (emailUser != null) {
                throw new BusinessException(ResultCode.USER_ALREADY_EXISTS.getCode(), "邮箱已被使用");
            }
        }

        // 创建用户
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setPhone(phone);
        user.setEmail(email);
        user.setNickname(username);
        user.setStatus(1);
        // 设置用户类型：1-普通用户，2-商家，默认为1
        user.setUserType(userType != null && (userType == 1 || userType == 2) ? userType : 1);

        int result = userMapper.insert(user);
        if (result <= 0) {
            throw new BusinessException("注册失败");
        }

        log.info("用户注册成功：{}，用户类型：{}", username, user.getUserType());
        return user;
    }

    @Override
    public String login(String account, String password, Integer userType) {
        // 参数校验
        if (!StringUtils.hasText(account) || !StringUtils.hasText(password)) {
            throw new BusinessException(ResultCode.PARAM_ERROR);
        }

        // 查询用户（支持用户名、手机号、邮箱登录）
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, account)
                .or().eq(User::getPhone, account)
                .or().eq(User::getEmail, account);
        User user = userMapper.selectOne(wrapper);

        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        // 检查用户状态
        if (user.getStatus() == 0) {
            throw new BusinessException(ResultCode.USER_DISABLED);
        }

        // 验证用户类型是否匹配
        if (userType != null && !userType.equals(user.getUserType())) {
            String expectedType = userType == 2 ? "商家" : "普通用户";
            String actualType = user.getUserType() == 2 ? "商家" : "普通用户";
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(),
                "账号类型不匹配，该账号是" + actualType + "账号，请选择正确的登录身份");
        }

        // 验证密码
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException(ResultCode.USER_PASSWORD_ERROR);
        }

        // 生成Token
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getUserType());

        // 将Token存入Redis（可选，用于管理登录状态）
        redisUtil.set("user:token:" + user.getId(), token, 7, TimeUnit.DAYS);

        log.info("用户登录成功：{}，用户类型：{}", user.getUsername(), user.getUserType());
        return token;
    }

    @Override
    public User getUserById(Long userId) {
        if (userId == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR);
        }
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        // 清空密码字段
        user.setPassword(null);
        return user;
    }

    @Override
    public User getUserByUsername(String username) {
        if (!StringUtils.hasText(username)) {
            return null;
        }
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        return userMapper.selectOne(wrapper);
    }

    @Override
    public User getUserByPhone(String phone) {
        if (!StringUtils.hasText(phone)) {
            return null;
        }
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getPhone, phone);
        return userMapper.selectOne(wrapper);
    }

    @Override
    public boolean updateUser(User user) {
        if (user == null || user.getId() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR);
        }

        // 检查用户是否存在
        User existUser = userMapper.selectById(user.getId());
        if (existUser == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        // 不允许直接修改密码、用户类型等敏感字段
        user.setPassword(null);
        user.setUserType(null);
        user.setUsername(null);

        int result = userMapper.updateById(user);
        return result > 0;
    }

    @Override
    public boolean changePassword(Long userId, String oldPassword, String newPassword) {
        // 参数校验
        if (userId == null || !StringUtils.hasText(oldPassword) || !StringUtils.hasText(newPassword)) {
            throw new BusinessException(ResultCode.PARAM_ERROR);
        }

        // 校验新密码复杂度
        if (!Pattern.matches(PASSWORD_PATTERN, newPassword)) {
            throw new BusinessException(ResultCode.PASSWORD_COMPLEXITY_ERROR);
        }

        // 查询用户
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BusinessException(ResultCode.USER_PASSWORD_ERROR.getCode(), "原密码错误");
        }

        // 更新密码
        user.setPassword(passwordEncoder.encode(newPassword));
        int result = userMapper.updateById(user);

        if (result > 0) {
            log.info("用户修改密码成功：{}", user.getUsername());
        }

        return result > 0;
    }

    @Override
    public boolean sendVerificationCode(String phone) {
        // 校验手机号格式
        if (!Pattern.matches(PHONE_PATTERN, phone)) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "手机号格式不正确");
        }

        // 生成6位验证码
        String code = String.format("%06d", new Random().nextInt(999999));

        // 存入Redis，有效期5分钟
        redisUtil.set("verification:code:" + phone, code, 5, TimeUnit.MINUTES);

        // TODO: 调用短信服务发送验证码
        log.info("发送验证码到手机：{}，验证码：{}", phone, code);

        return true;
    }

    @Override
    public boolean verifyCode(String phone, String code) {
        if (!StringUtils.hasText(phone) || !StringUtils.hasText(code)) {
            throw new BusinessException(ResultCode.PARAM_ERROR);
        }

        // 从Redis获取验证码
        Object savedCode = redisUtil.get("verification:code:" + phone);
        if (savedCode == null) {
            throw new BusinessException(ResultCode.VERIFICATION_CODE_EXPIRED);
        }

        // 验证验证码
        if (!code.equals(savedCode.toString())) {
            throw new BusinessException(ResultCode.VERIFICATION_CODE_ERROR);
        }

        // 验证成功后删除验证码
        redisUtil.delete("verification:code:" + phone);

        return true;
    }

    @Override
    public boolean deleteAccount(Long userId, String password) {
        // 参数校验
        if (userId == null || !StringUtils.hasText(password)) {
            throw new BusinessException(ResultCode.PARAM_ERROR);
        }

        // 查询用户
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        // 验证密码
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException(ResultCode.USER_PASSWORD_ERROR.getCode(), "密码错误");
        }

        // 逻辑删除用户账户
        user.setDeleted(1);
        user.setStatus(0); // 同时禁用账户
        int result = userMapper.updateById(user);

        if (result > 0) {
            // 删除Redis中的token
            redisUtil.delete("user:token:" + userId);
            log.info("用户注销账户成功：{}，用户ID：{}", user.getUsername(), userId);
        }

        return result > 0;
    }

    @Override
    public Map<String, Object> getAccountStats(Long userId) {
        if (userId == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR);
        }

        // 查询用户信息
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        Map<String, Object> stats = new HashMap<>();

        // 查询用户订单统计
        LambdaQueryWrapper<Order> orderWrapper = new LambdaQueryWrapper<>();
        orderWrapper.eq(Order::getUserId, userId);
        List<Order> orders = orderMapper.selectList(orderWrapper);

        // 总订单数
        int totalOrders = orders.size();
        stats.put("totalOrders", totalOrders);

        // 各状态订单数
        int pendingOrders = 0;    // 待支付
        int paidOrders = 0;       // 已支付/待发货
        int shippedOrders = 0;    // 已发货
        int completedOrders = 0;  // 已完成
        int cancelledOrders = 0;  // 已取消

        BigDecimal totalSpent = BigDecimal.ZERO;
        BigDecimal pendingAmount = BigDecimal.ZERO;  // 待支付金额
        
        for (Order order : orders) {
            Integer status = order.getStatus();
            BigDecimal amount = order.getActualAmount() != null ? order.getActualAmount() : order.getTotalAmount();
            if (amount == null) {
                amount = BigDecimal.ZERO;
            }
            
            if (status != null) {
                switch (status) {
                    case 0:
                        pendingOrders++;
                        pendingAmount = pendingAmount.add(amount);
                        break;
                    case 1:
                    case 2:
                        paidOrders++;
                        totalSpent = totalSpent.add(amount);
                        break;
                    case 3:
                        shippedOrders++;
                        totalSpent = totalSpent.add(amount);
                        break;
                    case 4:
                        completedOrders++;
                        totalSpent = totalSpent.add(amount);
                        break;
                    case 5:
                        cancelledOrders++;
                        break;
                }
            }
        }

        stats.put("pendingOrders", pendingOrders);
        stats.put("paidOrders", paidOrders);
        stats.put("shippedOrders", shippedOrders);
        stats.put("completedOrders", completedOrders);
        stats.put("cancelledOrders", cancelledOrders);
        stats.put("totalSpent", totalSpent);
        stats.put("pendingAmount", pendingAmount);

        // 计算注册天数
        LocalDateTime createTime = user.getCreateTime();
        long registerDays = 0;
        if (createTime != null) {
            registerDays = ChronoUnit.DAYS.between(createTime, LocalDateTime.now());
        }
        stats.put("registerDays", registerDays);
        stats.put("registerTime", createTime);

        // 用户基本信息
        stats.put("username", user.getUsername());
        stats.put("nickname", user.getNickname());
        stats.put("phone", user.getPhone());
        stats.put("email", user.getEmail());
        stats.put("avatar", user.getAvatar());
        stats.put("userType", user.getUserType());

        log.info("获取用户账户统计成功：{}，总订单数：{}，总消费：{}", user.getUsername(), totalOrders, totalSpent);
        return stats;
    }
}