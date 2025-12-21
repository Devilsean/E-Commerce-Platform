package com.ecommerce.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ecommerce.common.Result;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import com.ecommerce.entity.UserBrowseLog;
import com.ecommerce.entity.UserPurchaseLog;
import com.ecommerce.mapper.OrderItemMapper;
import com.ecommerce.mapper.OrderMapper;
import com.ecommerce.mapper.ProductMapper;
import com.ecommerce.mapper.UserBrowseLogMapper;
import com.ecommerce.mapper.UserMapper;
import com.ecommerce.mapper.UserPurchaseLogMapper;
import com.ecommerce.service.EmailService;
import com.ecommerce.utils.JwtUtil;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
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

    @Autowired
    private OrderMapper orderMapper;

    @Autowired
    private OrderItemMapper orderItemMapper;

    @Autowired
    private UserBrowseLogMapper browseLogMapper;

    @Autowired
    private UserPurchaseLogMapper purchaseLogMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private EmailService emailService;

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

        // 如果没有选择分类，默认使用"其他商品"分类
        Long categoryId = request.getCategoryId();
        if (categoryId == null) {
            categoryId = 77L; // 默认"其他商品"分类ID
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
        product.setCategoryId(categoryId);
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
     * 获取商家订单列表
     */
    @GetMapping("/orders")
    public Result<List<Map<String, Object>>> getMerchantOrders(@RequestHeader("Authorization") String authHeader,
                                                                 @RequestParam(required = false) Integer status) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限访问，请以商家身份登录");
        }

        // 查询商家的所有商品ID
        LambdaQueryWrapper<Product> productWrapper = new LambdaQueryWrapper<>();
        productWrapper.eq(Product::getMerchantId, merchantId);
        List<Product> products = productMapper.selectList(productWrapper);
        
        if (products.isEmpty()) {
            return Result.success(new ArrayList<>());
        }

        List<Long> productIds = products.stream().map(Product::getId).collect(java.util.stream.Collectors.toList());

        // 查询包含这些商品的订单项
        LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.in(OrderItem::getProductId, productIds);
        List<OrderItem> orderItems = orderItemMapper.selectList(itemWrapper);

        if (orderItems.isEmpty()) {
            return Result.success(new ArrayList<>());
        }

        // 获取订单ID列表
        List<Long> orderIds = orderItems.stream()
                .map(OrderItem::getOrderId)
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        // 查询订单
        LambdaQueryWrapper<Order> orderWrapper = new LambdaQueryWrapper<>();
        orderWrapper.in(Order::getId, orderIds);
        if (status != null) {
            orderWrapper.eq(Order::getStatus, status);
        }
        orderWrapper.orderByDesc(Order::getCreateTime);
        List<Order> orders = orderMapper.selectList(orderWrapper);

        // 组装订单详情
        List<Map<String, Object>> result = new ArrayList<>();
        for (Order order : orders) {
            Map<String, Object> orderMap = new HashMap<>();
            orderMap.put("id", order.getId());
            orderMap.put("orderNo", order.getOrderNo());
            orderMap.put("totalAmount", order.getTotalAmount());
            orderMap.put("actualAmount", order.getActualAmount());
            orderMap.put("status", order.getStatus());
            orderMap.put("statusText", getOrderStatusText(order.getStatus()));
            orderMap.put("createTime", order.getCreateTime());
            orderMap.put("receiverName", order.getReceiverName());
            orderMap.put("receiverPhone", order.getReceiverPhone());
            orderMap.put("receiverAddress", order.getReceiverAddress());

            // 只返回属于该商家的订单项
            LambdaQueryWrapper<OrderItem> itemQuery = new LambdaQueryWrapper<>();
            itemQuery.eq(OrderItem::getOrderId, order.getId())
                     .in(OrderItem::getProductId, productIds);
            List<OrderItem> items = orderItemMapper.selectList(itemQuery);
            orderMap.put("items", items);

            result.add(orderMap);
        }

        return Result.success(result);
    }

    /**
     * 发货
     */
    @PostMapping("/orders/{id}/ship")
    public Result<Void> shipOrder(@PathVariable Long id,
                                   @RequestHeader("Authorization") String authHeader,
                                   @RequestBody ShipOrderRequest request) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限操作，请以商家身份登录");
        }

        Order order = orderMapper.selectById(id);
        if (order == null) {
            return Result.error("订单不存在");
        }

        // 验证订单是否包含该商家的商品
        LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(OrderItem::getOrderId, order.getId());
        List<OrderItem> items = orderItemMapper.selectList(itemWrapper);
        
        boolean hasMerchantProduct = false;
        for (OrderItem item : items) {
            Product product = productMapper.selectById(item.getProductId());
            if (product != null && merchantId.equals(product.getMerchantId())) {
                hasMerchantProduct = true;
                break;
            }
        }

        if (!hasMerchantProduct) {
            return Result.error("无权操作该订单");
        }

        if (order.getStatus() != 1) {
            return Result.error("只能发货已支付订单");
        }

        // 更新订单状态
        order.setStatus(3); // 已发货
        order.setDeliveryTime(LocalDateTime.now());
        order.setLogisticsCompany(request.getLogisticsCompany());
        order.setLogisticsNo(request.getLogisticsNo());

        int result = orderMapper.updateById(order);
        if (result <= 0) {
            return Result.error("发货失败");
        }

        // 发送发货通知邮件
        // 即使user为null，只要订单有通知邮箱也会发送
        try {
            User user = userMapper.selectById(order.getUserId());
            String targetEmail = order.getNotificationEmail();
            if (targetEmail == null || targetEmail.isEmpty()) {
                if (user != null && user.getEmail() != null && !user.getEmail().isEmpty()) {
                    targetEmail = user.getEmail();
                }
            }
            if (targetEmail != null && !targetEmail.isEmpty()) {
                emailService.sendShippingNotificationEmail(user, order);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return Result.success("发货成功");
    }

    /**
     * 获取订单状态文本
     */
    private String getOrderStatusText(Integer status) {
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

    /**
     * 获取客户浏览日志
     */
    @GetMapping("/logs/browse")
    public Result<List<UserBrowseLog>> getBrowseLogs(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                                      @RequestParam(defaultValue = "100") Integer limit) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限访问，请以商家身份登录");
        }
        
        List<UserBrowseLog> logs = browseLogMapper.getMerchantProductBrowseLog(merchantId, limit);
        return Result.success(logs);
    }

    /**
     * 获取商家综合统计数据（供前端数据分析弹窗使用）
     */
    @GetMapping("/statistics")
    public Result<Map<String, Object>> getStatistics(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限访问，请以商家身份登录");
        }

        try {
            Map<String, Object> statistics = new HashMap<>();
            
            // 1. 商品统计
            Map<String, Object> productStats = new HashMap<>();
            LambdaQueryWrapper<Product> productWrapper = new LambdaQueryWrapper<>();
            productWrapper.eq(Product::getMerchantId, merchantId);
            List<Product> products = productMapper.selectList(productWrapper);
            
            productStats.put("totalProducts", products.size());
            productStats.put("onlineProducts", products.stream().filter(p -> p.getStatus() != null && p.getStatus() == 1).count());
            productStats.put("offlineProducts", products.stream().filter(p -> p.getStatus() != null && p.getStatus() == 0).count());
            productStats.put("totalSales", products.stream().mapToInt(p -> p.getSales() != null ? p.getSales() : 0).sum());
            productStats.put("totalStock", products.stream().mapToInt(p -> p.getStock() != null ? p.getStock() : 0).sum());
            
            statistics.put("productStats", productStats);
            
            // 2. 订单统计
            Map<String, Object> orderStats = new HashMap<>();
            List<Long> productIds = products.stream().map(Product::getId).collect(java.util.stream.Collectors.toList());
            
            if (productIds.isEmpty()) {
                orderStats.put("totalOrders", 0);
                orderStats.put("pendingOrders", 0);
                orderStats.put("paidOrders", 0);
                orderStats.put("shippedOrders", 0);
                orderStats.put("completedOrders", 0);
                orderStats.put("cancelledOrders", 0);
                orderStats.put("totalRevenue", BigDecimal.ZERO);
                orderStats.put("pendingRevenue", BigDecimal.ZERO);
            } else {
                // 查询包含商家商品的订单项
                LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
                itemWrapper.in(OrderItem::getProductId, productIds);
                List<OrderItem> orderItems = orderItemMapper.selectList(itemWrapper);
                
                // 获取订单ID列表
                List<Long> orderIds = orderItems.stream()
                        .map(OrderItem::getOrderId)
                        .distinct()
                        .collect(java.util.stream.Collectors.toList());
                
                if (orderIds.isEmpty()) {
                    orderStats.put("totalOrders", 0);
                    orderStats.put("pendingOrders", 0);
                    orderStats.put("paidOrders", 0);
                    orderStats.put("shippedOrders", 0);
                    orderStats.put("completedOrders", 0);
                    orderStats.put("cancelledOrders", 0);
                    orderStats.put("totalRevenue", BigDecimal.ZERO);
                    orderStats.put("pendingRevenue", BigDecimal.ZERO);
                } else {
                    // 查询订单
                    LambdaQueryWrapper<Order> orderWrapper = new LambdaQueryWrapper<>();
                    orderWrapper.in(Order::getId, orderIds);
                    List<Order> orders = orderMapper.selectList(orderWrapper);
                    
                    orderStats.put("totalOrders", orders.size());
                    orderStats.put("pendingOrders", orders.stream().filter(o -> o.getStatus() != null && o.getStatus() == 0).count());
                    orderStats.put("paidOrders", orders.stream().filter(o -> o.getStatus() != null && (o.getStatus() == 1 || o.getStatus() == 2)).count());
                    orderStats.put("shippedOrders", orders.stream().filter(o -> o.getStatus() != null && o.getStatus() == 3).count());
                    orderStats.put("completedOrders", orders.stream().filter(o -> o.getStatus() != null && o.getStatus() == 4).count());
                    orderStats.put("cancelledOrders", orders.stream().filter(o -> o.getStatus() != null && o.getStatus() == 5).count());
                    
                    // 计算总收入（已完成订单）
                    BigDecimal totalRevenue = orders.stream()
                            .filter(o -> o.getStatus() != null && o.getStatus() == 4)
                            .map(o -> o.getActualAmount() != null ? o.getActualAmount() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    orderStats.put("totalRevenue", totalRevenue);
                    
                    // 计算待收入（已支付但未完成的订单）
                    BigDecimal pendingRevenue = orders.stream()
                            .filter(o -> o.getStatus() != null && (o.getStatus() == 1 || o.getStatus() == 2 || o.getStatus() == 3))
                            .map(o -> o.getActualAmount() != null ? o.getActualAmount() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    orderStats.put("pendingRevenue", pendingRevenue);
                }
            }
            
            statistics.put("orderStats", orderStats);
            
            // 3. 热销商品TOP5
            List<Map<String, Object>> topProducts = new ArrayList<>();
            products.stream()
                    .sorted((a, b) -> {
                        int salesA = a.getSales() != null ? a.getSales() : 0;
                        int salesB = b.getSales() != null ? b.getSales() : 0;
                        return salesB - salesA;
                    })
                    .limit(5)
                    .forEach(product -> {
                        Map<String, Object> productData = new HashMap<>();
                        productData.put("id", product.getId());
                        productData.put("name", product.getName());
                        productData.put("price", product.getPrice());
                        productData.put("sales", product.getSales() != null ? product.getSales() : 0);
                        productData.put("stock", product.getStock() != null ? product.getStock() : 0);
                        // 计算预估收入
                        BigDecimal price = product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;
                        int sales = product.getSales() != null ? product.getSales() : 0;
                        productData.put("revenue", price.multiply(new BigDecimal(sales)));
                        topProducts.add(productData);
                    });
            
            statistics.put("topProducts", topProducts);
            
            return Result.success(statistics);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("获取统计数据失败：" + e.getMessage());
        }
    }

    /**
     * 获取销售统计报表
     */
    @GetMapping("/reports/sales")
    public Result<Map<String, Object>> getSalesReport(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                                       @RequestParam(required = false) String startDate,
                                                       @RequestParam(required = false) String endDate) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限访问，请以商家身份登录");
        }

        try {
            Map<String, Object> report = new HashMap<>();
            
            // 查询商家的所有商品
            LambdaQueryWrapper<Product> productWrapper = new LambdaQueryWrapper<>();
            productWrapper.eq(Product::getMerchantId, merchantId);
            List<Product> products = productMapper.selectList(productWrapper);
            List<Long> productIds = products.stream().map(Product::getId).collect(java.util.stream.Collectors.toList());
            
            if (productIds.isEmpty()) {
                report.put("totalOrders", 0);
                report.put("totalRevenue", 0);
                report.put("totalProducts", 0);
                report.put("productSales", new ArrayList<>());
                return Result.success(report);
            }

            // 查询订单项
            LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
            itemWrapper.in(OrderItem::getProductId, productIds);
            List<OrderItem> allItems = orderItemMapper.selectList(itemWrapper);
            
            // 获取所有相关订单
            List<Long> orderIds = allItems.stream()
                .map(OrderItem::getOrderId)
                .distinct()
                .collect(java.util.stream.Collectors.toList());
            
            final List<Order> orders;
            if (!orderIds.isEmpty()) {
                LambdaQueryWrapper<Order> orderWrapper = new LambdaQueryWrapper<>();
                orderWrapper.in(Order::getId, orderIds);
                
                // 日期筛选
                if (startDate != null && !startDate.isEmpty()) {
                    orderWrapper.ge(Order::getCreateTime, java.time.LocalDateTime.parse(startDate + "T00:00:00"));
                }
                if (endDate != null && !endDate.isEmpty()) {
                    orderWrapper.le(Order::getCreateTime, java.time.LocalDateTime.parse(endDate + "T23:59:59"));
                }
                
                orders = orderMapper.selectList(orderWrapper);
            } else {
                orders = new ArrayList<>();
            }
            
            // 统计数据 - 修复NPE问题
            int totalOrders = orders.size();
            BigDecimal totalRevenue = orders.stream()
                .filter(o -> o.getStatus() != null && o.getStatus() == 4) // 只统计已完成订单
                .map(Order::getActualAmount)
                .filter(amount -> amount != null) // 过滤null值
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 按商品统计销量
            Map<Long, Map<String, Object>> productSalesMap = new HashMap<>();
            for (Product product : products) {
                Map<String, Object> salesData = new HashMap<>();
                salesData.put("productId", product.getId());
                salesData.put("productName", product.getName());
                salesData.put("sales", product.getSales() != null ? product.getSales() : 0);
                salesData.put("stock", product.getStock());
                salesData.put("price", product.getPrice());
                
                // 计算收入
                BigDecimal revenue = allItems.stream()
                    .filter(item -> item.getProductId().equals(product.getId()))
                    .filter(item -> orders.stream().anyMatch(o -> o.getId().equals(item.getOrderId()) && o.getStatus() == 4))
                    .map(OrderItem::getSubtotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                salesData.put("revenue", revenue);
                
                productSalesMap.put(product.getId(), salesData);
            }
            
            // 按日期统计 - 修复NPE问题
            Map<String, BigDecimal> dailySales = new java.util.TreeMap<>();
            for (Order order : orders) {
                if (order.getStatus() != null && order.getStatus() == 4
                    && order.getCreateTime() != null && order.getActualAmount() != null) {
                    String date = order.getCreateTime().toLocalDate().toString();
                    dailySales.merge(date, order.getActualAmount(), BigDecimal::add);
                }
            }
            
            report.put("totalOrders", totalOrders);
            report.put("totalRevenue", totalRevenue);
            report.put("totalProducts", products.size());
            report.put("productSales", new ArrayList<>(productSalesMap.values()));
            report.put("dailySales", dailySales);
            report.put("completedOrders", orders.stream().filter(o -> o.getStatus() == 4).count());
            report.put("pendingOrders", orders.stream().filter(o -> o.getStatus() == 0 || o.getStatus() == 1).count());
            
            return Result.success(report);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("获取销售报表失败：" + e.getMessage());
        }
    }

    /**
     * 获取商品销售排行
     */
    @GetMapping("/reports/top-products")
    public Result<List<Map<String, Object>>> getTopProducts(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                                             @RequestParam(defaultValue = "10") Integer limit) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限访问，请以商家身份登录");
        }

        try {
            LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Product::getMerchantId, merchantId)
                   .orderByDesc(Product::getSales)
                   .last("LIMIT " + limit);
            
            List<Product> products = productMapper.selectList(wrapper);
            List<Map<String, Object>> result = new ArrayList<>();
            
            for (Product product : products) {
                Map<String, Object> data = new HashMap<>();
                data.put("id", product.getId());
                data.put("name", product.getName());
                data.put("sales", product.getSales());
                data.put("price", product.getPrice());
                data.put("stock", product.getStock());
                data.put("revenue", product.getPrice().multiply(new BigDecimal(product.getSales() != null ? product.getSales() : 0)));
                result.add(data);
            }
            
            return Result.success(result);
        } catch (Exception e) {
            return Result.error("获取销售排行失败：" + e.getMessage());
        }
    }

    /**
     * 获取客户购买日志
     */
    @GetMapping("/logs/purchase")
    public Result<List<UserPurchaseLog>> getPurchaseLogs(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                                          @RequestParam(defaultValue = "100") Integer limit) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限访问，请以商家身份登录");
        }
        
        List<UserPurchaseLog> logs = purchaseLogMapper.getMerchantPurchaseLog(merchantId, limit);
        return Result.success(logs);
    }

    /**
     * 获取商家的客户列表（购买过商家商品的用户）
     */
    @GetMapping("/customers")
    public Result<List<Map<String, Object>>> getMerchantCustomers(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String keyword) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限访问，请以商家身份登录");
        }

        try {
            // 查询商家的所有商品ID
            LambdaQueryWrapper<Product> productWrapper = new LambdaQueryWrapper<>();
            productWrapper.eq(Product::getMerchantId, merchantId);
            List<Product> products = productMapper.selectList(productWrapper);
            List<Long> productIds = products.stream().map(Product::getId).collect(java.util.stream.Collectors.toList());

            if (productIds.isEmpty()) {
                return Result.success(new ArrayList<>());
            }

            // 查询包含这些商品的订单项
            LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
            itemWrapper.in(OrderItem::getProductId, productIds);
            List<OrderItem> orderItems = orderItemMapper.selectList(itemWrapper);

            if (orderItems.isEmpty()) {
                return Result.success(new ArrayList<>());
            }

            // 获取订单ID列表
            List<Long> orderIds = orderItems.stream()
                    .map(OrderItem::getOrderId)
                    .distinct()
                    .collect(java.util.stream.Collectors.toList());

            // 查询订单获取用户ID
            LambdaQueryWrapper<Order> orderWrapper = new LambdaQueryWrapper<>();
            orderWrapper.in(Order::getId, orderIds);
            List<Order> orders = orderMapper.selectList(orderWrapper);

            // 获取用户ID列表
            List<Long> userIds = orders.stream()
                    .map(Order::getUserId)
                    .distinct()
                    .collect(java.util.stream.Collectors.toList());

            if (userIds.isEmpty()) {
                return Result.success(new ArrayList<>());
            }

            // 查询用户信息
            LambdaQueryWrapper<User> userWrapper = new LambdaQueryWrapper<>();
            userWrapper.in(User::getId, userIds);
            if (keyword != null && !keyword.trim().isEmpty()) {
                userWrapper.and(w -> w.like(User::getUsername, keyword)
                        .or().like(User::getPhone, keyword)
                        .or().like(User::getEmail, keyword));
            }
            userWrapper.orderByDesc(User::getCreateTime);
            List<User> users = userMapper.selectList(userWrapper);

            // 组装结果
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

                // 统计该用户在该商家的订单数
                long orderCount = orders.stream()
                        .filter(o -> o.getUserId().equals(user.getId()))
                        .count();
                userMap.put("orderCount", orderCount);

                // 统计该用户浏览该商家商品的次数
                LambdaQueryWrapper<UserBrowseLog> browseWrapper = new LambdaQueryWrapper<>();
                browseWrapper.eq(UserBrowseLog::getUserId, user.getId())
                        .in(UserBrowseLog::getProductId, productIds);
                Long browseCount = browseLogMapper.selectCount(browseWrapper);
                userMap.put("browseCount", browseCount);

                result.add(userMap);
            }

            return Result.success(result);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("获取客户列表失败：" + e.getMessage());
        }
    }

    /**
     * 获取商家客户的统计信息
     */
    @GetMapping("/customers/{userId}/stats")
    public Result<Map<String, Object>> getMerchantCustomerStats(
            @PathVariable Long userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限访问，请以商家身份登录");
        }

        try {
            Map<String, Object> stats = new HashMap<>();

            // 查询商家的所有商品ID
            LambdaQueryWrapper<Product> productWrapper = new LambdaQueryWrapper<>();
            productWrapper.eq(Product::getMerchantId, merchantId);
            List<Product> products = productMapper.selectList(productWrapper);
            List<Long> productIds = products.stream().map(Product::getId).collect(java.util.stream.Collectors.toList());

            // 浏览统计
            Map<String, Object> browseStats = new HashMap<>();
            if (!productIds.isEmpty()) {
                LambdaQueryWrapper<UserBrowseLog> browseWrapper = new LambdaQueryWrapper<>();
                browseWrapper.eq(UserBrowseLog::getUserId, userId)
                        .in(UserBrowseLog::getProductId, productIds);
                Long totalBrowse = browseLogMapper.selectCount(browseWrapper);
                browseStats.put("totalBrowse", totalBrowse);

                // 最近7天浏览
                browseWrapper.ge(UserBrowseLog::getBrowseTime, LocalDateTime.now().minusDays(7));
                Long recentBrowse = browseLogMapper.selectCount(browseWrapper);
                browseStats.put("recentBrowse", recentBrowse);
            } else {
                browseStats.put("totalBrowse", 0);
                browseStats.put("recentBrowse", 0);
            }
            stats.put("browseStats", browseStats);

            // 购买统计
            Map<String, Object> purchaseStats = new HashMap<>();
            if (!productIds.isEmpty()) {
                // 查询包含商家商品的订单项
                LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
                itemWrapper.in(OrderItem::getProductId, productIds);
                List<OrderItem> orderItems = orderItemMapper.selectList(itemWrapper);

                List<Long> orderIds = orderItems.stream()
                        .map(OrderItem::getOrderId)
                        .distinct()
                        .collect(java.util.stream.Collectors.toList());

                if (!orderIds.isEmpty()) {
                    LambdaQueryWrapper<Order> orderWrapper = new LambdaQueryWrapper<>();
                    orderWrapper.in(Order::getId, orderIds)
                            .eq(Order::getUserId, userId);
                    List<Order> orders = orderMapper.selectList(orderWrapper);

                    purchaseStats.put("totalOrders", orders.size());

                    // 最近30天订单
                    long recentOrders = orders.stream()
                            .filter(o -> o.getCreateTime() != null && o.getCreateTime().isAfter(LocalDateTime.now().minusDays(30)))
                            .count();
                    purchaseStats.put("recentOrders", recentOrders);

                    // 总消费金额
                    java.math.BigDecimal totalAmount = orders.stream()
                            .filter(o -> o.getStatus() == 4) // 已完成订单
                            .map(o -> o.getActualAmount() != null ? o.getActualAmount() : java.math.BigDecimal.ZERO)
                            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
                    purchaseStats.put("totalAmount", totalAmount);

                    // 最近30天消费
                    java.math.BigDecimal recentAmount = orders.stream()
                            .filter(o -> o.getStatus() == 4 && o.getCreateTime() != null && o.getCreateTime().isAfter(LocalDateTime.now().minusDays(30)))
                            .map(o -> o.getActualAmount() != null ? o.getActualAmount() : java.math.BigDecimal.ZERO)
                            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
                    purchaseStats.put("recentAmount", recentAmount);
                } else {
                    purchaseStats.put("totalOrders", 0);
                    purchaseStats.put("recentOrders", 0);
                    purchaseStats.put("totalAmount", 0);
                    purchaseStats.put("recentAmount", 0);
                }
            } else {
                purchaseStats.put("totalOrders", 0);
                purchaseStats.put("recentOrders", 0);
                purchaseStats.put("totalAmount", 0);
                purchaseStats.put("recentAmount", 0);
            }
            stats.put("purchaseStats", purchaseStats);

            // 订单状态统计
            Map<String, Object> orderStats = new HashMap<>();
            if (!productIds.isEmpty()) {
                LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
                itemWrapper.in(OrderItem::getProductId, productIds);
                List<OrderItem> orderItems = orderItemMapper.selectList(itemWrapper);

                List<Long> orderIds = orderItems.stream()
                        .map(OrderItem::getOrderId)
                        .distinct()
                        .collect(java.util.stream.Collectors.toList());

                if (!orderIds.isEmpty()) {
                    LambdaQueryWrapper<Order> orderWrapper = new LambdaQueryWrapper<>();
                    orderWrapper.in(Order::getId, orderIds)
                            .eq(Order::getUserId, userId);
                    List<Order> orders = orderMapper.selectList(orderWrapper);

                    orderStats.put("totalOrders", orders.size());
                    orderStats.put("pendingOrders", orders.stream().filter(o -> o.getStatus() == 0).count());
                    orderStats.put("completedOrders", orders.stream().filter(o -> o.getStatus() == 4).count());
                    orderStats.put("cancelledOrders", orders.stream().filter(o -> o.getStatus() == 5).count());
                } else {
                    orderStats.put("totalOrders", 0);
                    orderStats.put("pendingOrders", 0);
                    orderStats.put("completedOrders", 0);
                    orderStats.put("cancelledOrders", 0);
                }
            } else {
                orderStats.put("totalOrders", 0);
                orderStats.put("pendingOrders", 0);
                orderStats.put("completedOrders", 0);
                orderStats.put("cancelledOrders", 0);
            }
            stats.put("orderStats", orderStats);

            return Result.success(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("获取客户统计失败：" + e.getMessage());
        }
    }

    /**
     * 获取商家客户的浏览日志
     */
    @GetMapping("/customers/{userId}/browse-logs")
    public Result<List<UserBrowseLog>> getMerchantCustomerBrowseLogs(
            @PathVariable Long userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "50") Integer limit) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限访问，请以商家身份登录");
        }

        try {
            // 查询商家的所有商品ID
            LambdaQueryWrapper<Product> productWrapper = new LambdaQueryWrapper<>();
            productWrapper.eq(Product::getMerchantId, merchantId);
            List<Product> products = productMapper.selectList(productWrapper);
            List<Long> productIds = products.stream().map(Product::getId).collect(java.util.stream.Collectors.toList());

            if (productIds.isEmpty()) {
                return Result.success(new ArrayList<>());
            }

            // 查询该用户浏览商家商品的日志
            LambdaQueryWrapper<UserBrowseLog> browseWrapper = new LambdaQueryWrapper<>();
            browseWrapper.eq(UserBrowseLog::getUserId, userId)
                    .in(UserBrowseLog::getProductId, productIds)
                    .orderByDesc(UserBrowseLog::getBrowseTime)
                    .last("LIMIT " + limit);
            List<UserBrowseLog> logs = browseLogMapper.selectList(browseWrapper);

            return Result.success(logs);
        } catch (Exception e) {
            return Result.error("获取浏览日志失败：" + e.getMessage());
        }
    }

    /**
     * 获取商家客户的购买日志
     */
    @GetMapping("/customers/{userId}/purchase-logs")
    public Result<List<Map<String, Object>>> getMerchantCustomerPurchaseLogs(
            @PathVariable Long userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "50") Integer limit) {
        Long merchantId = getMerchantIdFromToken(authHeader);
        if (merchantId == null) {
            return Result.error("无权限访问，请以商家身份登录");
        }

        try {
            // 查询商家的所有商品ID
            LambdaQueryWrapper<Product> productWrapper = new LambdaQueryWrapper<>();
            productWrapper.eq(Product::getMerchantId, merchantId);
            List<Product> products = productMapper.selectList(productWrapper);
            List<Long> productIds = products.stream().map(Product::getId).collect(java.util.stream.Collectors.toList());

            if (productIds.isEmpty()) {
                return Result.success(new ArrayList<>());
            }

            // 查询包含商家商品的订单项
            LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
            itemWrapper.in(OrderItem::getProductId, productIds);
            List<OrderItem> orderItems = orderItemMapper.selectList(itemWrapper);

            List<Long> orderIds = orderItems.stream()
                    .map(OrderItem::getOrderId)
                    .distinct()
                    .collect(java.util.stream.Collectors.toList());

            if (orderIds.isEmpty()) {
                return Result.success(new ArrayList<>());
            }

            // 查询该用户的订单
            LambdaQueryWrapper<Order> orderWrapper = new LambdaQueryWrapper<>();
            orderWrapper.in(Order::getId, orderIds)
                    .eq(Order::getUserId, userId)
                    .orderByDesc(Order::getCreateTime)
                    .last("LIMIT " + limit);
            List<Order> orders = orderMapper.selectList(orderWrapper);

            // 组装结果
            List<Map<String, Object>> result = new ArrayList<>();
            for (Order order : orders) {
                Map<String, Object> logMap = new HashMap<>();
                logMap.put("orderId", order.getId());
                logMap.put("orderNo", order.getOrderNo());
                logMap.put("totalAmount", order.getActualAmount());
                logMap.put("purchaseTime", order.getCreateTime());
                logMap.put("status", order.getStatus());

                // 统计该订单中商家商品的数量
                long itemCount = orderItems.stream()
                        .filter(item -> item.getOrderId().equals(order.getId()))
                        .count();
                logMap.put("itemCount", itemCount);

                result.add(logMap);
            }

            return Result.success(result);
        } catch (Exception e) {
            return Result.error("获取购买日志失败：" + e.getMessage());
        }
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

    /**
     * 发货请求DTO
     */
    @Data
    public static class ShipOrderRequest {
        private String logisticsCompany;
        private String logisticsNo;
    }
}