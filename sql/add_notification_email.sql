-- 为订单表添加通知邮箱字段
-- 执行此脚本为已有数据库添加 notification_email 字段

USE ecommerce;

-- 检查并添加 notification_email 字段到 order 表
ALTER TABLE `order` 
ADD COLUMN IF NOT EXISTS `notification_email` VARCHAR(100) COMMENT '通知邮箱（用于接收订单相关通知）' 
AFTER `remark`;

-- 如果上面的语法不支持，使用以下方式（MySQL 8.0以下版本）
-- 先检查字段是否存在
-- SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
--                WHERE TABLE_SCHEMA = 'ecommerce' 
--                AND TABLE_NAME = 'order' 
--                AND COLUMN_NAME = 'notification_email');
-- SET @sqlstmt := IF(@exist = 0, 
--     'ALTER TABLE `order` ADD COLUMN `notification_email` VARCHAR(100) COMMENT ''通知邮箱（用于接收订单相关通知）'' AFTER `remark`',
--     'SELECT ''Column already exists''');
-- PREPARE stmt FROM @sqlstmt;
-- EXECUTE stmt;
-- DEALLOCATE PREPARE stmt;

-- 显示表结构确认
DESCRIBE `order`;