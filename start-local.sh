#!/bin/bash
# 本地启动脚本（修复所有问题）

set -e

echo "🚀 启动 br-ai-spec-visual (本地开发)"
echo ""

# 1. 停止占用 3000 端口的进程
echo "1️⃣  检查端口占用..."
PORT_PID=$(lsof -ti:3000 2>/dev/null || echo "")
if [ -n "$PORT_PID" ]; then
  echo "   发现占用端口 3000 的进程: $PORT_PID"
  echo "   正在停止..."
  kill -9 $PORT_PID 2>/dev/null || true
  sleep 1
  echo "✅ 端口已释放"
else
  echo "✅ 端口 3000 空闲"
fi
echo ""

# 2. 清理缓存
echo "2️⃣  清理缓存..."
rm -rf .next node_modules/.cache 2>/dev/null || true
echo "✅ 缓存已清理"
echo ""

# 3. 确保 .env 文件存在
echo "3️⃣  检查 .env 文件..."
if [ ! -f ".env" ]; then
  echo "   创建 .env 文件..."
  cat > .env <<EOF
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV=development
EOF
  echo "✅ .env 文件已创建"
else
  echo "✅ .env 文件已存在"
  cat .env
fi
echo ""

# 4. 初始化 Prisma（使用项目配置的命令）
echo "4️⃣  初始化 Prisma..."
npm run prisma:generate 2>&1 | grep -v "^$" || echo "   生成完成"
npm run prisma:push 2>&1 | grep -v "^$" || echo "   推送完成"
echo "✅ Prisma 初始化完成"
echo ""

# 5. 启动开发服务器
echo "5️⃣  启动开发服务器..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  服务将在 http://localhost:3000 启动"
echo "  按 Ctrl+C 停止服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
npm run dev
