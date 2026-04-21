# BR AI Spec Visual 部署指南

## 📋 部署概览

本指南详细说明如何在 Docker 环境中部署 Next.js 项目（BR AI Spec Visual）和 MariaDB 数据库。

### 架构图

```
┌─────────────────────────────────────────────────┐
│  Internet                                       │
│     ↓                                           │
│  ┌─────────────┐                                │
│  │   Nginx     │  (Docker, SSL, 80/443)         │
│  │  (反向代理)  │                                │
│  └──────┬──────┘                                │
│         ↓                                       │
│  ┌─────────────┐       ┌─────────────┐         │
│  │  Next.js    │ ←───→ │  MariaDB    │         │
│  │   (3000)    │       │   (3306)    │         │
│  └─────────────┘       └─────────────┘         │
└─────────────────────────────────────────────────┘
```

---

## 📁 项目信息

| 项目 | 路径 |
|------|------|
| **项目根目录** | `/root/workspac/frontendworkspace/br-ai-spec-visual` |
| **Docker Compose** | `docker-compose.prod.yml` |
| **Dockerfile** | `Dockerfile` |
| **环境变量** | `.env.production` |
| **日志目录** | `logs/` |
| **数据库备份** | `db-backup/` |

---

## 🚀 快速部署

### 1. 一键部署脚本

```bash
cd /root/workspac/frontendworkspace/br-ai-spec-visual
./deploy.sh
```

### 2. 手动部署步骤

#### 步骤 1: 检查环境变量

```bash
cd /root/workspac/frontendworkspace/br-ai-spec-visual
cat .env.production
```

**重要环境变量：**
- `DB_PASSWORD` - 数据库密码
- `DB_NAME` - 数据库名称
- `NEXTAUTH_SECRET` - NextAuth 密钥
- `NEXTAUTH_URL` - 应用访问地址

#### 步骤 2: 启动 Docker 容器

```bash
# 加载环境变量
export $(grep -v '^#' .env.production | xargs)

# 启动服务
docker-compose -f docker-compose.prod.yml up -d --build
```

#### 步骤 3: 初始化数据库

```bash
# 生成 Prisma Client
docker exec br-ai-spec-visual pnpm prisma:generate

# 同步数据库 Schema
docker exec br-ai-spec-visual npx prisma db push --config prisma/prisma.config.ts --accept-data-loss

# 插入种子数据
docker exec br-ai-spec-visual pnpm prisma:seed
```

#### 步骤 4: 验证服务

```bash
# 检查容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看应用日志
docker logs br-ai-spec-visual -f

# 测试健康检查
curl -k https://82.156.14.216/api/health
```

---

## 🌐 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| **Next.js 应用** | `https://visual.panghu.work` | 主应用（需要 DNS 解析） |
| **静态文档** | `https://82.156.14.216/four/` | 文档站点 |
| **直接访问** | `http://82.156.14.216:3000` | 本地测试（未开放外网） |

**注意：** 域名 `visual.panghu.work` 需要 DNS 解析到公网 IP `82.156.14.216`

---

## 🛠️ 常用命令

### 容器管理

```bash
# 查看状态
docker-compose -f docker-compose.prod.yml ps

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 停止服务
docker-compose -f docker-compose.prod.yml down

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker logs br-ai-spec-visual -f
docker logs br-ai-spec-visual-db -f
```

### 数据库操作

```bash
# 进入数据库
docker exec -it br-ai-spec-visual-db mysql -u root -p

# 备份数据库
./backup-db.sh

# 恢复数据库（从备份文件）
zcat db-backup/backup_YYYYMMDD_HHMMSS.sql.gz | docker exec -i br-ai-spec-visual-db mysql -u root -p$DB_PASSWORD $DB_NAME
```

### 应用操作

```bash
# 进入容器
docker exec -it br-ai-spec-visual sh

# 重新生成 Prisma Client
docker exec br-ai-spec-visual pnpm prisma:generate

# 查看应用日志
docker exec br-ai-spec-visual tail -f logs/*.log
```

### Nginx 操作

```bash
# 重新加载配置
docker exec nginx nginx -s reload

# 测试配置
docker exec nginx nginx -t

# 查看访问日志
docker exec nginx tail -f /var/log/nginx/access.log

# 查看错误日志
docker exec nginx tail -f /var/log/nginx/error.log
```

