# 快速启动指南

## 问题修复

如果遇到以下错误：
- `Cannot resolve environment variable: DATABASE_URL`
- `TurbopackInternalError: range end index out of range`

**原因**：
1. Prisma schema 缺少 `url` 配置
2. Turbopack 缓存损坏

**已修复**：
- ✅ 已更新 `prisma/schema.prisma`，添加 `url = env("DATABASE_URL")`
- ✅ 已将数据库从 `mysql` 改为 `sqlite`（本地开发）

---

## 快速启动（方式 1：使用脚本）

```bash
cd /Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec-visual
./fix-and-start.sh
```

这个脚本会：
1. 清理 `.next` 和缓存
2. 检查 `.env` 文件
3. 初始化 Prisma
4. 启动开发服务器

---

## 快速启动（方式 2：手动执行）

```bash
cd /Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec-visual

# 1. 清理缓存
rm -rf .next node_modules/.cache

# 2. 确保 .env 存在（如果不存在则创建）
cat > .env <<'EOF'
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-here-change-me"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV=development
EOF

# 3. 初始化数据库
npx prisma generate --schema=prisma/schema.prisma
npx prisma db push --schema=prisma/schema.prisma --skip-generate

# 4. 启动服务
npm run dev
```

---

## 验证启动成功

**预期输出**：

```
▲ Next.js 16.2.4
- Local:        http://localhost:3000

✓ Ready in 2.3s
```

**验证健康检查**：

```bash
curl http://localhost:3000/api/health
# 预期：{"ok":true}
```

**或在浏览器打开**：

```
http://localhost:3000
```

---

## 常见问题

### Q1：仍然报错 "Cannot resolve environment variable"

**解决**：确保 `.env` 文件在项目根目录

```bash
# 检查文件位置
ls -la .env

# 检查内容
cat .env

# 应该包含：
# DATABASE_URL="file:./dev.db"
```

### Q2：仍然报错 "TurbopackInternalError"

**解决**：彻底清理缓存

```bash
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules/.pnpm/.cache

# 如果问题持续，重新安装依赖
rm -rf node_modules
npm install
```

### Q3：数据库文件权限问题

**解决**：确保有写权限

```bash
# 删除旧的数据库文件
rm -f dev.db dev.db-journal

# 重新初始化
npx prisma db push --schema=prisma/schema.prisma
```

---

## 下一步

启动成功后，继续按照 `docs/five/本地验证指南.md` 进行完整验证。

---

**更新时间**：2026-04-21  
**维护者**：lizhenwei
