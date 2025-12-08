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
    @Async
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
     * 发送HTML邮件
     */
    @Async
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("HTML邮件发送成功: to={}, subject={}", to, subject);
        } catch (MessagingException e) {
            log.error("HTML邮件发送失败: to={}, subject={}, error={}", to, subject, e.getMessage());
        }
    }

    /**
     * 发送订单确认邮件
     */
    @Async
    public void sendOrderConfirmationEmail(User user, Order order, List<OrderItem> items) {
        if (user.getEmail() == null || user.getEmail().isEmpty()) {
            log.warn("用户邮箱为空，无法发送订单确认邮件: userId={}", user.getId());
            return;
        }

        String subject = String.format("[%s] 订单确认 - %s", platformName, order.getOrderNo());
        String htmlContent = buildOrderConfirmationHtml(user, order, items);
        sendHtmlEmail(user.getEmail(), subject, htmlContent);
    }

    /**
     * 发送订单支付成功邮件
     */
    @Async
    public void sendPaymentSuccessEmail(User user, Order order) {
        if (user.getEmail() == null || user.getEmail().isEmpty()) {
            log.warn("用户邮箱为空，无法发送支付成功邮件: userId={}", user.getId());
            return;
        }

        String subject = String.format("[%s] 支付成功 - %s", platformName, order.getOrderNo());
        String htmlContent = buildPaymentSuccessHtml(user, order);
        sendHtmlEmail(user.getEmail(), subject, htmlContent);
    }

    /**
     * 发送订单发货通知邮件
     */
    @Async
    public void sendShippingNotificationEmail(User user, Order order) {
        if (user.getEmail() == null || user.getEmail().isEmpty()) {
            log.warn("用户邮箱为空，无法发送发货通知邮件: userId={}", user.getId());
            return;
        }

        String subject = String.format("[%s] 订单已发货 - %s", platformName, order.getOrderNo());
        String htmlContent = buildShippingNotificationHtml(user, order);
        sendHtmlEmail(user.getEmail(), subject, htmlContent);
    }

    /**
     * 发送订单完成邮件
     */
    @Async
    public void sendOrderCompletionEmail(User user, Order order) {
        if (user.getEmail() == null || user.getEmail().isEmpty()) {
            log.warn("用户邮箱为空，无法发送订单完成邮件: userId={}", user.getId());
            return;
        }

        String subject = String.format("[%s] 订单已完成 - %s", platformName, order.getOrderNo());
        String htmlContent = buildOrderCompletionHtml(user, order);
        sendHtmlEmail(user.getEmail(), subject, htmlContent);
    }

    /**
     * 构建订单确认HTML内容
     */
    private String buildOrderConfirmationHtml(User user, Order order, List<OrderItem> items) {
        StringBuilder itemsHtml = new StringBuilder();
        for (OrderItem item : items) {
            itemsHtml.append(String.format(
                "<tr><td>%s</td><td>%d</td><td>¥%.2f</td><td>¥%.2f</td></tr>",
                item.getProductName(),
                item.getQuantity(),
                item.getPrice(),
                item.getSubtotal()
            ));
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
                    .order-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
                    table { width: 100%%; border-collapse: collapse; margin: 15px 0; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background: #f5f5f5; }
                    .total { font-size: 18px; font-weight: bold; color: #4CAF50; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>订单确认</h1>
                    </div>
                    <div class="content">
                        <p>尊敬的 %s，</p>
                        <p>感谢您在%s下单！您的订单已成功创建。</p>
                        
                        <div class="order-info">
                            <h3>订单信息</h3>
                            <p><strong>订单号：</strong>%s</p>
                            <p><strong>下单时间：</strong>%s</p>
                            <p><strong>订单状态：</strong>待支付</p>
                        </div>
                        
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
                                    %s
                                </tbody>
                            </table>
                            <p class="total">订单总额：¥%.2f</p>
                        </div>
                        
                        <div class="order-info">
                            <h3>收货信息</h3>
                            <p><strong>收货人：</strong>%s</p>
                            <p><strong>联系电话：</strong>%s</p>
                            <p><strong>收货地址：</strong>%s</p>
                        </div>
                        
                        <p style="color: #ff5722; font-weight: bold;">请尽快完成支付，未支付订单将在30分钟后自动取消。</p>
                    </div>
                    <div class="footer">
                        <p>这是一封自动发送的邮件，请勿直接回复。</p>
                        <p>&copy; 2024 %s. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            user.getUsername(),
            platformName,
            order.getOrderNo(),
            order.getCreateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
            itemsHtml.toString(),
            order.getTotalAmount(),
            order.getReceiverName(),
            order.getReceiverPhone(),
            order.getReceiverAddress(),
            platformName
        );
    }

    /**
     * 构建支付成功HTML内容
     */
    private String buildPaymentSuccessHtml(User user, Order order) {
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
            user.getUsername(),
            order.getOrderNo(),
            order.getActualAmount(),
            order.getPaymentTime() != null ? order.getPaymentTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "刚刚",
            order.getReceiverName(),
            order.getReceiverPhone(),
            order.getReceiverAddress(),
            platformName
        );
    }

    /**
     * 构建发货通知HTML内容
     */
    private String buildShippingNotificationHtml(User user, Order order) {
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
            user.getUsername(),
            order.getOrderNo(),
            order.getDeliveryTime() != null ? order.getDeliveryTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "刚刚",
            order.getLogisticsCompany() != null ? order.getLogisticsCompany() : "待更新",
            order.getLogisticsNo() != null ? order.getLogisticsNo() : "待更新",
            order.getReceiverName(),
            order.getReceiverPhone(),
            order.getReceiverAddress(),
            platformName
        );
    }

    /**
     * 构建订单完成HTML内容
     */
    private String buildOrderCompletionHtml(User user, Order order) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .order-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
                    .thank-you { text-align: center; font-size: 24px; color: #FF9800; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>订单已完成</h1>
                    </div>
                    <div class="content">
                        <div class="thank-you">感谢您的购买！</div>
                        <p>尊敬的 %s，</p>
                        <p>您的订单已确认收货，交易完成。</p>
                        
                        <div class="order-info">
                            <h3>订单信息</h3>
                            <p><strong>订单号：</strong>%s</p>
                            <p><strong>完成时间：</strong>%s</p>
                            <p><strong>订单金额：</strong><span style="color: #FF9800; font-size: 18px; font-weight: bold;">¥%.2f</span></p>
                        </div>
                        
                        <p>如果您对商品满意，欢迎给予好评！如有任何问题，请随时联系我们的客服。</p>
                        <p>期待您的再次光临！</p>
                    </div>
                    <div class="footer">
                        <p>这是一封自动发送的邮件，请勿直接回复。</p>
                        <p>&copy; 2024 %s. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            user.getUsername(),
            order.getOrderNo(),
            order.getFinishTime() != null ? order.getFinishTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "刚刚",
            order.getActualAmount(),
            platformName
        );
    }
}