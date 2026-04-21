# 快速启动 br-ai-spec-visual

## ✅ 已修复的问题

1. **端口改为 18780** - 避免与其他服务冲突
2. **Prisma 配置修复** - 手动加载 .env 文件
3. **自动停止旧进程** - 释放端口占用

---

## 🚀 启动服务

### 方式 1：使用启动脚本（推荐）

```bash
cd /Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec-visual
./start.sh
```

### 方式 2：手动执行

```bash
cd /Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec-visual

# 停止旧进程
pkill -f "node server.mjs" || true
lsof -ti:18780 | xargs kill -9 || true

# 清理缓存
rm -rf .next node_modules/.cache

# 加载环境变量
export $(cat .env | xargs)

# 初始化数据库
npm run prisma:generate
npm run prisma:push

# 启动服务
npm run dev
```

---

## 📋 验证启动成功

### 预期输出

```
▲ Next.js 16.2.4
- Local:        http://localhost:18780

✓ Ready in 2-3s
```

### 健康检查

```bash
curl http://localhost:18780/api/health
# 预期：{"ok":true}
```

### 浏览器访问

```
http://localhost:18780
```

---

## ⚙️  当前配置

- **端口**：18780
- **数据库**：SQLite (file:./dev.db)
- **环境**：development

配置文件：`.env`

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:18780"
NODE_ENV=development
PORT=18780
```

---

## 🔧 故障排查

### 问题 1：仍然报端口占用

```bash
# 强制停止所有相关进程
pkill -9 -f "node server.mjs"
lsof -ti:18780 | xargs kill -9
```

### 问题 2：Prisma 报错 "Cannot resolve environment variable"

**解决**：已修复！`prisma.config.ts` 现在会手动加载 `.env` 文件

### 问题 3：数据库初始化失败

```bash
# 删除旧数据库
rm -f dev.db dev.db-journal

# 重新初始化
npm run prisma:push
```

---

## 📖 下一步

启动成功后，按照以下文档继续：

1. **本地验证** - `/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec/docs/five/本地验证指南.md`
2. **配置测试项目** - 更新 visual-config.json 中的端口为 18780

---

**更新时间**：2026-04-21  
**维护者**：lizhenwei
