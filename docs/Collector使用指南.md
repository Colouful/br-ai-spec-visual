# br-ai-spec-visual Collector 使用指南

> Collector CLI 是用于批量扫描 ai-spec-auto 项目并上报数据到 visual 服务的命令行工具。

## 功能概述

Collector CLI 提供以下核心功能：

1. **批量扫描项目目录**
   - 扫描 `.ai-spec/` 目录（当前运行态、历史 run、仓库地图）
   - 扫描 `.agents/registry/` 目录（角色和技能注册表）
   - 扫描 `.omx/logs/` 目录（OMX 日志）
   - 扫描 `openspec/` 目录（规范文件）

2. **解析运行态数据**
   - 解析 `current-run.json` 生成运行态快照
   - 解析历史 run 记录（`.ai-spec/history/run_*/runtime-state.json`）
   - 解析仓库地图（`.ai-spec/repo-map.json`）

3. **数据上报**
   - HTTP 批量上报到 visual 服务
   - WebSocket 实时推送（可选，需 connectToken）
   - 基于 checksum 的去重机制

4. **灵活的运行模式**
   - **简化模式**：只需 `--workspace-id` 和 `--server`，无需认证
   - **完整模式**：提供 `--connect-token` 启用 WebSocket 推送

## 安装

### 前置条件

- Node.js 18 或更高版本
- npm 或 pnpm

### 安装方式

#### 方式 1：全局安装（推荐）

```bash
cd /path/to/br-ai-spec-visual
npm install -g .
```

安装后可在任意位置执行：

```bash
br-ai-spec-visual-collector --help
```

#### 方式 2：npx 直接运行（无需安装）

```bash
npx /path/to/br-ai-spec-visual/src/collector/cli.ts --help
```

#### 方式 3：项目内执行

```bash
cd /path/to/br-ai-spec-visual
npm run collector -- --help
```

## 基础用法

### 最简示例（简化模式）

```bash
# 扫描当前目录的项目并上报到 visual 服务
br-ai-spec-visual-collector \
  --workspace-id my-project \
  --server http://localhost:3000
```

**说明**：
- `--workspace-id`：工作区唯一标识（必填）
- `--server`：visual 服务地址（必填）
- 默认扫描当前目录（`process.cwd()`）

### 指定项目路径

```bash
# 扫描指定路径的项目
br-ai-spec-visual-collector \
  --workspace-id my-frontend-project \
  --project /path/to/your/project \
  --server http://visual.internal:3000
```

### 完整模式（包含 WebSocket 推送）

```bash
# 提供 connect-token 启用 WebSocket 推送
br-ai-spec-visual-collector \
  --workspace-id my-project \
  --project . \
  --server http://localhost:3000 \
  --connect-token your_signed_token_here \
  --agent-id collector-my-machine
```

### JSON 输出模式

```bash
# 输出 JSON 格式结果（便于脚本集成）
br-ai-spec-visual-collector \
  --workspace-id my-project \
  --server http://localhost:3000 \
  --json
```

**输出示例**：

```json
{
  "workspace_id": "my-project",
  "agent_id": "collector-hostname",
  "run_id": "run_abc123xyz456",
  "baseline": {
    "project_root": "/path/to/project",
    "scanned_at": "2026-04-21T10:00:00.000Z",
    "registry": {
      "root": "/path/to/project/.agents/registry",
      "present": true,
      "file_count": 8,
      "files": [...]
    },
    "ai_spec": {
      "root": "/path/to/project/.ai-spec",
      "present": true,
      "file_count": 15,
      "files": [...]
    },
    "openspec": {
      "root": "/path/to/project/openspec",
      "present": true,
      "file_count": 42,
      "files": [...]
    }
  },
  "raw_event_count": 120,
  "ingest": {
    "ok": true,
    "inserted": 118,
    "skipped": 2,
    "total": 120
  }
}
```

