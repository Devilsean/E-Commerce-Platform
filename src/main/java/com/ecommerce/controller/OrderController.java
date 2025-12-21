package com.ecommerce.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ecommerce.common.Result;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import com.ecommerce.mapper.OrderItemMapper;
import com.ecommerce.mapper.OrderMapper;
import com.ecommerce.mapper.ProductMapper;
import com.ecommerce.mapper.UserMapper;
import com.ecommerce.service.EmailService;
import com.ecommerce.utils.JwtUtil;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 订单控制器
 */
@Slf4j
@RestController
@RequestMapping("/user/orders")
public class OrderController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private OrderMapper orderMapper;

    @Autowired
    private OrderItemMapper orderItemMapper;

    @Autowired
    private ProductMapper productMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private EmailService emailService;

    /**
     * 从请求头中提取用户ID
     */
    private Long getUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            return null;
        }
        return jwtUtil.getUserIdFromToken(token);
    }

    /**
     * 创建订单
     */
    @PostMapping
    @Transactional(rollbackFor = Exception.class)
    public Result<Map<String, Object>> createOrder(@RequestHeader("Authorization") String authHeader,
                                                     @Valid @RequestBody CreateOrderRequest request) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return Result.error("请先登录");
        }

        // 验证订单项
        if (request.getItems() == null || request.getItems().isEmpty()) {
            return Result.error("订单项不能为空");
        }

        // 计算订单总金额并验证库存
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<Product> products = new ArrayList<>();
        
        for (OrderItemRequest item : request.getItems()) {
            Product product = productMapper.selectById(item.getProductId());
            if (product == null) {
                return Result.error("商品不存在：" + item.getProductId());
            }
            if (product.getStock() < item.getQuantity()) {
                return Result.error("商品库存不足：" + product.getName());
            }
            products.add(product);
            BigDecimal subtotal = product.getPrice().multiply(new BigDecimal(item.getQuantity()));
            totalAmount = totalAmount.add(subtotal);
        }

        // 生成订单号
        String orderNo = generateOrderNo();

        // 获取用户信息，用于获取默认邮箱
        User user = userMapper.selectById(userId);

        // 创建订单
        Order order = new Order();
        order.setOrderNo(orderNo);
        order.setUserId(userId);
        order.setTotalAmount(totalAmount);
        order.setActualAmount(totalAmount);
        order.setStatus(0); // 待支付
        order.setReceiverName(request.getReceiverName());
        order.setReceiverPhone(request.getReceiverPhone());
        order.setReceiverAddress(request.getReceiverAddress());
        order.setRemark(request.getRemark());
        
        // 设置通知邮箱：优先使用订单指定的邮箱，否则使用用户邮箱
        String notificationEmail = request.getNotificationEmail();
        if (notificationEmail == null || notificationEmail.isEmpty()) {
            if (user != null && user.getEmail() != null && !user.getEmail().isEmpty()) {
                notificationEmail = user.getEmail();
            }
        }
        order.setNotificationEmail(notificationEmail);

        int result = orderMapper.insert(order);
        if (result <= 0) {
            return Result.error("创建订单失败");
        }

        // 创建订单项并扣减库存
        for (int i = 0; i < request.getItems().size(); i++) {
            OrderItemRequest itemReq = request.getItems().get(i);
            Product product = products.get(i);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrderId(order.getId());
            orderItem.setProductId(product.getId());
            orderItem.setProductName(product.getName());
            orderItem.setProductImage(product.getMainImage());
            orderItem.setPrice(product.getPrice());
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setSubtotal(product.getPrice().multiply(new BigDecimal(itemReq.getQuantity())));

            orderItemMapper.insert(orderItem);

            // 扣减库存
            product.setStock(product.getStock() - itemReq.getQuantity());
            productMapper.updateById(product);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("orderId", order.getId());
        data.put("orderNo", orderNo);
        data.put("totalAmount", totalAmount);
        data.put("notificationEmail", order.getNotificationEmail());

        return Result.success("订单创建成功", data);
    }

    /**
     * 获取用户订单列表（支持高级筛选）
     */
    @GetMapping
    public Result<List<Map<String, Object>>> getOrders(@RequestHeader("Authorization") String authHeader,
                                                         @RequestParam(required = false) Integer status,
                                                         @RequestParam(required = false) String startDate,
                                                         @RequestParam(required = false) String endDate,
                                                         @RequestParam(required = false) BigDecimal minAmount,
                                                         @RequestParam(required = false) BigDecimal maxAmount,
                                                         @RequestParam(required = false) String keyword) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return Result.error("请先登录");
        }

        LambdaQueryWrapper<Order> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Order::getUserId, userId);
        
        // 状态筛选
        if (status != null) {
            wrapper.eq(Order::getStatus, status);
        }
        
        // 日期范围筛选
        if (startDate != null && !startDate.isEmpty()) {
            wrapper.ge(Order::getCreateTime, LocalDateTime.parse(startDate + "T00:00:00"));
        }
        if (endDate != null && !endDate.isEmpty()) {
            wrapper.le(Order::getCreateTime, LocalDateTime.parse(endDate + "T23:59:59"));
        }
        
        // 金额范围筛选
        if (minAmount != null) {
            wrapper.ge(Order::getTotalAmount, minAmount);
        }
        if (maxAmount != null) {
            wrapper.le(Order::getTotalAmount, maxAmount);
        }
        
        // 关键词搜索（订单号、收货人）
        if (keyword != null && !keyword.trim().isEmpty()) {
            wrapper.and(w -> w.like(Order::getOrderNo, keyword)
                    .or().like(Order::getReceiverName, keyword)
                    .or().like(Order::getReceiverPhone, keyword));
        }
        
        wrapper.orderByDesc(Order::getCreateTime);

        List<Order> orders = orderMapper.selectList(wrapper);
        
        // 组装订单详情
        List<Map<String, Object>> result = new ArrayList<>();
        for (Order order : orders) {
            Map<String, Object> orderMap = new HashMap<>();
            orderMap.put("id", order.getId());
            orderMap.put("orderNo", order.getOrderNo());
            orderMap.put("totalAmount", order.getTotalAmount());
            orderMap.put("actualAmount", order.getActualAmount());
            orderMap.put("status", order.getStatus());
            orderMap.put("statusText", getStatusText(order.getStatus()));
            orderMap.put("createTime", order.getCreateTime());
            orderMap.put("receiverName", order.getReceiverName());
            orderMap.put("receiverPhone", order.getReceiverPhone());
            orderMap.put("receiverAddress", order.getReceiverAddress());
            orderMap.put("notificationEmail", order.getNotificationEmail());

            // 查询订单项
            LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
            itemWrapper.eq(OrderItem::getOrderId, order.getId());
            List<OrderItem> items = orderItemMapper.selectList(itemWrapper);
            orderMap.put("items", items);

            result.add(orderMap);
        }

        return Result.success(result);
    }
    
    /**
     * 获取订单统计信息
     */
    @GetMapping("/statistics")
    public Result<Map<String, Object>> getOrderStatistics(@RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return Result.error("请先登录");
        }

        LambdaQueryWrapper<Order> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Order::getUserId, userId);
        List<Order> allOrders = orderMapper.selectList(wrapper);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", allOrders.size());
        stats.put("pendingOrders", allOrders.stream().filter(o -> o.getStatus() == 0).count());
        stats.put("paidOrders", allOrders.stream().filter(o -> o.getStatus() == 1 || o.getStatus() == 2).count());
        stats.put("shippedOrders", allOrders.stream().filter(o -> o.getStatus() == 3).count());
        stats.put("completedOrders", allOrders.stream().filter(o -> o.getStatus() == 4).count());
        stats.put("cancelledOrders", allOrders.stream().filter(o -> o.getStatus() == 5).count());
        
        // 计算总消费金额 - 修复NPE问题
        BigDecimal totalAmount = allOrders.stream()
                .filter(o -> o.getStatus() != null && o.getStatus() == 4) // 只统计已完成订单
                .map(Order::getActualAmount)
                .filter(amount -> amount != null) // 过滤null值避免NPE
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalAmount", totalAmount);
        
        // 最近30天订单数 - 修复NPE问题
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long recentOrders = allOrders.stream()
                .filter(o -> o.getCreateTime() != null && o.getCreateTime().isAfter(thirtyDaysAgo))
                .count();
        stats.put("recentOrders", recentOrders);

        return Result.success(stats);
    }

    /**
     * 获取订单详情
     */
    @GetMapping("/{id}")
    public Result<Map<String, Object>> getOrderDetail(@PathVariable Long id,
                                                        @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return Result.error("请先登录");
        }

        Order order = orderMapper.selectById(id);
        if (order == null) {
            return Result.error("订单不存在");
        }

        if (!userId.equals(order.getUserId())) {
            return Result.error("无权访问该订单");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", order.getId());
        result.put("orderNo", order.getOrderNo());
        result.put("totalAmount", order.getTotalAmount());
        result.put("actualAmount", order.getActualAmount());
        result.put("status", order.getStatus());
        result.put("statusText", getStatusText(order.getStatus()));
        result.put("paymentType", order.getPaymentType());
        result.put("paymentTime", order.getPaymentTime());
        result.put("deliveryTime", order.getDeliveryTime());
        result.put("finishTime", order.getFinishTime());
        result.put("cancelTime", order.getCancelTime());
        result.put("receiverName", order.getReceiverName());
        result.put("receiverPhone", order.getReceiverPhone());
        result.put("receiverAddress", order.getReceiverAddress());
        result.put("logisticsCompany", order.getLogisticsCompany());
        result.put("logisticsNo", order.getLogisticsNo());
        result.put("remark", order.getRemark());
        result.put("notificationEmail", order.getNotificationEmail());
        result.put("createTime", order.getCreateTime());

        // 查询订单项
        LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(OrderItem::getOrderId, order.getId());
        List<OrderItem> items = orderItemMapper.selectList(itemWrapper);
        result.put("items", items);

        return Result.success(result);
    }

    /**
     * 支付订单
     */
    @PostMapping("/{id}/pay")
    @Transactional(rollbackFor = Exception.class)
    public Result<Map<String, Object>> payOrder(@PathVariable Long id,
                                  @RequestHeader("Authorization") String authHeader,
                                  @RequestBody PayOrderRequest request) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return Result.error("请先登录");
        }

        Order order = orderMapper.selectById(id);
        if (order == null) {
            return Result.error("订单不存在");
        }

        if (!userId.equals(order.getUserId())) {
            return Result.error("无权操作该订单");
        }

        if (order.getStatus() != 0) {
            return Result.error("订单状态不正确");
        }

        // 获取用户信息
        User user = userMapper.selectById(userId);
        
        // 检查并更新通知邮箱（支付时可以更新邮箱）
        String notificationEmail = request.getNotificationEmail();
        if (notificationEmail != null && !notificationEmail.trim().isEmpty()) {
            order.setNotificationEmail(notificationEmail.trim());
        }
        
        // 如果订单没有通知邮箱，尝试使用用户邮箱
        if ((order.getNotificationEmail() == null || order.getNotificationEmail().isEmpty())
            && user != null && user.getEmail() != null && !user.getEmail().isEmpty()) {
            order.setNotificationEmail(user.getEmail());
        }

        // 更新订单状态
        order.setStatus(1); // 已支付
        Integer paymentType = request.getPaymentType() != null ? request.getPaymentType() : 1;
        order.setPaymentType(paymentType);
        order.setPaymentTime(LocalDateTime.now());
        
        int result = orderMapper.updateById(order);
        if (result <= 0) {
            return Result.error("支付失败");
        }

        // 更新商品销量
        LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(OrderItem::getOrderId, order.getId());
        List<OrderItem> items = orderItemMapper.selectList(itemWrapper);
        
        for (OrderItem item : items) {
            Product product = productMapper.selectById(item.getProductId());
            if (product != null) {
                product.setSales((product.getSales() != null ? product.getSales() : 0) + item.getQuantity());
                productMapper.updateById(product);
            }
        }

        // 发送支付成功邮件（包含商品清单）
        // 即使user为null，只要订单有通知邮箱也会发送
        String emailSentTo = null;
        try {
            String targetEmail = order.getNotificationEmail();
            if (targetEmail != null && !targetEmail.isEmpty()) {
                emailService.sendPaymentSuccessEmail(user, order, items);
                emailSentTo = targetEmail;
                log.info("支付成功邮件已发送至: {}, 订单号: {}", targetEmail, order.getOrderNo());
            } else {
                log.warn("订单没有通知邮箱，无法发送支付成功邮件: orderNo={}", order.getOrderNo());
            }
        } catch (Exception e) {
            log.error("发送支付成功邮件失败: orderNo={}", order.getOrderNo(), e);
        }

        // 返回支付结果
        Map<String, Object> data = new HashMap<>();
        data.put("orderId", order.getId());
        data.put("orderNo", order.getOrderNo());
        data.put("paymentTime", order.getPaymentTime());
        data.put("notificationEmail", order.getNotificationEmail());
        data.put("emailSent", emailSentTo != null);
        if (emailSentTo != null) {
            data.put("emailSentTo", emailSentTo);
        }

        return Result.success("支付成功", data);
    }

    /**
     * 取消订单
     */
    @PostMapping("/{id}/cancel")
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> cancelOrder(@PathVariable Long id,
                                     @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return Result.error("请先登录");
        }

        Order order = orderMapper.selectById(id);
        if (order == null) {
            return Result.error("订单不存在");
        }

        if (!userId.equals(order.getUserId())) {
            return Result.error("无权操作该订单");
        }

        if (order.getStatus() != 0) {
            return Result.error("只能取消待支付订单");
        }

        // 恢复库存
        LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(OrderItem::getOrderId, order.getId());
        List<OrderItem> items = orderItemMapper.selectList(itemWrapper);
        
        for (OrderItem item : items) {
            Product product = productMapper.selectById(item.getProductId());
            if (product != null) {
                product.setStock(product.getStock() + item.getQuantity());
                productMapper.updateById(product);
            }
        }

        // 更新订单状态
        order.setStatus(5); // 已取消
        order.setCancelTime(LocalDateTime.now());
        
        int result = orderMapper.updateById(order);
        if (result <= 0) {
            return Result.error("取消失败");
        }

        return Result.success("订单已取消");
    }

    /**
     * 确认收货
     */
    @PostMapping("/{id}/confirm")
    public Result<Void> confirmOrder(@PathVariable Long id,
                                      @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return Result.error("请先登录");
        }

        Order order = orderMapper.selectById(id);
        if (order == null) {
            return Result.error("订单不存在");
        }

        if (!userId.equals(order.getUserId())) {
            return Result.error("无权操作该订单");
        }

        if (order.getStatus() != 3) {
            return Result.error("只能确认已发货订单");
        }

        // 更新订单状态
        order.setStatus(4); // 已完成
        order.setFinishTime(LocalDateTime.now());
        
        int result = orderMapper.updateById(order);
        if (result <= 0) {
            return Result.error("确认失败");
        }

        return Result.success("确认收货成功");
    }

    /**
     * 删除订单
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteOrder(@PathVariable Long id,
                                     @RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return Result.error("请先登录");
        }

        Order order = orderMapper.selectById(id);
        if (order == null) {
            return Result.error("订单不存在");
        }

        if (!userId.equals(order.getUserId())) {
            return Result.error("无权删除该订单");
        }

        if (order.getStatus() != 4 && order.getStatus() != 5) {
            return Result.error("只能删除已完成或已取消的订单");
        }

        int result = orderMapper.deleteById(id);
        if (result <= 0) {
            return Result.error("删除失败");
        }

        return Result.success("删除成功");
    }

    /**
     * 生成订单号
     */
    private String generateOrderNo() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String timestamp = LocalDateTime.now().format(formatter);
        String random = String.format("%06d", new Random().nextInt(1000000));
        return timestamp + random;
    }

    /**
     * 获取订单状态文本
     */
    private String getStatusText(Integer status) {
        if (status == null) return "未知";
        switch (status) {
            case 0: return "待支付";
            case 1: return "已支付";
            case 2: return "待发货";
            case 3: return "已发货";
            case 4: return "已完成";
            case 5: return "已取消";
            default: return "未知";
        }
    }

    // ========== 请求DTO类 ==========

    @Data
    static class CreateOrderRequest {
        @NotEmpty(message = "订单项不能为空")
        private List<OrderItemRequest> items;

        @NotBlank(message = "收货人姓名不能为空")
        private String receiverName;

        @NotBlank(message = "收货人电话不能为空")
        private String receiverPhone;

        @NotBlank(message = "收货地址不能为空")
        private String receiverAddress;

        private String remark;
        
        /**
         * 通知邮箱（用于接收订单相关通知）
         * 如果不填写，将使用用户个人信息中的邮箱
         */
        private String notificationEmail;
    }

    @Data
    static class OrderItemRequest {
        @NotNull(message = "商品ID不能为空")
        private Long productId;

        @NotNull(message = "数量不能为空")
        private Integer quantity;
    }

    @Data
    static class PayOrderRequest {
        /**
         * 支付方式：1-微信，2-支付宝
         */
        private Integer paymentType;
        
        /**
         * 通知邮箱（用于接收订单相关通知）
         */
        private String notificationEmail;
    }
}