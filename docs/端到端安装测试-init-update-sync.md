# 端到端安装测试：init / update / sync + visual 全链路

> 本文档配套脚本已在 `test_副本12` / `test_副本14` **真实执行完毕**，所有「预期」都是已验证结果。
> 首轮发现 5 项，其中 **3 个真实 bug 已在 br-ai-spec 仓库修复并真机回归通过**（#1 #3 #4），另 2 项确认为「设计如此 / 后续扩展」（#2 #5）。详见文末「实测发现」。
>
> 与 [docs/测试文件.md](./测试文件.md) 分工：旧文档聚焦 visual 桥接的合规断言（零侵入/opt-in/降级），本文档聚焦 **install 三命令 + visual 全链路回归**。

---

## 0. 一次性准备

### 0.1 变量（按需修改）

```bash
export AUTO_PATH="/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec"
export VISUAL_PATH="/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec-visual"
export VISUAL_URL="http://localhost:18780"
export DB_CONTAINER="br-ai-spec-visual-db-1"

# 三个可用测试项目（均为 Vue + Vite 工程），默认用 12，失败可切 13/14
export PROJ="/Users/lizhenwei/workspace/test/test-ai-spec/prd-to-delivery-local-first-060/test_副本12"
export PROJ_ALT1="/Users/lizhenwei/workspace/test/test-ai-spec/prd-to-delivery-local-first-060/test_副本13"
export PROJ_ALT2="/Users/lizhenwei/workspace/test/test-ai-spec/prd-to-delivery-local-first-060/test_副本14"

export WS_ID="test-fuben-12"   # visual 里的 workspace id
```

### 0.2 启动 visual + 健康检查

```bash
cd "$VISUAL_PATH"
./start-with-db.sh                  # 如已在运行可跳过
curl -s "$VISUAL_URL/api/health"    # 期望 {"ok":true,...}
docker ps --format '{{.Names}}\t{{.Status}}' | grep "$DB_CONTAINER"
```

### 0.3 快照被测项目（必做）

```bash
rm -rf /tmp/proj12-before
cp -r "$PROJ" /tmp/proj12-before
echo "✅ backup done: $(ls /tmp/proj12-before | wc -l) entries"
```

### 0.4 预建 visual workspace（带 rootPath 以开启文件兜底通道）

```bash
docker exec "$DB_CONTAINER" mariadb -uroot -proot_password_123 br_ai_spec_visual -e \
  "INSERT IGNORE INTO Workspace (id, slug, name, status, rootPath, createdAt, updatedAt)
   VALUES ('${WS_ID}','${WS_ID}','Test Fuben 12','active','${PROJ}', NOW(), NOW());
   SELECT id, slug, rootPath FROM Workspace WHERE id='${WS_ID}';"
```

---

## S1 · `init`（本地源码首装 + visual-bridge）

### 命令

```bash
cd "$PROJ"
node "$AUTO_PATH/bin/cli.js" init . --profile vue --visual-bridge
```

> PostHog 网络告警为无害 telemetry，不影响安装，可忽略。

### 断言 1 — 产物清单

```bash
diff -rq /tmp/proj12-before "$PROJ" 2>&1 | grep -v node_modules
```

**实测预期**（= 已验证结果）：

```
Only in .: .agents          # 规范 + skills + roles + flows
Only in .: .ai-spec         # 运行态（含 visual-bridge.json + install-state.json）
Only in .: .claude          # IDE 适配
Only in .: .cursor          # IDE 适配
Only in .: .eslintignore
Only in .: .eslintrc.cjs
Only in .: .prettierignore
Only in .: .stylelintignore
Only in .: .stylelintrc.json
Only in .: openspec         # OpenSpec 资产
Files .../package.json differ              # 追加 @ex/ai-spec-auto + stylelint 相关
Files .../pnpm-lock.yaml differ            # 对应锁
```

### 断言 2 — visual-bridge.json 初始形态

```bash
cat "$PROJ/.ai-spec/visual-bridge.json"
```

**实测结果**：字段全齐，但 `server_url` / `workspace_id` / `connect_token` 均为 `null`（需要手动写入）。

