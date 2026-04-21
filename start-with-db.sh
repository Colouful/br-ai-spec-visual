#!/bin/bash
# 启动 visual 服务（使用 Docker MariaDB）

set -e
set -o pipefail

echo "🚀 启动 br-ai-spec-visual (端口 18780 + Docker MariaDB)"
echo ""

# 1. 启动 MariaDB
echo "1️⃣  启动 MariaDB 容器..."
docker-compose -f docker-compose-db-only.yml up -d
echo "✅ MariaDB 已启动"
echo ""

# 2. 等待数据库就绪
echo "2️⃣  等待数据库就绪..."
for i in {1..30}; do
  if docker-compose -f docker-compose-db-only.yml exec -T db mariadb -uvisual_user -pvisual_password_123 -e "SELECT 1" > /dev/null 2>&1; then
    echo "✅ 数据库就绪"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ 数据库启动超时"
    exit 1
  fi
  sleep 1
done
echo ""

# 3. 停止旧的 Node 进程
echo "3️⃣  停止旧进程..."
pkill -f "node server.mjs" 2>/dev/null || true
lsof -ti:18780 | xargs kill -9 2>/dev/null || true
sleep 1
echo "✅ 旧进程已停止"
echo ""

# 4. 清理缓存
echo "4️⃣  清理缓存..."
rm -rf .next node_modules/.cache 2>/dev/null || true
echo "✅ 缓存已清理"
echo ""

# 5. 检查配置
echo "5️⃣  检查配置..."
if [ ! -f ".env" ]; then
  echo "❌ .env 文件不存在"
  exit 1
fi
echo "   当前配置："
grep -Eiv "^(DATABASE_URL|.*SECRET.*|.*PASSWORD.*|.*_KEY.*|.*_TOKEN.*)=" .env || true
echo "✅ 配置文件正常"
echo ""

# 6. 初始化数据库
echo "6️⃣  初始化数据库..."
set -a
source .env
set +a

echo "   - 生成 Prisma Client..."
npm run prisma:generate
echo "   - 推送数据库 Schema..."
npm run prisma:push
echo "✅ 数据库初始化完成"
echo ""

# 7. 启动服务
echo "7️⃣  启动服务..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🌐 服务地址: http://localhost:18780"
echo "  🗄️  数据库: MariaDB (localhost:13306)"
echo "  🔍 健康检查: curl http://localhost:18780/api/health"
echo "  ⏹  停止: Ctrl+C (数据库会继续运行)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev
