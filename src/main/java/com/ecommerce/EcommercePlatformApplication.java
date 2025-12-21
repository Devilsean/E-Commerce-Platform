package com.ecommerce;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * 电商平台主应用启动类
 */
@SpringBootApplication
@MapperScan("com.ecommerce.mapper")
@EnableScheduling
public class EcommercePlatformApplication {

    public static void main(String[] args) {
        long startTime = System.currentTimeMillis();
        
        ConfigurableApplicationContext context = SpringApplication.run(EcommercePlatformApplication.class, args);
        
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        
        Environment env = context.getEnvironment();
        String port = env.getProperty("server.port", "8080");
        String contextPath = env.getProperty("server.servlet.context-path", "");
        
        String hostAddress = "localhost";
        try {
            hostAddress = InetAddress.getLocalHost().getHostAddress();
        } catch (UnknownHostException e) {
            // 忽略，使用默认值
        }
        
        System.out.println("\n========================================");
        System.out.println("  电商平台启动成功！");
        System.out.println("  启动耗时: " + duration + " ms");
        System.out.println("  本地访问: http://localhost:" + port + contextPath);
        System.out.println("  网络访问: http://" + hostAddress + ":" + port + contextPath);
        System.out.println("========================================\n");
    }
}