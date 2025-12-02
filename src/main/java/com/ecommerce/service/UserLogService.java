package com.ecommerce.service;

import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.PurchaseLogItem;
import com.ecommerce.entity.UserBrowseLog;
import com.ecommerce.entity.UserPurchaseLog;
import com.ecommerce.mapper.PurchaseLogItemMapper;
import com.ecommerce.mapper.UserBrowseLogMapper;
import com.ecommerce.mapper.UserPurchaseLogMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户日志服务
 */
@Service
public class UserLogService {

    @Autowired
    private UserBrowseLogMapper browseLogMapper;

    @Autowired
    private UserPurchaseLogMapper purchaseLogMapper;

    @Autowired
    private PurchaseLogItemMapper purchaseLogItemMapper;

    /**
     * 记录浏览日志
     */
    public void logBrowse(Long userId, Long productId, String productName, 
                         BigDecimal productPrice, String ipAddress, String userAgent) {
        UserBrowseLog log = new UserBrowseLog();
        log.setUserId(userId);
        log.setProductId(productId);
        log.setProductName(productName);
        log.setProductPrice(productPrice);
        log.setBrowseTime(LocalDateTime.now());
        log.setIpAddress(ipAddress);
        log.setUserAgent(userAgent);
        log.setCreateTime(LocalDateTime.now());
        
        browseLogMapper.insert(log);
    }

    /**
     * 记录购买日志（带商品明细）
     */
    @Transactional(rollbackFor = Exception.class)
    public void logPurchase(Long userId, Long orderId, BigDecimal totalAmount, 
                           List<OrderItem> orderItems, String ipAddress) {
        // 创建购买日志
        UserPurchaseLog log = new UserPurchaseLog();
        log.setUserId(userId);
        log.setOrderId(orderId);
        log.setTotalAmount(totalAmount);
        log.setItemCount(orderItems.size());
        log.setPurchaseTime(LocalDateTime.now());
        log.setIpAddress(ipAddress);
        log.setCreateTime(LocalDateTime.now());
        
        purchaseLogMapper.insert(log);
        
        // 创建商品明细
        List<PurchaseLogItem> items = new ArrayList<>();
        for (OrderItem orderItem : orderItems) {
            PurchaseLogItem item = new PurchaseLogItem();
            item.setLogId(log.getId());
            item.setProductId(orderItem.getProductId());
            item.setProductName(orderItem.getProductName());
            item.setProductPrice(orderItem.getPrice());
            item.setQuantity(orderItem.getQuantity());
            item.setSubtotal(orderItem.getSubtotal());
            item.setCreateTime(LocalDateTime.now());
            items.add(item);
        }
        
        purchaseLogItemMapper.batchInsert(items);
    }

    /**
     * 获取用户浏览历史
     */
    public List<UserBrowseLog> getUserBrowseHistory(Long userId, Integer limit) {
        return browseLogMapper.getRecentBrowseLog(userId, limit);
    }

    /**
     * 获取用户购买历史（带商品明细）
     */
    public List<Map<String, Object>> getUserPurchaseHistory(Long userId, Integer limit) {
        List<UserPurchaseLog> logs = purchaseLogMapper.getRecentPurchaseLog(userId, limit);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (UserPurchaseLog log : logs) {
            Map<String, Object> logMap = new HashMap<>();
            logMap.put("id", log.getId());
            logMap.put("orderId", log.getOrderId());
            logMap.put("totalAmount", log.getTotalAmount());
            logMap.put("itemCount", log.getItemCount());
            logMap.put("purchaseTime", log.getPurchaseTime());
            
            // 获取商品明细
            List<PurchaseLogItem> items = purchaseLogItemMapper.getItemsByLogId(log.getId());
            logMap.put("items", items);
            
            result.add(logMap);
        }
        
        return result;
    }

    /**
     * 获取用户浏览统计
     */
    public Map<String, Object> getUserBrowseStats(Long userId) {
        Map<String, Object> stats = new HashMap<>();
        
        // 总浏览次数
        List<UserBrowseLog> allLogs = browseLogMapper.getRecentBrowseLog(userId, 10000);
        stats.put("totalBrowse", allLogs.size());
        
        // 最近7天浏览次数
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        long recentCount = allLogs.stream()
            .filter(log -> log.getBrowseTime().isAfter(sevenDaysAgo))
            .count();
        stats.put("recentBrowse", recentCount);
        
        // 最常浏览的商品
        Map<Long, Long> productCounts = new HashMap<>();
        for (UserBrowseLog log : allLogs) {
            productCounts.merge(log.getProductId(), 1L, Long::sum);
        }
        stats.put("mostViewedProducts", productCounts);
        
        return stats;
    }

    /**
     * 获取用户购买统计
     */
    public Map<String, Object> getUserPurchaseStats(Long userId) {
        Map<String, Object> stats = new HashMap<>();
        
        // 总购买次数和金额
        List<UserPurchaseLog> allLogs = purchaseLogMapper.getRecentPurchaseLog(userId, 10000);
        stats.put("totalOrders", allLogs.size());
        
        BigDecimal totalAmount = allLogs.stream()
            .map(UserPurchaseLog::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalAmount", totalAmount);
        
        // 最近30天购买次数和金额
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<UserPurchaseLog> recentLogs = allLogs.stream()
            .filter(log -> log.getPurchaseTime().isAfter(thirtyDaysAgo))
            .toList();
        stats.put("recentOrders", recentLogs.size());
        
        BigDecimal recentAmount = recentLogs.stream()
            .map(UserPurchaseLog::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("recentAmount", recentAmount);
        
        return stats;
    }
}