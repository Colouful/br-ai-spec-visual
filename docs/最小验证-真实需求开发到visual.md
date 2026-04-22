# 最小验证：真实项目安装 → 真实需求开发 → visual 看真数据

> **目标**：用 `test_副本14` 走完整真实开发流（不是 mock），在 visual 上能看到该项目的需求/产物。
> **预计耗时**：15-25 分钟（含 IDE 内人工 `/spec-start` 一轮）。
> **修复状态**：本手册依赖的 3 个 P0 bug（push-client 不带 root_path / config-loader 与 init 产物字段不互通 / update 清空 bridge）**已修复并真机回归**，详见 [端到端安装测试-init-update-sync.md](./端到端安装测试-init-update-sync.md) 文末「实测发现」。
> **前置约定**：
> - visual 服务通过 `start-with-db.sh` 启动，监听 **18780 端口**，数据库用 Docker 里的 MariaDB（`br-ai-spec-visual-db-1` / 13306 / `br_ai_spec_visual`）
> - 本手册下面所有 `VISUAL_URL` 统一写成 `http://localhost:18780`；给 CLI 传 URL 时请显式 `export AI_SPEC_VISUAL_URL="http://localhost:18780"`，让 CLI 遥测与 visual-bridge 指向同一个实例
> - 双链路同时验证：(a) 实时 hook push（修复 #1+#3+#4 后能跑通），(b) collector 回灌兜底

---

## 0. 前置确认

正文所有命令都用了**真实绝对路径**，可以直接复制粘贴，不依赖任何 `export` 变量。执行前先确认三件事：

```bash
# 如果 visual 还没起，先起（推荐）：
#   cd /Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec-visual && ./start-with-db.sh
curl -s "http://localhost:18780/api/health" | head -c 80
docker ps --format '{{.Names}}' | grep br-ai-spec-visual-db-1
[ -d "/Users/lizhenwei/workspace/test/test-ai-spec/prd-to-delivery-local-first-060/test_副本14" ] \
  && [ ! -d "/Users/lizhenwei/workspace/test/test-ai-spec/prd-to-delivery-local-first-060/test_副本14/.ai-spec" ] \
  && echo "✅ 项目干净" || echo "⚠️ 项目已被动过，先清理或换 13"
```

> 约定的固定取值（在正文中已内联，列在此仅供查阅）：
>
> | 名称 | 值 |
> |---|---|
> | auto 源码路径 | `/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec` |
> | visual 源码路径 | `/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec-visual` |
> | visual URL | `http://localhost:18780` |
> | visual 启动脚本 | `./start-with-db.sh`（自动拉 Docker MariaDB + prisma push + 监听 18780） |
> | DB 容器名 | `br-ai-spec-visual-db-1`（映射到宿主 13306） |
> | DB schema | `br_ai_spec_visual` |
> | 被测项目 | `/Users/lizhenwei/workspace/test/test-ai-spec/prd-to-delivery-local-first-060/test_副本14` |
> | workspace_id | `real-dev-14` |

---

## 1. ~~预建 workspace~~（不需要！全自动建）

> 修复 #1（push-client 带 root_path）+ visual 侧 `ensureWorkspaceRecord` upsert 后：
>
> - **Workspace 行**：第一次 `visual test` 或第一条 hook push 到 `/api/internal/ingest/raw` 时自动 upsert
> - **rootPath 字段**：hook push 现在会带 `process.cwd()`，第一条事件就把 rootPath 写好；不再需要等 collector，也不需要手动 SQL
>
> 本节跳过即可。

---

## 2. 用本地 br-ai-spec 源码安装到 test_副本14

### 2.1 装规范库

```bash
cd "/Users/lizhenwei/workspace/test/test-ai-spec/prd-to-delivery-local-first-060/test_副本14"

# 先预热 /api/health，避免 CLI 遥测 500ms HEAD 超时导致"装机上报"丢失
curl -s -o /dev/null "http://localhost:18780/api/health"
# 清掉上一次可能留下的健康探测冷却（60 秒内的失败会让 CLI 整轮跳过上报）
rm -f ~/.ai-spec-auto/telemetry.json

# AI_SPEC_VISUAL_URL 让 CLI 遥测（/api/public/installations/report）指向本地 18780
# AI_SPEC_TELEMETRY_HEALTH_TIMEOUT_MS=3000 拉长探活超时，适配 Next.js dev 首次冷编译
AI_SPEC_VISUAL_URL="http://localhost:18780" \
AI_SPEC_TELEMETRY_HEALTH_TIMEOUT_MS=3000 \
node "/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec/bin/cli.js" init . --profile vue --visual-bridge
```