## 命令行参数详解

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `--workspace-id <id>` | string | ✅ 是 | - | 工作区唯一标识 |
| `--project <path>` | string | ❌ 否 | `process.cwd()` | 项目根目录路径 |
| `--server <url>` | string | ❌ 否 | - | visual 服务地址 |
| `--agent-id <id>` | string | ❌ 否 | `collector-{hostname}` | Collector agent 唯一标识 |
| `--connect-token <token>` | string | ❌ 否 | - | 已签名的连接令牌（启用 WebSocket） |
| `--capability <cap...>` | string[] | ❌ 否 | `["baseline:scan", "publish:events"]` | Collector 能力列表 |
| `--json` | boolean | ❌ 否 | `false` | 输出 JSON 格式 |

## 扫描范围

Collector 会递归扫描以下目录：

### 1. `.agents/registry/` - 角色和技能注册表

扫描的文件：
- `.agents/registry/roles.json`
- `.agents/registry/skills.json`
- `.agents/registry/flows.json`
- 等等...

生成的事件类型：
- `role.registered`
- `skill.registered`
- `flow.registered`

### 2. `.ai-spec/` - 运行态和历史记录

扫描的文件：
- `.ai-spec/current-run.json` - 当前运行态
- `.ai-spec/history/run_*/runtime-state.json` - 历史 run 记录
- `.ai-spec/repo-map.json` - 仓库地图

生成的事件类型：
- `runtime-state.snapshot` - 运行态快照
- `repo-map.snapshot` - 仓库地图快照

### 3. `.omx/logs/` - OMX 日志（可选）

扫描的文件：
- `.omx/logs/omx-*.jsonl` - OMX 操作日志

生成的事件类型：
- `omx.log.entry` - OMX 日志条目

### 4. `openspec/` - 规范文件（可选）

扫描的文件：
- `openspec/specs/**/*.md` - 规范文档
- `openspec/changes/**/*.md` - 变更记录

统计信息：
- 文件数量、总大小、最后修改时间

## 数据去重机制

Collector 使用 **checksum + dedupeKey** 机制避免重复上报：

```typescript
const dedupeKey = hashText([
  'run-state-json',
  sourcePath,
  eventKey,
  checksum
].join('|'));
```

**去重流程**：

1. Collector 为每个事件生成 `checksum`（内容哈希）和 `dedupeKey`
2. Visual 服务端检查 `dedupeKey` 是否已存在
3. 已存在：跳过（`skipped++`）
4. 不存在：插入数据库并触发投影（`inserted++`）

**效果**：
- 多次执行 Collector，只有新增或变更的数据会被上报
- 历史数据不会重复采集

## 使用场景

### 场景 1：首次接入 visual

**目标**：批量采集项目历史数据

**步骤**：

```bash
# 1. 在项目根目录执行 Collector
cd /path/to/your/project

# 2. 批量采集
br-ai-spec-visual-collector \
  --workspace-id your-project-name \
  --server http://visual-server:3000

# 3. 验证上报结果
# 输出应显示：inserted: N, skipped: 0
```

### 场景 2：定期增量同步

**目标**：定时采集新增的 run 记录

**方案**：添加到 Cron 定时任务

```bash
# 每 6 小时执行一次
0 */6 * * * cd /path/to/project && br-ai-spec-visual-collector --workspace-id project-name --server http://visual:3000 >> /var/log/collector.log 2>&1
```

### 场景 3：CI/CD 集成

**目标**：在 CI 流水线中自动上报运行态

**示例**（GitHub Actions）：

```yaml
name: Sync to Visual

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 */12 * * *'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Collector
        run: |
          npx br-ai-spec-visual-collector \
            --workspace-id ${{ github.repository }} \
            --project . \
            --server ${{ secrets.VISUAL_SERVER_URL }} \
            --json
```

### 场景 4：多项目批量采集

**目标**：一次性采集多个项目

**脚本示例**：

