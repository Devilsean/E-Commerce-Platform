#!/bin/bash

# 电商平台统一启动脚本
# 用法: ./run.sh [build|start|stop|restart]

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="/root/website"
cd $PROJECT_DIR

# 加载环境变量文件
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ 加载 .env 配置文件${NC}"
    set -a
    source .env
    set +a
else
    echo -e "${YELLOW}⚠ 未找到 .env 文件，使用默认配置${NC}"
    echo -e "${YELLOW}  提示: 复制 .env.example 为 .env 并填写配置${NC}"
fi

# 设置环境变量
export MAVEN_OPTS="-Xmx1024m -Xms512m -XX:MaxMetaspaceSize=256m"
export NODE_OPTIONS="--max-old-space-size=1536"

build() {
    echo -e "${YELLOW}开始构建项目...${NC}"
    
    # 构建后端
    echo -e "${YELLOW}[1/2] 构建后端...${NC}"
    mvn clean package -DskipTests -T 1 -q
    echo -e "${GREEN}✓ 后端构建完成${NC}"
    
    # 前端已使用纯HTML/CSS/JS，无需构建
    echo -e "${YELLOW}[2/2] 前端准备...${NC}"
    if [ ! -d "public" ]; then
        echo -e "${RED}✗ public目录不存在${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ 前端已就绪（无需构建）${NC}"
    
    echo -e "${GREEN}✓ 构建完成！${NC}"
}

start() {
    echo -e "${YELLOW}启动服务...${NC}"
    
    # 启动后端
    if pgrep -f "ecommerce-platform" > /dev/null; then
        echo -e "${GREEN}✓ 后端已在运行${NC}"
    else
        nohup java -jar target/ecommerce-platform-1.0.0.jar > app.log 2>&1 &
        sleep 3
        echo -e "${GREEN}✓ 后端已启动${NC}"
    fi
    
    # 启动前端
    if pgrep -f "python3 -m http.server" > /dev/null; then
        echo -e "${GREEN}✓ 前端已在运行${NC}"
    else
        cd public
        nohup python3 -m http.server 80 > /dev/null 2>&1 &
        cd ..
        sleep 2
        echo -e "${GREEN}✓ 前端已启动${NC}"
    fi
    
    # 获取公网IP
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}服务启动成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo "前端: http://$PUBLIC_IP/"
    echo "后端: http://$PUBLIC_IP:8080/api"
    echo ""
}

stop() {
    echo -e "${YELLOW}停止服务...${NC}"
    pkill -f "ecommerce-platform" 2>/dev/null || true
    pkill -f "python3 -m http.server" 2>/dev/null || true
    echo -e "${GREEN}✓ 服务已停止${NC}"
}

restart() {
    stop
    sleep 2
    start
}

case "$1" in
    build)
        build
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    *)
        echo "用法: ./run.sh [build|start|stop|restart]"
        echo ""
        echo "命令说明:"
        echo "  build   - 构建项目（首次运行或代码更新后使用）"
        echo "  start   - 启动服务"
        echo "  stop    - 停止服务"
        echo "  restart - 重启服务"
        echo ""
        echo "示例:"
        echo "  ./run.sh build   # 构建项目"
        echo "  ./run.sh start   # 启动服务"
        exit 1
        ;;
esac