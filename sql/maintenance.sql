-- ====================================
-- 数据库维护脚本
-- ====================================

USE ecommerce;

-- ====================================
-- 1. 查询当前所有分类
-- ====================================
-- SELECT id, name, icon, sort_order FROM category ORDER BY id;

-- ====================================
-- 2. 更新分类数据（如果需要重置分类）
-- ====================================
-- 注意：执行前请备份数据！
-- DELETE FROM category;
-- INSERT INTO category (name, parent_id, sort_order, icon) VALUES
-- ('数码家电', 0, 1, '📱'),
-- ('服饰鞋包', 0, 2, '👔'),
-- ('美妆个护', 0, 3, '💄'),
-- ('食品生鲜', 0, 4, '🍎'),
-- ('家居生活', 0, 5, '🏠'),
-- ('母婴亲子', 0, 6, '👶'),
-- ('运动户外', 0, 7, '⚽'),
-- ('图书文娱', 0, 8, '📚'),
-- ('汽车用品', 0, 9, '🚗'),
-- ('宠物用品', 0, 10, '🐾'),
-- ('健康保健', 0, 11, '💊'),
-- ('虚拟商品', 0, 12, '💳'),
-- ('其他商品', 0, 99, '📦');

-- ====================================
-- 3. 修复商品分类（将无效分类ID更新为"其他商品"）
-- ====================================
-- UPDATE product 
-- SET category_id = (SELECT id FROM category WHERE name = '其他商品' LIMIT 1) 
-- WHERE category_id NOT IN (SELECT id FROM category);

-- ====================================
-- 4. 查询商品及其分类
-- ====================================
-- SELECT p.id, p.name, p.category_id, c.name as category_name 
-- FROM product p 
-- LEFT JOIN category c ON p.category_id = c.id 
-- ORDER BY p.id DESC 
-- LIMIT 10;

-- ====================================
-- 5. 统计各分类商品数量
-- ====================================
-- SELECT c.id, c.name, COUNT(p.id) as product_count
-- FROM category c
-- LEFT JOIN product p ON c.id = p.category_id AND p.deleted = 0
-- WHERE c.deleted = 0
-- GROUP BY c.id, c.name
-- ORDER BY c.sort_order;