---

## 🔧 故障排查

### 1. 容器无法启动

```bash
# 查看详细日志
docker-compose -f docker-compose.prod.yml logs

# 检查端口占用
netstat -tlnp | grep :3000
netstat -tlnp | grep :3306
```

### 2. 数据库连接失败

```bash
# 检查数据库容器
docker logs br-ai-spec-visual-db

# 测试数据库连接
docker exec br-ai-spec-visual-db mysql -u root -p$DB_PASSWORD -e "SELECT 1"

# 检查 DATABASE_URL
docker exec br-ai-spec-visual env | grep DATABASE_URL
```

### 3. Nginx 502 错误

```bash
# 检查 Next.js 容器是否运行
docker ps -f name=br-ai-spec-visual

# 测试直接访问 Next.js
curl http://127.0.0.1:3000

# 检查 Nginx 配置
docker exec nginx nginx -t
```

### 4. 应用健康检查失败

```bash
# 查看应用日志
docker logs br-ai-spec-visual --tail 100

# 手动测试健康端点
docker exec br-ai-spec-visual node -e "require('http').get('http://localhost:3000/api/health', r => console.log('Status:', r.statusCode))"
```

---

## 📊 监控与维护

### 资源使用

```bash
# 查看容器资源使用
docker stats br-ai-spec-visual br-ai-spec-visual-db

# 查看磁盘使用
docker system df
```

### 日志清理

```bash
# 清理旧日志
docker exec br-ai-spec-visual find logs -name "*.log" -mtime +7 -delete

# 清理 Docker 系统
docker system prune -f
```

### 数据库维护

```bash
# 定期备份（建议添加到 crontab）
0 2 * * * cd /root/workspac/frontendworkspace/br-ai-spec-visual && ./backup-db.sh

# 检查数据库大小
docker exec br-ai-spec-visual-db mysql -u root -p$DB_PASSWORD -e "SELECT table_schema, SUM(data_length + index_length) / 1024 / 1024 AS 'Size (MB)' FROM information_schema.tables WHERE table_schema = '$DB_NAME' GROUP BY table_schema;"
```

---

## 🔐 安全建议

### 1. 修改默认密码

编辑 `.env.production`：

```bash
# 生成强密码
openssl rand -base64 32

# 修改以下变量
DB_PASSWORD=你的强密码
NEXTAUTH_SECRET=生成的随机密钥
BR_AI_SPEC_VISUAL_SESSION_SECRET=生成的随机密钥
```

### 2. 防火墙配置

```bash
# 只开放必要端口
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

### 3. SSL 证书更新

证书过期时更新：

```bash
# 替换证书文件
cp /path/to/new/cert.pem /root/panghu.work_nginx/panghu.work_bundle.pem
cp /path/to/new/key.pem /root/panghu.work_nginx/panghu.work.key

# 重新加载 Nginx
docker exec nginx nginx -s reload
```

---

## 📝 更新部署

### 代码更新

```bash
# 1. 拉取最新代码
cd /root/workspac/frontendworkspace/br-ai-spec-visual
git pull

# 2. 重新构建并部署
docker-compose -f docker-compose.prod.yml up -d --build

# 3. 查看部署状态
docker-compose -f docker-compose.prod.yml logs -f
```

### 配置更新

```bash
# 1. 修改配置文件
vim .env.production
vim docker-compose.prod.yml

# 2. 重启服务
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# 3. 验证
docker-compose -f docker-compose.prod.yml ps
```

---

## 📞 技术支持

### 相关文档

- [项目 README](README.md)
- [Collector 使用指南](docs/Collector 使用指南.md)
- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [Docker 文档](https://docs.docker.com/)

### 日志位置

- **应用日志**: `logs/` 目录
- **Nginx 日志**: `docker logs nginx`
- **数据库日志**: `docker logs br-ai-spec-visual-db`

### 备份策略

- **数据库**: 每日自动备份（保留 7 天）
- **配置文件**: 手动备份 `.env.production` 和 `docker-compose.prod.yml`
- **代码**: Git 版本控制

---

**部署时间**: 2026-04-21  
**部署版本**: v1.0.0  
**最后更新**: 2026-04-21
