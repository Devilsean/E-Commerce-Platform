package com.ecommerce.service;

import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 邮件服务
 */
@Slf4j
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${platform.name:电商平台}")
    private String platformName;

    /**
     * 发送简单文本邮件
     */
    @Async("taskExecutor")
    public void sendSimpleEmail(String to, String subject, String content) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
            log.info("邮件发送成功: to={}, subject={}", to, subject);
        } catch (Exception e) {
            log.error("邮件发送失败: to={}, subject={}, error={}", to, subject, e.getMessage());
        }
    }

    /**
     * 发送HTML邮件（异步）
     */
    @Async("taskExecutor")
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        doSendHtmlEmail(to, subject, htmlContent);
    }

    /**
     * 实际发送HTML邮件的方法（同步）
     * 供内部调用，避免嵌套@Async问题
     */
    private void doSendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            log.info("开始发送HTML邮件: to={}, subject={}", to, subject);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("HTML邮件发送成功: to={}, subject={}", to, subject);
        } catch (MessagingException e) {
            log.error("HTML邮件发送失败(MessagingException): to={}, subject={}, error={}", to, subject, e.getMessage(), e);
        } catch (Exception e) {
            log.error("HTML邮件发送失败(Exception): to={}, subject={}, error={}", to, subject, e.getMessage(), e);
        }
    }

    /**
     * 获取订单通知邮箱
     * 优先使用订单的通知邮箱，如果没有则使用用户邮箱
     */
    private String getNotificationEmail(User user, Order order) {
        // 优先使用订单指定的通知邮箱
        if (order.getNotificationEmail() != null && !order.getNotificationEmail().isEmpty()) {
            return order.getNotificationEmail();
        }
        // 其次使用用户邮箱
        if (user != null && user.getEmail() != null && !user.getEmail().isEmpty()) {
            return user.getEmail();
        }
        return null;
    }


    /**
     * 发送订单支付成功邮件
     */
    @Async("taskExecutor")
    public void sendPaymentSuccessEmail(User user, Order order) {
        String email = getNotificationEmail(user, order);
        if (email == null) {
            log.warn("无可用邮箱，无法发送支付成功邮件: userId={}, orderNo={}",
                user != null ? user.getId() : "null", order.getOrderNo());
            return;
        }

        String subject = String.format("[%s] 支付成功 - %s", platformName, order.getOrderNo());
        String htmlContent = buildPaymentSuccessHtml(user, order, null);
        doSendHtmlEmail(email, subject, htmlContent);
    }

    /**
     * 发送订单支付成功邮件（包含商品清单）
     */
    @Async("taskExecutor")
    public void sendPaymentSuccessEmail(User user, Order order, List<OrderItem> items) {
        String email = getNotificationEmail(user, order);
        if (email == null) {
            log.warn("无可用邮箱，无法发送支付成功邮件: userId={}, orderNo={}",
                user != null ? user.getId() : "null", order.getOrderNo());
            return;
        }

        log.info("准备发送支付成功邮件: email={}, orderNo={}, itemsCount={}",
            email, order.getOrderNo(), items != null ? items.size() : 0);
        
        String subject = String.format("[%s] 支付成功 - %s", platformName, order.getOrderNo());
        String htmlContent = buildPaymentSuccessHtml(user, order, items);
        doSendHtmlEmail(email, subject, htmlContent);
    }

    /**
     * 发送订单发货通知邮件
     */
    @Async("taskExecutor")
    public void sendShippingNotificationEmail(User user, Order order) {
        String email = getNotificationEmail(user, order);
        if (email == null) {
            log.warn("无可用邮箱，无法发送发货通知邮件: userId={}, orderNo={}",
                user != null ? user.getId() : "null", order.getOrderNo());
            return;
        }

        log.info("准备发送发货通知邮件: email={}, orderNo={}", email, order.getOrderNo());
        
        String subject = String.format("[%s] 订单已发货 - %s", platformName, order.getOrderNo());
        String htmlContent = buildShippingNotificationHtml(user, order);
        doSendHtmlEmail(email, subject, htmlContent);
    }


    /**
     * 构建支付成功HTML内容
     */
    private String buildPaymentSuccessHtml(User user, Order order, List<OrderItem> items) {
        // 获取用户名，如果用户为null则使用"尊敬的客户"
        String userName = "尊敬的客户";
        if (user != null && user.getUsername() != null) {
            userName = user.getUsername();
        }
        
        // 构建商品清单HTML
        String itemsHtml = "";
        if (items != null && !items.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            sb.append("""
                <div class="order-info">
                    <h3>商品清单</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>商品名称</th>
                                <th>数量</th>
                                <th>单价</th>
                                <th>小计</th>
                            </tr>
                        </thead>
                        <tbody>
                """);
            for (OrderItem item : items) {
                sb.append(String.format(
                    "<tr><td>%s</td><td>%d</td><td>¥%.2f</td><td>¥%.2f</td></tr>",
                    item.getProductName() != null ? item.getProductName() : "商品",
                    item.getQuantity() != null ? item.getQuantity() : 0,
                    item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO,
                    item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO
                ));
            }
            sb.append("""
                        </tbody>
                    </table>
                </div>
                """);
            itemsHtml = sb.toString();
        }

        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
                    .order-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
                    table { width: 100%%; border-collapse: collapse; margin: 15px 0; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background: #f5f5f5; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>支付成功</h1>
                    </div>
                    <div class="content">
                        <div class="success-icon">✓</div>
                        <p>尊敬的 %s，</p>
                        <p>您的订单已支付成功！我们将尽快为您安排发货。</p>
                        
                        <div class="order-info">
                            <h3>订单信息</h3>
                            <p><strong>订单号：</strong>%s</p>
                            <p><strong>支付金额：</strong><span style="color: #4CAF50; font-size: 20px; font-weight: bold;">¥%.2f</span></p>
                            <p><strong>支付时间：</strong>%s</p>
                        </div>
                        
                        %s
                        
                        <div class="order-info">
                            <h3>收货信息</h3>
                            <p><strong>收货人：</strong>%s</p>
                            <p><strong>联系电话：</strong>%s</p>
                            <p><strong>收货地址：</strong>%s</p>
                        </div>
                        
                        <p>商家将在1-2个工作日内为您发货，请耐心等待。</p>
                    </div>
                    <div class="footer">
                        <p>这是一封自动发送的邮件，请勿直接回复。</p>
                        <p>&copy; 2024 %s. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            userName,
            order.getOrderNo(),
            order.getActualAmount() != null ? order.getActualAmount() : order.getTotalAmount(),
            order.getPaymentTime() != null ? order.getPaymentTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "刚刚",
            itemsHtml,
            order.getReceiverName() != null ? order.getReceiverName() : "",
            order.getReceiverPhone() != null ? order.getReceiverPhone() : "",
            order.getReceiverAddress() != null ? order.getReceiverAddress() : "",
            platformName
        );
    }

    /**
     * 构建发货通知HTML内容
     */
    private String buildShippingNotificationHtml(User user, Order order) {
        // 获取用户名，如果用户为null则使用"尊敬的客户"
        String userName = "尊敬的客户";
        if (user != null && user.getUsername() != null) {
            userName = user.getUsername();
        }
        
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .order-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
                    .logistics { background: #e3f2fd; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #2196F3; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>订单已发货</h1>
                    </div>
                    <div class="content">
                        <p>尊敬的 %s，</p>
                        <p>您的订单已发货，请注意查收！</p>
                        
                        <div class="order-info">
                            <h3>订单信息</h3>
                            <p><strong>订单号：</strong>%s</p>
                            <p><strong>发货时间：</strong>%s</p>
                        </div>
                        
                        <div class="logistics">
                            <h3>物流信息</h3>
                            <p><strong>物流公司：</strong>%s</p>
                            <p><strong>物流单号：</strong>%s</p>
                        </div>
                        
                        <div class="order-info">
                            <h3>收货信息</h3>
                            <p><strong>收货人：</strong>%s</p>
                            <p><strong>联系电话：</strong>%s</p>
                            <p><strong>收货地址：</strong>%s</p>
                        </div>
                        
                        <p>预计3-5个工作日送达，请保持手机畅通。收到商品后请及时确认收货。</p>
                    </div>
                    <div class="footer">
                        <p>这是一封自动发送的邮件，请勿直接回复。</p>
                        <p>&copy; 2024 %s. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            userName,
            order.getOrderNo(),
            order.getDeliveryTime() != null ? order.getDeliveryTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "刚刚",
            order.getLogisticsCompany() != null ? order.getLogisticsCompany() : "待更新",
            order.getLogisticsNo() != null ? order.getLogisticsNo() : "待更新",
            order.getReceiverName() != null ? order.getReceiverName() : "",
            order.getReceiverPhone() != null ? order.getReceiverPhone() : "",
            order.getReceiverAddress() != null ? order.getReceiverAddress() : "",
            platformName
        );
    }

}