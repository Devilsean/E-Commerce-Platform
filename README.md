# 电子商务平台系统

基于Spring Boot + MyBatis Plus + Redis + MySQL开发的全功能电商平台系统。

## 📋 目录

- [技术栈](#技术栈)
- [功能模块](#功能模块)
- [快速开始](#-快速开始)
- [环境变量配置](#-环境变量配置)
- [数据库说明](#-数据库说明)
- [API接口示例](#-api接口示例)
- [项目结构](#项目结构)
- [服务器优化方案](#️-服务器优化方案)
- [注意事项](#注意事项)
- [在线演示](#在线演示)

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| **后端框架** | Spring Boot | 3.1.5 |
| **ORM框架** | MyBatis Plus | 3.5.5 |
| **数据库** | MySQL | 8.0+ |
| **缓存** | Redis | 6.0+ |
| **安全框架** | Spring Security + JWT | - |
| **前端技术** | HTML5 + CSS3 + JavaScript (ES6+) | - |
| **构建工具** | Maven | 3.6+ |
| **JDK版本** | Java | 17+ |

## 功能模块

### 一、用户端模块
- ✅ 用户注册（手机号/邮箱验证，密码复杂度校验）
- ✅ 用户登录（账号密码登录、验证码登录、JWT Token）
- ✅ 个人中心（查看/修改个人信息、修改密码、账号注销）
- ✅ 收货地址管理（添加、编辑、删除、设为默认）
- ✅ 商品浏览和详情
- ✅ 购物车管理
- ✅ 订单管理（创建、支付、取消、确认收货）
- ✅ 邮件通知系统（支付成功、发货通知）
- ✅ 商品评价系统
- ✅ 用户行为日志（浏览、购买记录）

### 二、商家端模块
- ✅ 商家注册（选择商家身份注册）
- ✅ 商家登录（JWT Token认证）
- ✅ 店铺信息管理
- ✅ 商品管理（添加、编辑、删除、上下架）
- ✅ 商品图片支持（URL方式）
- ✅ 商品统计（总数、销量、收入）
- ✅ 订单处理（发货、物流信息）
- ✅ 销售统计报表（多维度统计、图表展示、日期筛选）
- ✅ 客户管理（浏览日志、购买日志、行为分析）

### 三、系统功能
- ✅ 商品分类管理（13个预设分类）
- ✅ 系统配置管理
- ✅ 健康检查接口
- ✅ 异步任务处理
- ✅ 全局异常处理

## 🚀 快速开始

### 环境要求

- JDK 17+
- MySQL 8.0+
- Redis 6.0+
- Maven 3.6+
- Python 3 (用于前端静态服务器)

### 1. 克隆项目

```bash
git clone <repository-url>
cd website
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
vim .env
```

### 3. 数据库初始化

```bash
# 创建数据库并导入初始数据
mysql -u root -p < sql/init.sql
```

### 4. 构建和启动

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

- **前端页面**: `http://localhost/`
- **后端API**: `http://localhost:8080/api`
- **健康检查**: `http://localhost:8080/api/health`

## 🔧 环境变量配置

项目支持通过 `.env` 文件配置环境变量，复制 `.env.example` 为 `.env` 并填写相应配置：

```bash
# 邮件配置 (Gmail)
# 注意：Gmail 需要使用"应用专用密码"，不能使用普通密码
# 获取应用专用密码步骤：
# 1. 登录 Google 账号 -> 安全性 -> 两步验证（必须开启）
# 2. 在两步验证页面底部找到"应用专用密码"
# 3. 选择"邮件"和"其他"，生成16位密码
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# 数据库配置（可选，如需覆盖默认值）
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ecommerce
DB_USER=root
DB_PASS=your-password

# Redis配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASS=
```

## 🗄️ 数据库说明

### SQL脚本文件

| 文件 | 说明 |
|------|------|
| `sql/init.sql` | 主初始化脚本，包含所有表结构和初始数据 |
| `sql/order_tables.sql` | 订单相关表结构（已包含在init.sql中） |
| `sql/user_logs.sql` | 用户日志表结构（已包含在init.sql中） |
| `sql/add_notification_email.sql` | 添加通知邮箱字段的迁移脚本 |
| `sql/maintenance.sql` | 数据库维护脚本（查询、修复等） |

### 数据库表结构

| 表名 | 说明 |
|------|------|
| `user` | 用户表 |
| `user_address` | 收货地址表 |
| `merchant` | 商家信息表 |
| `category` | 商品分类表 |
| `product` | 商品表 |
| `cart` | 购物车表 |
| `order` | 订单表 |
| `order_item` | 订单商品表 |
| `payment` | 支付记录表 |
| `product_review` | 商品评价表 |
| `user_browse_log` | 用户浏览日志表 |
| `user_purchase_log` | 用户购买日志表 |
| `purchase_log_item` | 购买日志商品明细表 |
| `system_config` | 系统配置表 |

### 预设商品分类

系统预设了13个商品分类：
-  数码家电
-  服饰鞋包
-  美妆个护
-  食品生鲜
-  家居生活
-  母婴亲子
-  运动户外
-  图书文娱
-  汽车用品
-  宠物用品
-  健康保健
-  虚拟商品
-  其他商品

## 📝 API接口示例

### 用户注册
```bash
curl -X POST http://localhost:8080/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123456",
    "phone": "13800138000",
    "email": "test@example.com",
    "userType": 1
  }'
```

### 商家注册
```bash
curl -X POST http://localhost:8080/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "merchant",
    "password": "Merchant123",
    "phone": "13900139000",
    "email": "merchant@example.com",
    "userType": 2
  }'
```

### 用户登录
```bash
curl -X POST http://localhost:8080/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "account": "testuser",
    "password": "Test123456",
    "userType": 1
  }'
```

### 商家登录
```bash
curl -X POST http://localhost:8080/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "account": "merchant",
    "password": "Merchant123",
    "userType": 2
  }'
```

### 商家添加商品
```bash
curl -X POST http://localhost:8080/api/merchant/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "商品名称",
    "description": "商品描述",
    "price": 99.99,
    "stock": 100,
    "mainImage": "https://example.com/image.jpg",
    "status": 1
  }'
```

### 获取商品列表（游客可访问）
```bash
curl -X GET http://localhost:8080/api/guest/products
```

## 用户类型说明

| userType | 类型 | 说明 |
|----------|------|------|
| 1 | 普通用户 | 可以浏览商品、购物、下单 |
| 2 | 商家 | 可以管理商品、处理订单 |

## 密码复杂度要求

- 至少8位字符
- 必须包含大写字母
- 必须包含小写字母
- 必须包含数字

示例：`Test123456`、`Merchant123`

## 项目结构

```
├── public/                          # 前端静态文件（纯HTML/CSS/JS）
│   ├── index.html                   # 主页面（SPA入口）
│   ├── app.js                       # 主业务逻辑
│   ├── icons.svg                    # SVG图标集
│   ├── css/                         # 样式文件
│   │   ├── main.css                 # 主样式入口
│   │   ├── variables.css            # CSS变量定义
│   │   ├── base.css                 # 基础样式
│   │   ├── components.css           # 通用组件样式
│   │   ├── navbar.css               # 导航栏样式
│   │   ├── products.css             # 商品列表样式
│   │   ├── cart.css                 # 购物车样式
│   │   ├── orders.css               # 订单样式
│   │   ├── profile.css              # 个人中心样式
│   │   └── ...                      # 其他样式文件
│   └── js/                          # 模块化JS文件
│       ├── config.js                # 配置文件
│       ├── auth.js                  # 认证模块
│       ├── cart.js                  # 购物车模块
│       ├── order.js                 # 订单模块
│       ├── product.js               # 商品模块
│       ├── profile.js               # 个人中心模块
│       ├── merchant.js              # 商家模块
│       ├── router.js                # 路由模块
│       └── ...                      # 其他模块
├── src/                             # 后端源码
│   └── main/
│       ├── java/com/ecommerce/
│       │   ├── EcommercePlatformApplication.java  # 启动类
│       │   ├── common/              # 通用类
│       │   │   ├── Result.java      # 统一响应结果
│       │   │   └── ResultCode.java  # 响应状态码
│       │   ├── config/              # 配置类
│       │   │   ├── AsyncConfig.java       # 异步配置
│       │   │   ├── MybatisPlusConfig.java # MyBatis Plus配置
│       │   │   ├── RedisConfig.java       # Redis配置
│       │   │   └── SecurityConfig.java    # 安全配置
│       │   ├── controller/          # 控制器
│       │   │   ├── UserController.java    # 用户接口
│       │   │   ├── MerchantController.java # 商家接口
│       │   │   ├── OrderController.java   # 订单接口
│       │   │   ├── GuestController.java   # 游客接口
│       │   │   ├── AdminController.java   # 管理员接口
│       │   │   └── HealthController.java  # 健康检查接口
│       │   ├── entity/              # 实体类
│       │   ├── mapper/              # MyBatis Mapper
│       │   ├── service/             # 服务层
│       │   ├── exception/           # 异常处理
│       │   └── utils/               # 工具类
│       └── resources/
│           └── application.yml      # 应用配置
├── sql/                             # 数据库脚本
│   ├── init.sql                     # 主初始化脚本
│   ├── order_tables.sql             # 订单表结构
│   ├── user_logs.sql                # 用户日志表
│   ├── add_notification_email.sql   # 迁移脚本
│   └── maintenance.sql              # 维护脚本
├── .env.example                     # 环境变量模板
├── .gitignore                       # Git忽略文件
├── run.sh                           # 统一启动脚本
├── pom.xml                          # Maven配置
└── README.md                        # 项目说明
```

## ⚙️ 服务器优化方案

### 前端优化
- ✅ **纯静态文件**：HTML + CSS + JavaScript
- ✅ **零构建过程**：无需npm、webpack、vite
- ✅ **零内存占用**：不会导致OOM
- ✅ **即改即用**：修改代码后刷新浏览器即可

### 后端优化
- ✅ JVM堆内存限制：512MB-1GB
- ✅ G1垃圾回收器
- ✅ 限制GC线程数
- ✅ Maven缓存优化

## 注意事项

1. **首次构建**：仅需构建后端，约2-3分钟
2. **服务器配置**：2核4G即可稳定运行
3. **数据库初始化**：首次运行需执行 `sql/init.sql`
4. **前端修改**：直接编辑public目录下的文件，刷新浏览器即可
5. **JWT密钥**：生产环境建议修改 `application.yml` 中的 `jwt.secret`
6. **商家功能**：商家需要以商家身份（userType=2）注册和登录
7. **邮件功能**：需要配置 `.env` 文件中的SMTP设置才能发送邮件通知
8. **默认管理员**：用户名 `admin`，密码 `admin123`

## 配置文件

主要配置在 `src/main/resources/application.yml`：

```yaml
# 数据库配置
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/ecommerce
    username: root
    password: your_password

# JWT配置
jwt:
  secret: your-secret-key
  expiration: 604800000  # 7天

# 邮件配置（通过环境变量）
mail:
  host: ${SMTP_HOST:smtp.gmail.com}
  port: ${SMTP_PORT:587}
  username: ${SMTP_USER:}
  password: ${SMTP_PASS:}
```

## 🔌 API端点概览

### 公开接口（无需认证）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/guest/products` | 获取商品列表 |
| GET | `/api/guest/products/{id}` | 获取商品详情 |
| GET | `/api/guest/categories` | 获取分类列表 |
| POST | `/api/user/register` | 用户注册 |
| POST | `/api/user/login` | 用户登录 |

### 用户接口（需要认证）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/user/profile` | 获取个人信息 |
| PUT | `/api/user/profile` | 更新个人信息 |
| PUT | `/api/user/password` | 修改密码 |
| DELETE | `/api/user/account` | 注销账号 |
| GET | `/api/user/cart` | 获取购物车 |
| POST | `/api/user/cart` | 添加到购物车 |
| GET | `/api/user/orders` | 获取订单列表 |
| POST | `/api/user/orders` | 创建订单 |

### 商家接口（需要商家认证）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/merchant/products` | 获取商家商品 |
| POST | `/api/merchant/products` | 添加商品 |
| PUT | `/api/merchant/products/{id}` | 更新商品 |
| DELETE | `/api/merchant/products/{id}` | 删除商品 |
| GET | `/api/merchant/orders` | 获取商家订单 |
| PUT | `/api/merchant/orders/{id}/ship` | 发货 |
| GET | `/api/merchant/stats` | 获取统计数据 |
| GET | `/api/merchant/customers` | 获取客户列表 |

## 在线演示

- 地址：http://116.205.136.231/#/
- 学号：202330451971
- 姓名：谢毅