> 两个参数都可省：`--profile` 默认 `vue`，`--visual-bridge` 默认 `yes`（见 `install-workflow.js` 里 `DEFAULT_PROFILE='vue'` / `visualBridge:'yes' // 默认启用`）。所以简写 `node ".../bin/cli.js" init .` 行为完全等价，显式更保险、防未来默认值变动。
>
> 想验证装机上报是否生效：`/platform/installations` 页面里 `共` 后面的数字应该非 0；或者
> ```bash
> docker exec br-ai-spec-visual-db-1 mariadb -uroot -proot_password_123 br_ai_spec_visual -e \
>   "SELECT COUNT(*) FROM Installation; SELECT command, status, occurredAt FROM InstallationEvent ORDER BY occurredAt DESC LIMIT 5;"
> ```

等到末尾打印 `规范与配置文件已同步到项目`。检查产物：

```bash
ls .ai-spec
ls .agents/rules/profiles/vue | head
ls openspec
```

### 2.2 配 visual 桥接

`init --visual-bridge` 只在 `.agents/manifest` 里登记 enabled，**真正的 `.ai-spec/visual-bridge.json` 要由 `visual init` 子命令生成**：

```bash
# 非交互模式：server_url=http://localhost:18780（显式传，避免走 CLI 默认的 3000）
# workspace_id 默认取 basename(项目目录) = "test_副本14"。如想用 "real-dev-14"，去掉 --yes 走交互式
node "/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec/bin/cli.js" visual init \
  --server "http://localhost:18780" \
  --yes
```

如果你确实想把 workspace_id 改成 `real-dev-14`（与本手册其他章节一致），用下面这一行覆盖：

```bash
node -e "
const fs=require('fs');
const f='.ai-spec/visual-bridge.json';
const j=JSON.parse(fs.readFileSync(f,'utf-8'));
j.workspace_id='real-dev-14';
fs.writeFileSync(f, JSON.stringify(j,null,2)+'\n');
console.log('updated workspace_id =', j.workspace_id);
"
```

> 之后再跑 `auto update` 不会再清掉 server_url / workspace_id（修复 #3 已生效）。

### 2.3 预热 + 自检

```bash
curl -s -o /dev/null "http://localhost:18780/"
node "/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec/bin/cli.js" visual test
node "/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec/bin/cli.js" visual status
```

> dev 模式下 `visual test` 偶尔会 timeout，**不影响后续**：直接看 §3.5 的 DB 计数即可，那才是 ground truth。

---

## 3. 真实需求开发（在 IDE 里跑 `/spec-start` 一轮）

### 3.0 先验证 hook push 链路活着（30 秒）

不需要 IDE，直接手动触发一次 `onRunStart`，确认 visual 端能收到事件、Workspace.rootPath 自动落库：

```bash
cd "/Users/lizhenwei/workspace/test/test-ai-spec/prd-to-delivery-local-first-060/test_副本14" && node -e "
const { initVisualHooks, resetVisualHooks } = require('/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec/internal/visual-hooks');
resetVisualHooks();
const hooks = initVisualHooks();
if (!hooks) { console.error('hooks init failed — 检查 .ai-spec/visual-bridge.json enabled=true'); process.exit(1); }
hooks.onRunStart('smoke-' + Date.now(), 'real-dev-14', { kind: 'smoke-test' })
  .then(() => console.log('✅ pushed'));
"
```

期望输出：
```
[visual-hooks] config loaded from .../.ai-spec/visual-bridge.json
[visual-hooks] onRunStart pushed: smoke-XXX
✅ pushed
```

立刻验 DB：

```bash
docker exec br-ai-spec-visual-db-1 mariadb -uroot -proot_password_123 br_ai_spec_visual -e "
  SELECT id, rootPath FROM Workspace WHERE id='real-dev-14';
  SELECT COUNT(*) AS n FROM RawIngestEvent WHERE workspaceId='real-dev-14';
"
```

