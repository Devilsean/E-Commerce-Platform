# 电子商务平台系统

基于Spring Boot + MyBatis Plus + Redis + MySQL开发的全功能电商平台系统。

## 技术栈

- **后端框架**: Spring Boot 3.1.5
- **ORM框架**: MyBatis Plus 3.5.5
- **数据库**: MySQL 8.0
- **缓存**: Redis
- **安全框架**: Spring Security + JWT
- **前端技术**: HTML5 + CSS3 + JavaScript (ES6+)
- **构建工具**: Maven
- **JDK版本**: Java 17

## 功能模块

### 一、用户端模块
- ✅ 用户注册（手机号/邮箱验证，密码复杂度校验）
- ✅ 用户登录（账号密码登录、验证码登录、JWT Token）
- ✅ 个人中心（查看/修改个人信息、修改密码）
- ✅ 商品浏览和详情
- ✅ 购物车管理
- ✅ 订单管理

### 二、商家端模块
- ✅ 商家登录
- ✅ 商品管理
- ✅ 订单处理

### 三、系统管理模块
- ✅ 用户管理
- ✅ 商家管理
- ✅ 分类管理

## 🚀 快速开始

### 统一启动脚本

```bash
# 首次运行：构建后端
./run.sh build

# 启动服务
./run.sh start

# 停止服务
./run.sh stop

# 重启服务
./run.sh restart
```

### 访问地址

- **前端页面**: `http://服务器IP/`
- **后端API**: `http://服务器IP:8080/api`

### 前端说明

前端采用**纯HTML+CSS+JavaScript**实现，完美适配2核4G服务器：
- ✅ **零构建**：无需npm、webpack、vite等构建工具
- ✅ **零依赖**：不需要node_modules
- ✅ **即改即用**：修改代码后刷新浏览器即可
- ✅ **轻量级**：总大小不到100KB
- ✅ **完整功能**：用户注册/登录、商品浏览、购物车等

## ⚙️ 2核4G服务器优化方案

### 前端优化
- ✅ **纯静态文件**：HTML + CSS + JavaScript
- ✅ **零构建过程**：无需npm、webpack、vite
- ✅ **零内存占用**：不会导致OOM
- ✅ **文件结构**：
  - [`public/index.html`](public/index.html:1) - 主页面
  - [`public/style.css`](public/style.css:1) - 样式文件
  - [`public/app.js`](public/app.js:1) - 业务逻辑

### 后端优化
- ✅ JVM堆内存限制：512MB-1GB
- ✅ G1垃圾回收器
- ✅ 限制GC线程数
- ✅ Maven缓存优化

**资源对比**：
- 优化前：React构建需1.5GB+内存，经常OOM ❌
- 优化后：纯HTML无需构建，后端峰值1GB ✅

## 📝 API接口示例

### 用户注册
```bash
curl -X POST http://localhost:8080/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123456",
    "phone": "13800138000",
    "email": "test@example.com"
  }'
```

### 用户登录
```bash
curl -X POST http://localhost:8080/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "account": "testuser",
    "password": "Test123456"
  }'
```

### 获取用户信息
```bash
curl -X GET http://localhost:8080/api/user/info \
  -H "Authorization: Bearer {token}"
```

## 密码复杂度要求

- 至少8位字符
- 必须包含大写字母
- 必须包含小写字母
- 必须包含数字

示例：`Test123456`

## 项目结构

```
/root/website/
├── public/              # 前端静态文件（纯HTML/CSS/JS）
│   ├── index.html      # 主页面
│   ├── style.css       # 样式文件
│   └── app.js          # 业务逻辑
├── src/                # 后端源码
├── sql/                # 数据库脚本
├── run.sh              # 统一启动脚本
├── pom.xml             # Maven配置
└── README.md           # 项目说明
```

## 注意事项

1. **首次构建**：仅需构建后端，约2-3分钟
2. **服务器配置**：2核4G即可稳定运行
3. **数据库初始化**：首次运行需执行 `sql/init.sql`
4. **前端修改**：直接编辑public目录下的文件，刷新浏览器即可
5. **JWT密钥**：生产环境建议修改为更安全的值

## 许可证

MIT License