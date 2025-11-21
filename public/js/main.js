// 主应用入口文件

// 应用初始化
document.addEventListener('DOMContentLoaded', function () {
    console.log(`${CONFIG.APP_NAME} v${CONFIG.VERSION} 启动中...`);

    // 初始化状态管理
    Store.init();

    // 加载首页商品
    ProductService.loadProducts();

    console.log(`${CONFIG.APP_NAME} 启动完成！`);
});

// 模态框外部点击关闭
document.addEventListener('click', function (event) {
    const modal = document.getElementById('productModal');
    if (event.target === modal) {
        closeProductModal();
    }
});