```bash
#!/bin/bash
VISUAL_SERVER="http://visual.internal:3000"

PROJECTS=(
  "/path/to/project-a:project-a"
  "/path/to/project-b:project-b"
  "/path/to/project-c:project-c"
)

for item in "${PROJECTS[@]}"; do
  IFS=':' read -r path workspace_id <<< "$item"
  echo "Collecting $workspace_id from $path..."
  
  br-ai-spec-visual-collector \
    --workspace-id "$workspace_id" \
    --project "$path" \
    --server "$VISUAL_SERVER" \
    --json
done
```

## 故障排查

### 问题 1：上报失败 - 连接被拒绝

**症状**：

```
raw ingest failed: ECONNREFUSED
```

**排查步骤**：

```bash
# 1. 检查 visual 服务是否运行
curl http://visual-server:3000/api/health

# 2. 检查网络连通性
ping visual-server

# 3. 检查防火墙规则
sudo firewall-cmd --list-ports
```

**解决方案**：
- 启动 visual 服务：`docker-compose up -d`
- 开放端口：`sudo firewall-cmd --add-port=3000/tcp --permanent`

### 问题 2：上报失败 - 401 Unauthorized

**症状**：

```
raw ingest failed: 401 Unauthorized
```

**原因**：
- `workspace-id` 不匹配
- `connect-token` 过期或无效

**解决方案**：

```bash
# 简化模式：不使用 connect-token
br-ai-spec-visual-collector \
  --workspace-id correct-workspace-id \
  --server http://visual:3000

# 完整模式：使用有效的 connect-token
br-ai-spec-visual-collector \
  --workspace-id correct-workspace-id \
  --server http://visual:3000 \
  --connect-token your_valid_token
```

### 问题 3：扫描失败 - 目录不存在

**症状**：

```
raw_event_count: 0
baseline.ai_spec.present: false
```

**原因**：
- 项目未初始化 ai-spec-auto
- `--project` 路径错误

**解决方案**：

```bash
# 1. 检查项目是否有 .ai-spec 目录
ls -la /path/to/project/.ai-spec

# 2. 确认 --project 路径正确
br-ai-spec-visual-collector \
  --workspace-id project \
  --project /correct/path/to/project \
  --server http://visual:3000
```

### 问题 4：解析失败 - JSON 格式错误

**症状**：

```
[collector] failed to parse current-run file: ...
```

**原因**：
- JSON 文件格式错误
- 文件被意外修改

**解决方案**：

```bash
# 1. 验证 JSON 文件格式
cat .ai-spec/current-run.json | jq .

# 2. 如果文件损坏，从备份恢复或重新执行 /spec-start
```

## 性能优化

### 大型项目优化建议

对于包含大量历史 run 的项目（100+ run），可以考虑以下优化：

#### 1. 限制扫描深度

修改 `raw-events.ts`，只扫描最近 N 个 run：

```typescript
// 只扫描最近 30 天的 run
const historyRunFiles = await glob(".ai-spec/history/run_*/runtime-state.json", {
  cwd: input.projectRoot,
  absolute: true,
  nodir: true,
  // 可以添加时间过滤逻辑
});
```

#### 2. 分批上报

对于 1000+ 个事件，可以分批上报：

```bash
# 使用脚本分批执行
for i in {1..10}; do
  br-ai-spec-visual-collector \
    --workspace-id project \
    --server http://visual:3000 \
    --json
  sleep 5
done
```

#### 3. 增量采集

配置定时任务，只采集新增数据：

```bash
# Cron 任务：每小时执行一次
0 * * * * cd /path/to/project && br-ai-spec-visual-collector --workspace-id project --server http://visual:3000
```

## 输出格式

### 标准输出（--pretty）

```
workspace_id=my-project
agent_id=collector-hostname
run_id=run_abc123xyz456
registry_files=8
log_files=3
ai_spec_files=15
openspec_files=42
raw_events=120
```

### JSON 输出（--json）