期望：
- `Workspace.rootPath` = `/Users/lizhenwei/workspace/test/test-ai-spec/prd-to-delivery-local-first-060/test_副本14` ✅（修复 #1）
- `RawIngestEvent.n` ≥ 1 ✅（修复 #3+#4：hook 链路通了）

> 如果这一步失败，IDE 里的 `/spec-start` 也不会自动推事件。先排查再继续。

### 3.0.1 Run 终态（与 Pipeline 看板）

**数据约定**：Visual 的 `RunState` 由 hook 事件投影得到。`run.started` 会留下一条&ldquo;在跑&rdquo;的骨架；**每次 run 结束**（成功、失败、取消、或 smoke 用例收尾）时，br-ai-spec 应再推 **`run.state_changed`**（payload 中体现完成/取消等）或 **`run.archived`**，使 Visual 收到终态，看板与「活跃运行」统计与真实一致。

- **为什么重要**：只推 `onRunStart` 而不推终态时，库中会长期只有 `lastEventType=run.started` + `status=running`，**与 Spec/Plan 是否有需求无关**；这不是 bug，但会误导&ldquo;总有一条 run 在跑&rdquo;的观感。
- **Visual 读侧（本仓）缓解**：对**长期停留在 Run 列**且无新事件的运行，若超过可配置小时数，Pipeline 看板**默认不展示**该条（不删库；[运行] 列表仍可查全部）。源头的终态事件仍是正解。环境变量 `PIPELINE_STALE_RUN_MAX_AGE_HOURS` 默认 `24`。
- **与 §3.0 的关系**：`smoke-*` 若只调 `onRunStart`、未补终态，属预期**测试残留**；真实 `/spec-start` 流程中应以 br-ai-spec 的完整 run 生命周期为准。验证完 hook 后，若需 DB 中不留 smoke run，可 §7 收尾里一并删 `RunState` / `RunEvent`（同 workspace）。

### 3.1 在 Cursor 中打开项目

`protocol-step` 是 IDE 端调用的桥命令，**真实开发流程**是在 Cursor / Claude Code 里执行 slash 命令；它会产出 `openspec/changes/<change-id>/` 下的 proposal/design/tasks/specs，这些就是 visual 要看的"真数据"。

### 3.1 在 Cursor 中打开项目

```bash
cursor "/Users/lizhenwei/workspace/test/test-ai-spec/prd-to-delivery-local-first-060/test_副本14"
```

### 3.2 第一轮：项目初始化（只做一次）

在 Cursor chat 里输入：

```
/project-init
```

让 AI 完成：
- `01-项目概述.md`
- `03-项目结构.md`
- 其他 `.agents/` 上下文文件

确认产出：

```bash
ls "/Users/lizhenwei/workspace/test/test-ai-spec/prd-to-delivery-local-first-060/test_副本14/.agents/rules/profiles/vue/01-项目概述.md" \
   "/Users/lizhenwei/workspace/test/test-ai-spec/prd-to-delivery-local-first-060/test_副本14/.agents/rules/profiles/vue/03-项目结构.md"
```

### 3.3 第二轮：跑一个真实需求

在 Cursor chat 里输入（**这就是真实需求开发的入口**）：

```
/spec-start

为登录页加一个"记住我"复选框：
- 勾选后 7 天内免登录
- 用 localStorage 存 token，不存密码
- 测试覆盖勾选/不勾选两种路径
```

按 IDE 提示走完全流程，会逐步生成：

```
openspec/changes/<change-id>/
  ├─ proposal.md      # 业务/工程目标 + 范围
  ├─ design.md        # 设计与决策
  ├─ tasks.md         # 子任务清单
  └─ specs/           # 需求规范
```

### 3.4 验证 openspec 产物已落盘

```bash
ls openspec/changes/
# 期望：看到一个新生成的 change 目录（id 形如 add-remember-me-login-2026xxxx）

CHANGE_DIR=$(ls -td openspec/changes/*/ | head -1)
echo "本轮 change: $CHANGE_DIR"
ls "$CHANGE_DIR"
# 期望：proposal.md / design.md / tasks.md / specs/

head -30 "$CHANGE_DIR/proposal.md"
```

