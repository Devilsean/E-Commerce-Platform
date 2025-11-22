package com.ecommerce.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ecommerce.common.Result;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.Product;
import com.ecommerce.mapper.OrderItemMapper;
import com.ecommerce.mapper.OrderMapper;
import com.ecommerce.mapper.ProductMapper;
import com.ecommerce.utils.JwtUtil;
import lombok.Data;
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

        return Result.success("订单创建成功", data);
    }

    /**
     * 获取用户订单列表
     */
    @GetMapping
    public Result<List<Map<String, Object>>> getOrders(@RequestHeader("Authorization") String authHeader,
                                                         @RequestParam(required = false) Integer status) {
        Long userId = getUserIdFromToken(authHeader);
        if (userId == null) {
            return Result.error("请先登录");
        }

        LambdaQueryWrapper<Order> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Order::getUserId, userId);
        if (status != null) {
            wrapper.eq(Order::getStatus, status);
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
    public Result<Void> payOrder(@PathVariable Long id,
                                  @RequestHeader("Authorization") String authHeader,
                                  @RequestBody Map<String, Integer> request) {
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

        // 更新订单状态
        order.setStatus(1); // 已支付
        order.setPaymentType(request.get("paymentType"));
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

        return Result.success("支付成功");
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
    }

    @Data
    static class OrderItemRequest {
        @NotNull(message = "商品ID不能为空")
        private Long productId;

        @NotNull(message = "数量不能为空")
        private Integer quantity;
    }
}