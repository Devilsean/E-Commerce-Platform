# 前端项目结构说明

## 📁 项目结构

```
public/
├── index.html          # 主HTML文件
├── style.css          # 样式文件
├── app.js             # 旧版单文件（已弃用）
├── js/                # JavaScript模块目录
│   ├── config.js      # 配置文件（API地址、常量等）
│   ├── utils.js       # 工具函数（HTML转义、日期格式化等）
│   ├── store.js       # 全局状态管理（用户、购物车等）
│   ├── router.js      # 路由管理（页面切换）
│   ├── auth.js        # 认证服务（登录、注册、退出）
│   ├── product.js     # 商品服务（商品列表、详情、加入购物车）
│   ├── cart.js        # 购物车服务（购物车管理、结算）
│   ├── profile.js     # 个人中心服务（订单管理）
│   ├── merchant.js    # 商家服务（商品管理）
│   └── main.js        # 应用入口（初始化）
└── css/               # CSS模块目录（预留）
```

## 🎯 模块说明

### 1. config.js - 配置模块
- 存储API基础地址
- 定义订单状态常量
- 统一管理配置信息

### 2. utils.js - 工具函数模块
- `escapeHtml()` - HTML转义防XSS
- `showMessage()` - 消息提示
- `formatDate()` - 日期格式化
- `formatPrice()` - 价格格式化
- `getLocalStorage()` / `setLocalStorage()` - 本地存储操作
- `debounce()` / `throttle()` - 防抖节流

### 3. store.js - 状态管理模块
- 管理全局状态（用户、购物车等）
- 提供状态读写接口
- 自动同步到本地存储
- 更新UI组件

### 4. router.js - 路由模块
- 页面导航管理
- 自动加载页面数据
- 平滑滚动效果

### 5. auth.js - 认证模块
- 用户注册
- 用户登录
- 退出登录
- Token管理

### 6. product.js - 商品模块
- 加载商品列表
- 显示商品详情
- 加入购物车

### 7. cart.js - 购物车模块
- 购物车展示
- 商品删除
- 订单结算

### 8. profile.js - 个人中心模块
- 用户信息展示
- 订单列表管理
- 订单筛选
- 订单操作（支付、取消、确认收货等）

### 9. merchant.js - 商家模块
- 商品列表管理
- 商品统计
- 商品操作（简化版）

### 10. main.js - 应用入口
- 初始化状态管理
- 加载首页数据
- 设置全局事件监听

## 🔧 加载顺序

HTML文件中按以下顺序加载JavaScript模块：

```html
<!-- 1. 配置 -->
<script src="js/config.js"></script>

<!-- 2. 工具函数 -->
<script src="js/utils.js"></script>

<!-- 3. 状态管理 -->
<script src="js/store.js"></script>

<!-- 4. 路由 -->
<script src="js/router.js"></script>

<!-- 5. 业务模块 -->
<script src="js/auth.js"></script>
<script src="js/product.js"></script>
<script src="js/cart.js"></script>
<script src="js/profile.js"></script>
<script src="js/merchant.js"></script>

<!-- 6. 应用入口 -->
<script src="js/main.js"></script>
```

## ✨ 模块化优势

1. **代码组织清晰** - 每个模块负责单一功能
2. **易于维护** - 修改某个功能只需编辑对应模块
3. **便于调试** - 快速定位问题所在模块
4. **可复用性强** - 模块可独立测试和复用
5. **团队协作友好** - 多人可同时开发不同模块
6. **按需加载** - 未来可实现模块懒加载优化性能

## 🚀 使用示例

### 调用商品服务
```javascript
// 加载商品列表
ProductService.loadProducts();

// 添加到购物车
ProductService.addToCart(1, '商品名', 99.99);
```

### 调用认证服务
```javascript
// 用户登录
await Auth.login('username', 'password');

// 退出登录
Auth.logout();
```

### 页面导航
```javascript
// 跳转到个人中心
Router.navigate('profile');

// 跳转到购物车
Router.navigate('cart');
```

### 状态管理
```javascript
// 获取当前用户
const user = Store.getCurrentUser();

// 获取购物车
const cart = Store.getCart();

// 添加到购物车
Store.addToCart(product);
```

## 📝 开发建议

1. **新增功能** - 在对应模块中添加方法
2. **新增页面** - 在router.js中注册路由
3. **新增状态** - 在store.js中添加状态管理
4. **新增常量** - 在config.js中定义

## 🔄 向后兼容

所有模块都提供了全局函数，保持与旧代码的兼容性：
- `showPage()` → `Router.navigate()`
- `login()` → `Auth.login()`
- `addToCart()` → `ProductService.addToCart()`

## 📦 未来优化

1. 使用ES6模块化 (import/export)
2. 引入构建工具 (Webpack/Vite)
3. 添加TypeScript类型支持
4. 实现模块懒加载
5. 添加单元测试