#!/usr/bin/env node
/**
 * 批量删除项目中所有emoji的脚本
 */

const fs = require('fs');
const path = require('path');

// 常见emoji正则表达式
const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;

// 需要处理的文件扩展名
const extensions = ['.js', '.html', '.sql'];

// 排除的目录
const excludeDirs = ['node_modules', '.git', '.mvn', 'target'];

// 统计信息
let stats = {
    filesProcessed: 0,
    filesModified: 0,
    emojisRemoved: 0
};

/**
 * 递归处理目录
 */
function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (!excludeDirs.includes(file)) {
                processDirectory(filePath);
            }
        } else if (stat.isFile()) {
            const ext = path.extname(file);
            if (extensions.includes(ext)) {
                processFile(filePath);
            }
        }
    }
}

/**
 * 处理单个文件
 */
function processFile(filePath) {
    stats.filesProcessed++;

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;

        // 计算emoji数量
        const matches = content.match(emojiRegex);
        if (matches) {
            stats.emojisRemoved += matches.length;

            // 删除emoji
            content = content.replace(emojiRegex, '');

            // 写回文件
            fs.writeFileSync(filePath, content, 'utf8');
            stats.filesModified++;

            console.log(`✓ ${filePath}: 移除 ${matches.length} 个emoji`);
        }
    } catch (error) {
        console.error(`✗ 处理文件失败 ${filePath}:`, error.message);
    }
}

/**
 * 主函数
 */
function main() {
    console.log('开始清理emoji...\n');

    const startTime = Date.now();

    // 处理public目录
    if (fs.existsSync('public')) {
        console.log('处理 public/ 目录...');
        processDirectory('public');
    }

    // 处理sql目录
    if (fs.existsSync('sql')) {
        console.log('\n处理 sql/ 目录...');
        processDirectory('sql');
    }

    const endTime = Date.now();

    // 输出统计信息
    console.log('\n' + '='.repeat(50));
    console.log('清理完成!');
    console.log('='.repeat(50));
    console.log(`处理文件数: ${stats.filesProcessed}`);
    console.log(`修改文件数: ${stats.filesModified}`);
    console.log(`移除emoji数: ${stats.emojisRemoved}`);
    console.log(`耗时: ${(endTime - startTime)}ms`);
    console.log('='.repeat(50));
}

// 执行
main();