> 如果你不想真在 IDE 里手动跑，也可以直接 CLI 起一轮（产物结构相同，但内容会更骨架化）：
>
> ```bash
> cd "/Users/lizhenwei/workspace/test/test-ai-spec/prd-to-delivery-local-first-060/test_副本14"
> node "/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec/bin/cli.js" protocol-step --user-input "为登录页加记住我复选框，勾选后7天免登录" 2>&1 | tail -10
> ```
>
> 真实场景请优先用 IDE，更接近用户实际工作流。

---

## 4. 把真实产物灌到 visual

```bash
cd "/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec-visual"
npm run collector -- \
  --workspace-id "real-dev-14" \
  --project "/Users/lizhenwei/workspace/test/test-ai-spec/prd-to-delivery-local-first-060/test_副本14" \
  --server "http://localhost:18780" \
  --json | tail -50
```

关键看 JSON 末尾：

```json
"ingest": { "ok": true, "inserted": <非0数字>, ... }
```

或者扫描计数（应有大量 openspec 模板/规范文件）：

```json
"openspec": { "files": [ ... 多条 ... ] }
```

---

## 5. 在 visual UI 上看真数据

### 5.1 Workspace 入口

打开浏览器：

- `http://localhost:18780/overview` → 工作区健康卡里出现 `real-dev-14`
- `http://localhost:18780/workspaces` → 列表里点进去
- `http://localhost:18780/w/real-dev-14` → 工作区首页
- `http://localhost:18780/platform/installations` → 装机遥测（需要以 admin 角色登录）

### 5.2 真实需求页

| 页面 | 看什么 |
|---|---|
| `/w/real-dev-14/specs` | 看到本轮 change 的 proposal / design 文档 |
| `/w/real-dev-14/changes` | 看到一条 `add-remember-me-...` 的变更 |
| `/w/real-dev-14/changes/<changeId>` | 详情页里能展开 proposal/tasks 内容 |
| `/w/real-dev-14/runs` | 如果 IDE 端 `/spec-start` 触发过 push，能看到 run 卡 |
| `/w/real-dev-14/topology` | 角色/资产关系图（即便很简也算通过） |

### 5.3 数据库地面真相

```bash
docker exec br-ai-spec-visual-db-1 mariadb -uroot -proot_password_123 br_ai_spec_visual -e "
  SELECT COUNT(*) AS n_events FROM RawIngestEvent WHERE workspaceId='real-dev-14';
  SELECT COUNT(*) AS n_changes FROM ChangeDocument WHERE workspaceId='real-dev-14';
  SELECT id, eventType, occurredAt FROM RawIngestEvent WHERE workspaceId='real-dev-14' ORDER BY occurredAt DESC LIMIT 10;
"
```

期望：

- `n_events` ≥ 1（至少有 collector 灌进的扫描事件）
- `n_changes` ≥ 1（如果 collector 把 openspec/changes 解析成 ChangeDocument）

---

## 6. 验证勾选清单

| # | 项 | 命令 / 路径 | ☑️ |
|---|---|---|---|
| 1 | visual 服务在线 | `curl http://localhost:18780/api/health` ok | [ ] |
| 2 | workspace 自动建好 | §3.0 hook push 后 DB Workspace 表自动出现 `real-dev-14` | [ ] |
| 3 | **rootPath 自动落库（修复 #1）** | DB `Workspace.rootPath` = `/Users/lizhenwei/workspace/test/test-ai-spec/prd-to-delivery-local-first-060/test_副本14` | [ ] |
| 4 | init 产物完整 | `.ai-spec/ .agents/ openspec/` 都生成 | [ ] |
| 5 | **hook push 链路通（修复 #3+#4）** | §3.0 smoke 后 `RawIngestEvent` ≥ 1 | [ ] |
| 6 | **update 不清桥接配置（修复 #3）** | 跑一次 `auto update .` 后 `cat .ai-spec/visual-bridge.json` 里 server_url/workspace_id 仍在 | [ ] |
| 7 | **CLI 装机遥测上报** | `/platform/installations` 共 ≥ 1，或 `SELECT COUNT(*) FROM Installation;` ≥ 1 | [ ] |
| 8 | 真实需求 change 已落盘 | `openspec/changes/<id>/proposal.md` 非空 | [ ] |
| 9 | collector 灌入成功 | JSON `ingest.ok: true` | [ ] |
| 10 | UI `/w/real-dev-14/specs` 看到内容 | 浏览器 | [ ] |
| 11 | UI `/w/real-dev-14/changes` 看到变更 | 浏览器 | [ ] |
| 12 | DB 里有事件 | `SELECT COUNT(*) FROM RawIngestEvent` ≥ 1 | [ ] |
| 13 |（可选）Run 终态或接受读侧 | 真实 spec-start 有 `run.state_changed` / `run.archived`；仅 smoke 可在 §7 清 `RunState` | [ ] |

