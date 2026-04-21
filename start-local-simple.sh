#!/bin/bash
# 本地启动（SQLite，无 Docker）

set -e

echo "🚀 本地启动 visual (SQLite + 端口 18780)"
echo ""

# 停止旧进程
echo "1️⃣  停止旧进程..."
pkill -f "node server.mjs" 2>/dev/null || true
lsof -ti:18780 | xargs kill -9 2>/dev/null || true
sleep 1
echo "✅ 完成"
echo ""

# 清理
echo "2️⃣  清理缓存和旧数据库..."
rm -rf .next node_modules/.cache dev.db dev.db-journal 2>/dev/null || true
echo "✅ 完成"
echo ""

# 加载环境变量
echo "3️⃣  加载配置..."
export $(cat .env | xargs)
echo "✅ 完成"
echo ""

# 初始化
echo "4️⃣  初始化数据库..."
npm run prisma:generate
npm run prisma:push
echo "✅ 完成"
echo ""

# 启动
echo "5️⃣  启动服务..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  http://localhost:18780"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
npm run dev
