#!/bin/bash
# 最终启动脚本（SQLite，无 Docker）

echo "🚀 启动 visual (SQLite + 18780)"
echo ""

# 停止旧进程
pkill -f "node server.mjs" 2>/dev/null || true
lsof -ti:18780 | xargs kill -9 2>/dev/null || true

# 清理
rm -rf .next node_modules/.cache dev.db dev.db-journal

# 加载环境变量
export $(cat .env | xargs)

# 初始化并启动
npm run prisma:generate && \
npm run prisma:push --accept-data-loss && \
echo "" && \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" && \
echo "  http://localhost:18780" && \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" && \
echo "" && \
npm run dev
