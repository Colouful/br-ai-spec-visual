#!/bin/bash
# 修复并启动 visual 服务

set -e

echo "🔧 修复 br-ai-spec-visual 启动问题"
echo ""

# 1. 清理 Next.js 和 Turbopack 缓存
echo "1️⃣  清理缓存..."
rm -rf .next
rm -rf node_modules/.cache
echo "✅ 缓存已清理"
echo ""

# 2. 确保 .env 文件存在
echo "2️⃣  检查 .env 文件..."
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
fi
echo ""

# 3. 显示环境变量
echo "3️⃣  环境变量："
cat .env
echo ""

# 4. 使用 dotenv 加载环境变量并初始化 Prisma
echo "4️⃣  初始化 Prisma..."

# 方法 1：直接使用标准 Prisma 命令（不使用 config）
echo "   尝试使用标准 Prisma 命令..."

# 检查是否有 schema.prisma
if [ -f "prisma/schema.prisma" ]; then
  # 使用标准的 prisma 命令，它会自动加载 .env
  npx prisma generate --schema=prisma/schema.prisma
  npx prisma db push --schema=prisma/schema.prisma --skip-generate
  echo "✅ Prisma 初始化完成（使用标准命令）"
else
  echo "❌ prisma/schema.prisma 不存在"
  exit 1
fi
echo ""

# 5. 启动开发服务器
echo "5️⃣  启动开发服务器..."
echo ""
npm run dev
