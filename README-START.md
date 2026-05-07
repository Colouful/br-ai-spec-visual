# 快速启动 br-ai-spec-visual

## ✅ 已修复的问题

1. **端口改为 18780** - 避免与其他服务冲突
2. **Prisma 配置修复** - 手动加载 .env 文件
3. **自动停止旧进程** - 释放端口占用

---

## 🚀 启动服务

项目使用 **MySQL 协议**（可对接 **MariaDB** / MySQL），`DATABASE_URL` 见仓库根目录 **`.env.example`**。

### 全量启动（推荐首次或需自动起 Docker DB）

一键：拉起 **Docker MariaDB**（`13306`）、等待就绪、**Prisma generate/push**、再启动 `node server.mjs`（与 `pnpm dev` 最终进程相同）。

```bash
cd /path/to/br-ai-spec-visual
pnpm run dev:stack
# 等同于: ./start-with-db.sh
```

需已安装 **Docker** / **docker-compose**，并配置好根目录 **`.env`**（可从 `.env.example` 复制）。

### 仅启动应用（`pnpm dev`）

在 **数据库已运行** 且已执行过 **`pnpm prisma:generate` / `pnpm prisma:push`**（或 schema 未变仅 generate）时使用：

```bash
pnpm dev
# 与 pnpm run dev:server 等价，实际为 node server.mjs
```

**前置条件**：`DATABASE_URL` 可达、`.env` 中 `PORT=18780`（或与你的约定一致）。

### 方式：手动分步（与脚本逻辑等价，无自动 Docker）

```bash
cd /path/to/br-ai-spec-visual

docker compose -f docker-compose-db-only.yml up -d
# 等待库就绪后：

pnpm run prisma:generate
pnpm run prisma:push
pnpm dev
```

---

## 命令对照

| 场景 | 命令 |
| --- | --- |
| 全量（DB + Prisma + 服务） | `pnpm dev:stack` 或 `./start-with-db.sh` |
| 仅起 Node（Next + WebSocket） | `pnpm dev` / `pnpm run dev:server` |

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

- **端口**：18780（可在 `.env` 中改 `PORT`；未设置时默认见 `server.mjs`）
- **数据库**：MariaDB（`docker-compose-db-only.yml` 映射宿主机 **13306**）或自管 MySQL/MariaDB
- **环境**：development

配置文件：`.env`（模板：`.env.example`）

```env
DATABASE_URL="mysql://USER:PASSWORD@127.0.0.1:13306/br_ai_spec_visual"
PORT=18780
# 其余会话等变量见 .env.example 与 README.md
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
pnpm run prisma:push
```

---

## 📖 下一步

启动成功后，按照以下文档继续：

1. **本地验证** - `/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec/docs/five/本地验证指南.md`
2. **配置测试项目** - 更新 visual-config.json 中的端口为 18780

---

**更新时间**：2026-04-21  
**维护者**：lizhenwei
