-- 迁移脚本：修复用户类型字段
-- 将 user_type 从旧的编码（0-普通用户，1-商家，2-管理员）
-- 迁移到新的编码（1-普通用户，2-商家，3-管理员）

USE ecommerce;

-- 更新用户类型
UPDATE `user` SET `user_type` = 3 WHERE `user_type` = 2; -- 管理员：2 -> 3
UPDATE `user` SET `user_type` = 2 WHERE `user_type` = 1; -- 商家：1 -> 2
UPDATE `user` SET `user_type` = 1 WHERE `user_type` = 0; -- 普通用户：0 -> 1

-- 修改表结构默认值
ALTER TABLE `user` MODIFY COLUMN `user_type` TINYINT DEFAULT 1 COMMENT '用户类型：1-普通用户，2-商家，3-管理员';