# 最终解决方案：使用 Docker MariaDB

## 问题原因

Prisma Schema 包含大量 MySQL/MariaDB 特定的类型约束（`@db.VarChar` 等），SQLite 不支持这些约束，导致：
- ✅ 84 个验证错误
- ❌ 500 Internal Server Error

## ✅ 解决方案

**使用 Docker 运行 MariaDB**（只运行数据库，不运行 visual 服务）

---

## 🚀 重新启动（新方案）

### 步骤 1：停止当前服务

在运行 `./start.sh` 的终端按 `Ctrl+C` 停止服务。

### 步骤 2：使用新脚本启动

```bash
cd /Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec-visual
./start-with-db.sh
```

这个脚本会：
1. 启动 Docker MariaDB 容器（自动创建数据库）
2. 等待数据库就绪
3. 停止旧进程
4. 清理缓存
5. 初始化 Prisma（不会再有验证错误）
6. 启动 visual 服务在 18780 端口

---

## 📋 预期输出

```
🚀 启动 br-ai-spec-visual (端口 18780 + Docker MariaDB)

1️⃣  启动 MariaDB 容器...
✅ MariaDB 已启动

2️⃣  等待数据库就绪...
✅ 数据库就绪

3️⃣  停止旧进程...
✅ 旧进程已停止

4️⃣  清理缓存...
✅ 缓存已清理

5️⃣  检查配置...
   当前配置：
DATABASE_URL="mysql://visual_user:visual_password_123@localhost:3306/br_ai_spec_visual"
NEXTAUTH_URL="http://localhost:18780"
NODE_ENV=development
PORT=18780
✅ 配置文件正常

6️⃣  初始化数据库...
✅ 数据库初始化完成

7️⃣  启动服务...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🌐 服务地址: http://localhost:18780
  🗄️  数据库: MariaDB (localhost:3306)
  🔍 健康检查: curl http://localhost:18780/api/health
  ⏹  停止: Ctrl+C (数据库会继续运行)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

> Server listening at http://0.0.0.0:18780
```

---

## ✅ 验证服务

### 1. 健康检查

```bash
curl http://localhost:18780/api/health
# 预期：{"ok":true}
```

### 2. 浏览器访问

```
http://localhost:18780
```

**不应该再有 500 错误！**

---

## 🗄️  数据库管理

### 查看数据库状态

```bash
docker-compose -f docker-compose-db-only.yml ps
```

### 连接数据库

```bash
docker-compose -f docker-compose-db-only.yml exec db mariadb -uvisual_user -pvisual_password_123 br_ai_spec_visual
```

### 停止数据库

```bash
docker-compose -f docker-compose-db-only.yml down
```

### 停止并删除数据

```bash
docker-compose -f docker-compose-db-only.yml down -v
```

---

## 📝 配置变更

`.env` 已更新为：

```env
DATABASE_URL="mysql://visual_user:visual_password_123@localhost:3306/br_ai_spec_visual"
NEXTAUTH_URL="http://localhost:18780"
PORT=18780
```

---

## 🎯 优势

✅ **无需修改 Schema** - 保持原有的 MySQL 类型约束  
✅ **生产环境一致** - 使用相同的数据库引擎  
✅ **数据持久化** - Docker volume 保存数据  
✅ **易于管理** - 标准的 docker-compose 命令  

---

## 📖 下一步

服务启动成功后，继续按照 `docs/five/本地验证指南.md` 进行验证：

1. 更新测试项目
2. 执行 Collector 采集
3. 测试实时推送
4. 验证控制台显示

---

**更新时间**：2026-04-21  
**维护者**：lizhenwei
