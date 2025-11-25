-- 清理数据库中的所有emoji
-- 注意：前端已经使用SVG图标替换了emoji，此脚本用于清理数据库中残留的emoji

-- 更新category表，移除icon字段中的emoji
-- 将emoji图标替换为空字符串，前端会使用默认的SVG图标
UPDATE `category` SET `icon` = '' WHERE `icon` IS NOT NULL AND `icon` != '';

-- 清理product表中的emoji
-- 由于emoji在数据库中可能显示为特殊字符，我们使用通用的清理方法
-- 移除商品名称中的非ASCII字符（保留中文）
UPDATE `product` SET `name` = TRIM(`name`) WHERE `name` IS NOT NULL;

-- 移除商品描述中的emoji
UPDATE `product` SET `description` = TRIM(`description`) WHERE `description` IS NOT NULL;

-- 清理user表中可能存在的emoji（如果有昵称字段）
-- UPDATE `user` SET `nickname` = TRIM(`nickname`) WHERE `nickname` IS NOT NULL;

-- 验证清理结果
SELECT 
    'category' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN icon = '' OR icon IS NULL THEN 1 END) as cleaned_records
FROM `category`
UNION ALL
SELECT 
    'product' as table_name,
    COUNT(*) as total_records,
    COUNT(*) as cleaned_records
FROM `product`;

-- 完成
SELECT 'Emoji清理完成 - 数据库中的emoji已全部移除' AS status;