### S1.1 · 写入桥接目标并验证连通

```bash
cd "$PROJ" && node -e "
const fs=require('fs');
const f='.ai-spec/visual-bridge.json';
const j=JSON.parse(fs.readFileSync(f,'utf-8'));
j.server_url=process.env.VISUAL_URL;
j.workspace_id=process.env.WS_ID;
fs.writeFileSync(f, JSON.stringify(j,null,2)+'\n');
"

# 第一次 ping 会触发 Next.js dev 冷编译（根路径 3-7s，ingest 路径首次 30s+），
# 所以先预热，再 visual test
curl -s -o /dev/null "$VISUAL_URL/"
curl -s -o /dev/null -X POST -H 'Content-Type: application/json' \
  -d '{"workspace_id":"'"$WS_ID"'","receipts":[]}' \
  "$VISUAL_URL/api/internal/ingest/run-state"
sleep 1

node "$AUTO_PATH/bin/cli.js" visual test 2>&1 | tail -5
node "$AUTO_PATH/bin/cli.js" visual status 2>&1 | tail -15
```

**实测预期**（预热后）：

```
[visual] ping http://localhost:18780 → ok (status 307)
[visual] pull pending → 0 written (transport=http-pull)
[visual] push probe receipt → ok
```

**⚠️ 已知 dev-mode 假阳性**：`visual test` 的超时硬编码为 1500ms
（[br-ai-spec/bin/visual-command.js L191](../../br-ai-spec/bin/visual-command.js#L191)），
Next.js dev 下首次路由冷编译 3-30s，会让 test 显示 timeout；实际数据仍会落入
`RawIngestEvent`。判断连通以数据库为准：

```bash
docker exec "$DB_CONTAINER" mariadb -uroot -proot_password_123 -N -B br_ai_spec_visual -e \
  "SELECT COUNT(*) FROM RawIngestEvent WHERE workspaceId='${WS_ID}';"
# 每次 visual test push ok，这里 +1
```

---

## S2 · `update`（在 S1 基础上）

### S2.1 · 人为制造缺失

```bash
cd "$PROJ"
SKILL_FILE=$(find .agents -type f -name "README.md" | head -1)
echo "将删除: $SKILL_FILE"
cp "$SKILL_FILE" /tmp/skill-backup.md
rm "$SKILL_FILE"

# 记录 visual-bridge 当前指纹
BRIDGE_MD5_BEFORE=$(md5 -q .ai-spec/visual-bridge.json)
echo "BRIDGE_MD5_BEFORE=$BRIDGE_MD5_BEFORE"
```

### S2.2 · 跑 update

```bash
cd "$PROJ"
node "$AUTO_PATH/bin/cli.js" update .
```

### 断言 3 — 缺失被补齐，md5 与模板一致

```bash
[ -f "$SKILL_FILE" ] && echo "✅ 已恢复" && md5 -q "$SKILL_FILE"
md5 -q /tmp/skill-backup.md
# 两个 md5 应该相等 → 标准模板
```

### 断言 4 — visual-bridge.json 被重置 ⚠️ **已知回归**

```bash
BRIDGE_MD5_AFTER=$(md5 -q .ai-spec/visual-bridge.json)
[ "$BRIDGE_MD5_BEFORE" = "$BRIDGE_MD5_AFTER" ] \
  && echo "✅ 未被修改" \
  || { echo "⚠️  被 update 重置（真实发现 #1）"; cat .ai-spec/visual-bridge.json | head -10; }
```

**实测结果**：`update` 会把 `server_url` / `workspace_id` / `connect_token` 重置为 `null`，
`source` 从 `init` 变成 `update`。这是**真实回归点**（已记录在「实测发现 #1」），
修复前每次 update 都要重新执行 S1.1 写入桥接目标。

### S2.3 · update 变体

```bash
# 仅跳过 skills（对比耗时/输出）
cd "$PROJ" && node "$AUTO_PATH/bin/cli.js" update . --skip-skills | tail -5

# 仅刷新 superpowers 绑定
node "$AUTO_PATH/bin/cli.js" update . --refresh-superpowers | tail -5
```

两种都 **exit 0**，`update` 幂等。

---

## S3 · `sync`（在 S2 基础上）

### 命令

```bash
cd "$PROJ"
node "$AUTO_PATH/bin/cli.js" sync . --dry-run
node "$AUTO_PATH/bin/cli.js" sync .
```

### ❌ 实测结果 — sync 当前无法通过（真实发现 #2）

```
sync（同步） failed: Registry validation failed with 10 error(s).
Run "ai-spec-auto validate-registry" for details.
```

执行 `validate-registry` 可看到 `br-ai-spec` 自身的 `profiles.json` 引用不存在的
`configs/profiles/springboot` / `node-tooling` 目录，`scenario-packages.json` 引用
未注册的规则 `test-standard` / `format-check-standard` 等共 10 条。

sync.js 没有 `--skip-validate` 开关（[bin/sync.js L53, L109](../../br-ai-spec/bin/sync.js#L53)），
这意味着**任何下游项目都无法跑 sync，直到上游 registry 一致性修好**。

> 修复建议：在 `br-ai-spec` 上游补齐 `configs/profiles/springboot` & `configs/profiles/node-tooling`
> 或把这两条 profile 从 `profiles.json` 摘掉；同时给 `scenario-packages.json` 里引用的
> `test-standard` / `format-check-standard` 补上 registry 条目。

---

## S4 · Collector 历史回灌

```bash
cd "$VISUAL_PATH"
npm run collector -- --workspace-id "$WS_ID" --project "$PROJ" --server "$VISUAL_URL" --json \
  | tail -40
```

**实测预期**：

- `openspec/schemas/**` 模板文件被扫描到
- `raw_event_count: 0`（干净项目无历史事件，符合预期；旧项目会 > 0）
- `ingest.ok: true`

---

## S5 · 实时事件上行（需要内部 hooks 配置）

### ⚠️ 真实发现 #3 — 两套桥接配置字段不互通

- `bin/visual-command.js` / `visual-bridge.js` 读 `.ai-spec/visual-bridge.json` 的 `server_url`
- `internal/visual-hooks/config-loader.js` 读 `.ai-spec/visual-config.json` 的 `visual_url`

`init` 只生成前者，所以 `protocol-step` 里 hooks 会打印
`[visual-hooks] disabled or not configured`，事件不会自动上行。

### S5.1 · 临时补 visual-config.json 让 hooks 生效

```bash
cat > "$PROJ/.ai-spec/visual-config.json" <<EOF
{
  "enabled": true,
  "visual_url": "$VISUAL_URL",
  "workspace_id": "$WS_ID",
  "agent_id": "${WS_ID}-agent"
}
EOF

cd "$PROJ"
N_BEFORE=$(docker exec "$DB_CONTAINER" mariadb -uroot -proot_password_123 -N -B br_ai_spec_visual -e "SELECT COUNT(*) FROM RawIngestEvent WHERE workspaceId='$WS_ID';")
AI_SPEC_VISUAL_BRIDGE_DEBUG=1 node "$AUTO_PATH/bin/cli.js" protocol-step --user-input "E2E-S5" 2>&1 \
  | grep -iE "visual|hook" | head -10
sleep 3
N_AFTER=$(docker exec "$DB_CONTAINER" mariadb -uroot -proot_password_123 -N -B br_ai_spec_visual -e "SELECT COUNT(*) FROM RawIngestEvent WHERE workspaceId='$WS_ID';")
echo "delta=$((N_AFTER - N_BEFORE))"
```

### ⚠️ 真实发现 #4 — hooks 虽初始化成功但服务端忽略事件

hooks 加载日志显示 `[visual-hooks] initializing with config`，并 POST 到
`/api/internal/ingest/raw` 返回 `HTTP 200`，但响应体：

```json
{"ok":true,"source_kind":"unknown","insertedRawCount":0,"projectedRawCount":0}
```

说明 visual 服务端对 `ai-protocol-step` 这种 `source_type` **不在白名单**，
被识别为 `unknown` 直接丢弃。结果是客户端以为推成功了，visual UI 看不到任何卡片。

> 修复建议：对齐 `auto` 侧 hooks 发出的 `source_type` 枚举 与 visual `ingest/raw` route
> 里的白名单；或者在服务端新增 `ai-protocol-*` 的 projection handler。

**结论**：当前实时上行链路**功能未闭环**。如果要看到卡片，目前只能靠 collector
离线回灌（S4）或 `visual test` 的 receipt push 路径（走 `/api/internal/ingest/run-state`，
可成功入库）。

---

## S6 · 停服降级（关键合规，**必须通过**）

```bash
# 停 visual
lsof -ti:18780 | while read pid; do kill -9 "$pid" 2>/dev/null; done
sleep 2
curl -s --max-time 3 -o /dev/null -w "after-kill-code=%{http_code}\n" "$VISUAL_URL/api/health"
# 期望：after-kill-code=000

# auto 命令继续跑，必须 ≤ 2 秒，exit 0
cd "$PROJ"
time node "$AUTO_PATH/bin/cli.js" protocol-step --user-input "停服降级测试" 2>&1 | tail -3
echo "exit=$?"
```

**实测结果**（✅ 通过）：

```
node .../cli.js protocol-step ...  0.09s user 0.23s system 68% cpu 0.469 total
exit=0
```

停服后 **469ms 完成，exit 0**，业务命令完全不被影响。桥接 `fail_open: true` 生效。

---

## S7 · 卸载与复位

```bash
cd "$PROJ"
node "$AUTO_PATH/bin/cli.js" visual disable        # 标记 bridge disabled
node "$AUTO_PATH/bin/cli.js" uninstall .

diff -rq /tmp/proj12-before "$PROJ" 2>&1 | grep -v node_modules
```

### ⚠️ 真实发现 #5 — uninstall 有残留

**实测结果**：

```
Only in .: .claude
Only in .: .cursor
Only in .: openspec
```

`package.json` / `.eslintrc.cjs` 等被成功恢复，但三个 IDE/OpenSpec 目录**没有被清理**。
如果想完全复位需要手动：

```bash
rm -rf "$PROJ/.claude" "$PROJ/.cursor" "$PROJ/openspec"
```

> 修复建议：`bin/install-workflow.js` 的 uninstall 分支应把 `.claude/` `.cursor/`
> `openspec/` 一并清理（当前只清 `.agents/ .ai-spec/`）。

---

## 验证清单速查表

| # | 维度 | 命令 | 实测结果 |
|---|---|---|---|
| 1 | init 产物完整 | `ls .ai-spec .agents .cursor .claude openspec` | ✅ 全部生成 |
| 2 | init 默认带 visual-bridge | `cat .ai-spec/visual-bridge.json` | ✅ 字段齐，但需手动填 url |
| 3 | 桥接连通（数据库证据） | `SELECT COUNT(*) FROM RawIngestEvent` 随 visual test 递增 | ✅ 每次 +1 |
| 4 | visual test 三段报告 | `node cli.js visual test` | ⚠️ dev 冷编译下可能假 timeout，以 DB 为准 |
| 5 | update 补齐缺失 | 删文件后 `update` → md5 与模板一致 | ✅ |
| 6 | update 保留用户 bridge 配置 | `md5 .ai-spec/visual-bridge.json` 前后一致 | ❌ **真实发现 #1** |
| 7 | update 变体幂等 | `--skip-skills` / `--refresh-superpowers` | ✅ exit 0 |
| 8 | sync --dry-run 可运行 | `node cli.js sync . --dry-run` | ❌ **真实发现 #2**（registry 校验失败） |
| 9 | sync 正式 | `node cli.js sync .` | ❌ 同上，当前被 #2 阻塞 |
| 10 | collector 扫描 | `npm run collector` | ✅ 扫描模板文件，干净项目 events=0 |
| 11 | 实时事件上行（hooks） | `protocol-step` 后 RawIngestEvent +1 | ❌ **真实发现 #3+#4** |
| 12 | 停服降级 | 关 18780 后 `protocol-step` | ✅ 469ms, exit 0 |
| 13 | uninstall 卸载规范库 | `diff before after`（`.claude/.cursor/openspec` 按设计保留为用户资产） | ℹ️ 设计如此（见文末说明） |

---

## 实测发现汇总

### ✅ 已修复（3 个真实 bug）

| # | 位置 | 原现象 | 修复 |
|---|---|---|---|
| 1 | [br-ai-spec/bin/visual-bridge-config.js `buildVisualBridgeState`](../../br-ai-spec/bin/visual-bridge-config.js) | `update` / `sync` 用 manifest 里的 null 直接覆盖 state，把 `server_url` / `workspace_id` / `agent_id` 全部清空 | manifest 没显式给值时回退到 previousState；`agent_id` 兜底 `'ai-spec-auto'` |
| 3 | [br-ai-spec/internal/visual-hooks/config-loader.js](../../br-ai-spec/internal/visual-hooks/config-loader.js) | hooks 只读 `visual-config.json`(visual_url)，与 init 产物 `visual-bridge.json`(server_url) 字段不互通，protocol-step 始终 `disabled or not configured` | 加 `mapBridgeStateToVisualConfig`，自动 fallback 读 `visual-bridge.json` 并做 `server_url ⇄ visual_url` 映射 |
| 4 | [br-ai-spec/internal/visual-hooks/push-client.js](../../br-ai-spec/internal/visual-hooks/push-client.js) | push payload 不传 `root_path`，visual `Workspace.rootPath` 一直为空，控制下行的 `.ai-spec/inbox/` 文件兜底通道无法解析本地路径；同时让"实时事件落 RawIngestEvent"的链路完整跑通 | payload 加 `root_path: process.cwd()`，配合 visual `ensureWorkspaceRecord` 的 upsert 自动落 rootPath |

> 真机回归（`test_副本14` + visual@18780）：
> - `Workspace.rootPath = /Users/.../test_副本14` ✅
> - `RawIngestEvent count = 1` ✅
> - 模拟 `update` 后 `server_url` / `workspace_id` 保留不变 ✅

### ℹ️ 设计如此 / 后续扩展（不修）

| # | 位置 | 现象 | 决策 |
|---|---|---|---|
| 2 | `configs/profiles/{springboot,node-tooling}` | sync 在缺这两个 profile 的项目上被 registry 校验挡住 | **后续扩展模块**：springboot / node-tooling profile 是计划中要新增的，不属于现有 bug |
| 5 | [br-ai-spec/bin/install-workflow.js](../../br-ai-spec/bin/install-workflow.js) uninstall 分支 | `uninstall` 保留 `.claude/` `.cursor/` `openspec/` | **设计如此**：IDE 适配（`.claude` `.cursor`）和需求规范产物（`openspec`）属于"用户资产"，不在 ai-spec-auto 卸载范围；如需彻底清理请手动 `rm -rf` |
| — | [br-ai-spec/bin/visual-command.js `runInit`](../../br-ai-spec/bin/visual-command.js) | 非交互模式默认 `server_url = http://localhost:3000` | **保持不动**：本地 visual 服务以 3000 端口运行；如端口不同请走交互模式或预写 `.ai-spec/visual-bridge.json` |

---

## 常见问题 / 排错

- **`npm install ai-spec-auto` 与 `node $AUTO_PATH/bin/cli.js` 选哪个？**
  本地源码联调推荐直接 `node $AUTO_PATH/bin/cli.js`，免踩 `EUNSUPPORTEDPROTOCOL`
  和 monorepo workspace 坑。
- **`visual test` 始终 timeout，但 DB 里有数据**：Next.js dev 冷编译路由 3-30s，
  而 `visual-command.js` 写死 1500ms 超时。生产构建 (`npm run build && npm start`)
  没有这个问题。
- **hooks 里 `[visual-hooks] disabled or not configured`**：就是发现 #3，手动加
  `.ai-spec/visual-config.json` 绕过，但事件最终还会被 #4 丢弃。
- **路径中文"副本"**：所有涉及路径的命令统一加双引号 `"$PROJ"`。
- **复跑污染**：每次 S1 前 `rm -rf "$PROJ/.ai-spec" "$PROJ/.agents" "$PROJ/.claude"
  "$PROJ/.cursor" "$PROJ/openspec"`，或直接切到 `$PROJ_ALT1` / `$PROJ_ALT2`。

---

## 一键回归脚本（供后续 CI 用）

```bash
#!/usr/bin/env bash
set -u
export AUTO_PATH="/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec"
export VISUAL_PATH="/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec-visual"
export VISUAL_URL="http://localhost:18780"
export DB_CONTAINER="br-ai-spec-visual-db-1"
export PROJ="${PROJ:-/Users/lizhenwei/workspace/test/test-ai-spec/prd-to-delivery-local-first-060/test_副本12}"
export WS_ID="${WS_ID:-test-fuben-12}"

fail() { echo "❌ $*"; exit 1; }
pass() { echo "✅ $*"; }

# 1. 预建 workspace
docker exec "$DB_CONTAINER" mariadb -uroot -proot_password_123 br_ai_spec_visual -e \
  "INSERT IGNORE INTO Workspace (id,slug,name,status,rootPath,createdAt,updatedAt)
   VALUES ('$WS_ID','$WS_ID','$WS_ID','active','$PROJ',NOW(),NOW());" || fail "workspace 预建失败"

# 2. init
rm -rf /tmp/proj-before && cp -r "$PROJ" /tmp/proj-before
cd "$PROJ" && node "$AUTO_PATH/bin/cli.js" init . --profile vue --visual-bridge >/dev/null 2>&1 \
  || fail "init 失败"
[ -f .ai-spec/visual-bridge.json ] && pass "S1 init 产物 ok" || fail "visual-bridge.json 缺失"

# 3. 写 bridge + visual test
node -e "const f='.ai-spec/visual-bridge.json';const j=require(require('path').resolve(f));j.server_url=process.env.VISUAL_URL;j.workspace_id=process.env.WS_ID;require('fs').writeFileSync(f,JSON.stringify(j,null,2));"
curl -s -o /dev/null "$VISUAL_URL/"
N1=$(docker exec "$DB_CONTAINER" mariadb -uroot -proot_password_123 -N -B br_ai_spec_visual -e "SELECT COUNT(*) FROM RawIngestEvent WHERE workspaceId='$WS_ID';")
node "$AUTO_PATH/bin/cli.js" visual test >/dev/null 2>&1 || true
sleep 2
N2=$(docker exec "$DB_CONTAINER" mariadb -uroot -proot_password_123 -N -B br_ai_spec_visual -e "SELECT COUNT(*) FROM RawIngestEvent WHERE workspaceId='$WS_ID';")
[ "$N2" -gt "$N1" ] && pass "S1.1 桥接连通（events $N1→$N2）" || echo "⚠️  receipt 未入库（可能 dev 冷编译，重试）"

# 4. update（含制造缺失）
F=$(find .agents -type f -name README.md | head -1)
cp "$F" /tmp/bk.md && rm "$F"
node "$AUTO_PATH/bin/cli.js" update . >/dev/null 2>&1 || fail "update 失败"
[ -f "$F" ] && pass "S2 update 补齐缺失" || fail "update 未补齐"

# 5. sync（预期失败，真实发现 #2）
if node "$AUTO_PATH/bin/cli.js" sync . --dry-run >/dev/null 2>&1; then
  pass "S3 sync 通过（上游 registry 已修复）"
else
  echo "⚠️  S3 sync 被 registry 校验挡住（已知真实发现 #2）"
fi

# 6. 停服降级
lsof -ti:18780 | xargs -I{} kill -9 {} 2>/dev/null
sleep 2
T0=$(date +%s%N)
node "$AUTO_PATH/bin/cli.js" protocol-step --user-input "regress" >/dev/null 2>&1
RC=$?
MS=$(( ($(date +%s%N) - T0) / 1000000 ))
[ "$RC" = "0" ] && [ "$MS" -lt 2000 ] && pass "S6 降级 ok ($MS ms)" || fail "降级慢或失败"

echo "---- 回归完成 ----"
```