```json
{
  "workspace_id": "my-project",
  "agent_id": "collector-hostname",
  "run_id": "run_abc123xyz456",
  "baseline": {
    "project_root": "/path/to/project",
    "scanned_at": "2026-04-21T10:00:00.000Z",
    "registry": { "present": true, "file_count": 8, "files": [...] },
    "logs": { "present": true, "file_count": 3, "files": [...] },
    "ai_spec": { "present": true, "file_count": 15, "files": [...] },
    "openspec": { "present": true, "file_count": 42, "files": [...] }
  },
  "raw_event_count": 120,
  "ingest": {
    "ok": true,
    "inserted": 118,
    "skipped": 2,
    "total": 120
  }
}
```

## 与 Hook 机制的配合使用

Collector 和 Hook 机制是互补的两种数据采集方式：

| 维度 | Collector CLI | Visual Hooks |
| --- | --- | --- |
| **数据来源** | 批量扫描文件系统 | 实时推送运行态 |
| **采集时机** | 手动执行或定时任务 | 协议推进时自动触发 |
| **适用场景** | 历史数据、增量同步 | 实时监控、状态变更 |
| **数据覆盖** | 完整（注册表、历史 run、日志） | 增量（新 run、状态变更） |
| **性能影响** | 离线扫描，不影响运行时 | 轻量推送，<100ms |

**推荐使用方式**：

1. **首次接入**：执行 Collector 批量采集历史数据
2. **日常运行**：依赖 Hook 实时推送新数据
3. **定期校验**：每天执行一次 Collector 增量同步（Cron）

**示例配置**：

```bash
# 1. 首次接入：批量采集
br-ai-spec-visual-collector \
  --workspace-id project \
  --server http://visual:3000

# 2. 配置 Hook（在目标项目中）
cat > .ai-spec/visual-config.json <<EOF
{
  "enabled": true,
  "visual_url": "http://visual:3000",
  "workspace_id": "project"
}
EOF

# 3. 配置定时任务：每天凌晨 2 点增量同步
0 2 * * * cd /path/to/project && br-ai-spec-visual-collector --workspace-id project --server http://visual:3000
```

## 相关文档

- [需求说明-visual补充.md](../../../br-ai-spec/docs/five/需求说明-visual补充.md) - Visual 完整需求
- [快速部署指南.md](./快速部署指南.md) - Visual 服务部署
- [集成实施报告.md](../../../br-ai-spec/集成实施报告.md) - 集成实施总结

## 常见问题

### Q1：Collector 需要安装 visual 项目的依赖吗？

**A**：是的。Collector 是 visual 项目的一部分，需要在 visual 项目中执行 `npm install` 后才能使用。

```bash
cd /path/to/br-ai-spec-visual
npm install
npm run collector -- --help
```

### Q2：可以在没有 visual 服务的情况下运行 Collector 吗？

**A**：可以。不提供 `--server` 参数时，Collector 只扫描并输出结果，不上报：

```bash
br-ai-spec-visual-collector \
  --workspace-id project \
  --json
```

### Q3：Collector 会修改项目文件吗？

**A**：不会。Collector 是**只读**的，只扫描和解析文件，不会修改任何文件。

### Q4：Collector 支持 Windows 吗？

**A**：支持。Collector 使用 Node.js，跨平台兼容。但路径分隔符请使用 `/` 或 `\\`：

```bash
# Windows PowerShell
br-ai-spec-visual-collector `
  --workspace-id project `
  --project C:\path\to\project `
  --server http://visual:3000
```

### Q5：如何验证 Collector 是否成功上报？

**A**：查看 JSON 输出中的 `ingest` 字段：

```json
{
  "ingest": {
    "ok": true,
    "inserted": 118,
    "skipped": 2,
    "total": 120
  }
}
```

- `ok: true` 表示上报成功
- `inserted` 表示新插入的事件数量
- `skipped` 表示去重跳过的事件数量

同时可以在 visual 控制台查看工作区是否出现新数据。

---

**版本**：v1.0  
**最后更新**：2026-04-21  
**维护者**：lizhenwei