如果 1-12 全勾上 = visual 真的看到了真数据，闭环成立。第 13 项为 Run 与看板排障用。

---

## 7. 收尾

```bash
# 清掉 visual 侧本次数据（表顺序注意外键：先子表、再 Workspace）
docker exec br-ai-spec-visual-db-1 mariadb -uroot -proot_password_123 br_ai_spec_visual -e \
  "DELETE FROM RunEvent WHERE workspaceId='real-dev-14';
   DELETE FROM RunState WHERE workspaceId='real-dev-14';
   DELETE FROM RawIngestEvent WHERE workspaceId='real-dev-14';
   DELETE FROM ChangeDocument WHERE workspaceId='real-dev-14';
   DELETE FROM ControlOutbox WHERE workspaceId='real-dev-14';
   DELETE FROM Workspace WHERE id='real-dev-14';"

# 清项目（如不想保留 IDE 的开发产物可执行）
cd "/Users/lizhenwei/workspace/test/test-ai-spec/prd-to-delivery-local-first-060/test_副本14"
node "/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec/bin/cli.js" visual disable
node "/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec/bin/cli.js" uninstall .
rm -rf .cursor .claude openspec .ai-spec .agents node_modules
git status --short
```

---

## 排错

- **collector 跑出来 `inserted: 0`**：检查 `--project` 是不是真的指向 `test_副本14`；`test_副本14/openspec/changes/` 目录里**得真的有** proposal/design/tasks 文件（即第 3 步必须真做完）。
- **UI 上 `/w/real-dev-14` 是空的**：去 §5.3 查 DB；如果 DB 里有数据但 UI 空，多半是页面缓存，硬刷新（Cmd+Shift+R）。
- **IDE 里 `/spec-start` 没反应**：先在 Cursor 设置 → MCP / 命令权限里 Always Allow 当前 workspace；或者直接用 §3.4 末尾的 CLI 兜底命令。
- **`visual test` 一直 timeout**：dev 模式 Next.js 冷编译正常，跳过它直接看 §5.3 DB 计数即可。
- **§3.0 hook smoke 报 `hooks init failed`**：检查 `.ai-spec/visual-bridge.json` 里 `enabled: true`、`server_url` 非空、`workspace_id` 非空；再不行 `node -e "console.log(require('/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec/internal/visual-hooks/config-loader').loadVisualConfig())"` 看 loader 实际读到什么。
- **`/platform/installations` 一直显示 `共 0`**：
  1. 确认 dev server 连的是 Docker DB —— `/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec-visual/.env.local` 里 **不能** 再有自己的 `DATABASE_URL`，否则会覆盖 `.env` 的 Docker 配置
  2. 删掉 CLI 侧的健康探测冷却缓存：`rm -f ~/.ai-spec-auto/telemetry.json`
  3. 先 `curl http://localhost:18780/api/health` 预热，再跑 init；或者临时 `export AI_SPEC_TELEMETRY_HEALTH_TIMEOUT_MS=3000` 拉长探活超时
  4. 用 `AI_SPEC_TELEMETRY_DEBUG=1` 跑一次 `init`，stderr 会打出 `telemetry http status 200` 表示真的落库了
  5. 最后 `docker exec br-ai-spec-visual-db-1 mariadb -uroot -proot_password_123 br_ai_spec_visual -e "SELECT COUNT(*) FROM Installation"` 应 ≥ 1
- **页面 `/platform/installations` 跳回登录页**：该页挂在 `requireRole("admin")` 下，当前账号不是 admin 就会 303 回 `/login`。去 `Member` / 账户设置里把自己升到 admin，或换 admin 账号登录。
- **Pipeline 的 Run 列有 1 条、Spec/Plan 为空**：多为只有 `run.started` 无终态的 `RunState`（如 §3.0 smoke 或测试 `test-run-*`）。正解见 **§3.0.1** 推终态；或调大 `PIPELINE_STALE_RUN_MAX_AGE_HOURS` / 在 §7 用 SQL 清 `RunState`。
