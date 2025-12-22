package com.ecommerce.controller;

import com.ecommerce.common.Result;
import com.ecommerce.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * 健康检查控制器
 */
@RestController
@RequestMapping("/health")
public class HealthController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private EmailService emailService;

    @Value("${spring.mail.username:未配置}")
    private String mailUsername;

    /**
     * 简单健康检查
     */
    @GetMapping
    public Result<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        health.put("application", "E-Commerce Platform");
        health.put("version", "1.0.0");
        return Result.success(health);
    }

    /**
     * 详细健康检查（包含数据库和Redis状态）
     */
    @GetMapping("/detail")
    public Result<Map<String, Object>> healthDetail() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        health.put("application", "E-Commerce Platform");
        health.put("version", "1.0.0");

        // 检查数据库连接
        Map<String, Object> database = new HashMap<>();
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            database.put("status", "UP");
            database.put("type", "MySQL");
        } catch (Exception e) {
            database.put("status", "DOWN");
            database.put("error", e.getMessage());
        }
        health.put("database", database);

        // 检查Redis连接
        Map<String, Object> redis = new HashMap<>();
        try {
            redisTemplate.opsForValue().set("health:check", "OK");
            String value = (String) redisTemplate.opsForValue().get("health:check");
            if ("OK".equals(value)) {
                redis.put("status", "UP");
            } else {
                redis.put("status", "DOWN");
            }
        } catch (Exception e) {
            redis.put("status", "DOWN");
            redis.put("error", e.getMessage());
        }
        health.put("redis", redis);

        // 系统信息
        Map<String, Object> system = new HashMap<>();
        Runtime runtime = Runtime.getRuntime();
        system.put("processors", runtime.availableProcessors());
        system.put("totalMemory", runtime.totalMemory() / 1024 / 1024 + " MB");
        system.put("freeMemory", runtime.freeMemory() / 1024 / 1024 + " MB");
        system.put("maxMemory", runtime.maxMemory() / 1024 / 1024 + " MB");
        health.put("system", system);

        return Result.success(health);
    }

    /**
     * 存活检查（Liveness Probe）
     */
    @GetMapping("/live")
    public Result<String> liveness() {
        return Result.success("OK");
    }

    /**
     * 就绪检查（Readiness Probe）
     */
    @GetMapping("/ready")
    public Result<Map<String, Object>> readiness() {
        Map<String, Object> ready = new HashMap<>();
        boolean isReady = true;

        // 检查数据库
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            ready.put("database", "UP");
        } catch (Exception e) {
            ready.put("database", "DOWN");
            isReady = false;
        }

        // 检查Redis
        try {
            redisTemplate.opsForValue().set("ready:check", "OK");
            ready.put("redis", "UP");
        } catch (Exception e) {
            ready.put("redis", "DOWN");
            isReady = false;
        }

        ready.put("ready", isReady);
        return Result.success(ready);
    }

    /**
     * 测试邮件发送
     * 使用方法: GET /api/health/test-email?to=your-email@example.com
     */
    @GetMapping("/test-email")
    public Result<Map<String, Object>> testEmail(@RequestParam String to) {
        Map<String, Object> result = new HashMap<>();
        result.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        result.put("mailConfig", mailUsername);
        result.put("targetEmail", to);
        
        try {
            String subject = "邮件测试 - 电商平台";
            String content = String.format("""
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #4CAF50;">✓ 邮件配置测试成功！</h2>
                    <p>这是一封测试邮件，用于验证邮件服务配置是否正确。</p>
                    <p><strong>发送时间：</strong>%s</p>
                    <p><strong>发件邮箱：</strong>%s</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">此邮件由电商平台自动发送</p>
                </body>
                </html>
                """,
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                mailUsername
            );
            
            emailService.sendHtmlEmail(to, subject, content);
            result.put("status", "SUCCESS");
            result.put("message", "邮件已发送（异步），请检查收件箱和垃圾邮件文件夹");
        } catch (Exception e) {
            result.put("status", "FAILED");
            result.put("error", e.getMessage());
        }
        
        return Result.success(result);
    }
}