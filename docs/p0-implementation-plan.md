# br-ai-spec-visual P0 实施计划

## 目标

补齐 Visual(可视化平台)作为运行态与治理平台的 P0 数据底座，优先消费 `br-ai-spec` 的标准结构化事件和锁/索引文件，保证运行过程、资产使用、门禁、安装和治理指标可追踪。

## 非目标

- P0 不重做全部页面视觉。
- P0 不直接定义 Hub(资产中心)资产事实源。
- P0 不上传或展示目标项目源码。
- P0 不替代 `br-ai-spec` 状态机。

## P0 第一批开发建议

1. 先定义 Visual ingest(采集入库) 标准事件 schema(模式)，与 `br-ai-spec` P0 输出对齐。
2. 收敛 Collector(采集器)：默认不读取 sample(样本内容)，默认不上传绝对路径和用户名。
3. 增加对 `.ai-spec/ai-spec.lock.json`、`.agents/registry.index.json`、`.ai-spec/context-index.json` 的解析。
4. 建立 WorkspaceTopology(工作区拓扑)、TechProfile(技术画像)、ManifestCoverage(清单覆盖率) 的 read model(读模型)。
5. 将现有 RunState/RunEvent/TimelineEvent 映射到第二阶段 RuntimeEventType(运行事件类型)。
6. 增加 Incident(事故) 与 CircuitBreaker(熔断器) 展示所需最小表或视图。
7. 统一新增 API 的 ApiResponse(接口响应) 和 Error Code(错误码)。
8. 增加隐私与幂等测试。

## 推荐实施路线

### P0-1 采集事件契约

交付内容：

- `src/lib/contracts/runtime-event.ts`
- `src/lib/contracts/workspace-topology.ts`
- `src/lib/contracts/privacy.ts`
- `/api/internal/ingest/raw` 与 `/api/internal/ingest/run-state` 的标准兼容层。

验收口径：

- 支持 `manifest_installed`、`manifest_synced`、`run_created`、`state_transition`、`stage_started`、`stage_completed`、`gate_required`、`incident_created`、`history_written` 等事件。
- 所有事件必须有 idempotencyKey(幂等键)。
- 不接受源码、完整 prompt(提示词)、完整 response(响应)、绝对路径、用户名。

### P0-2 Collector 隐私收敛

交付内容：

- Collector 默认只上传元数据。
- `sample` 字段改为显式 opt-in(显式启用)。
- 绝对路径改为 projectHash(项目哈希) + relativePath(相对路径)。
- username/hostname 默认不上报或哈希化。

验收口径：

- 默认上报 payload(负载) 中不存在源码片段。
- 测试断言 `sourceCodeIncluded=false`、`absolutePathIncluded=false`、`userNameIncluded=false`。
- 老数据导入保持兼容，但新采集默认安全。

### P0-3 新锁与索引解析

交付内容：

- `.ai-spec/ai-spec.lock.json` parser(解析器)。
- `.agents/registry.index.json` parser(解析器)。
- `.ai-spec/context-index.json` parser(解析器)。
- 保留 `.agents/registry/hub-lock.json` 兼容解析。

验收口径：

- 可展示 Manifest(安装清单)、资产 kind/slug/version/checksum。
- 可展示 progressive loading(渐进加载) 的阶段资产。
- 旧 hub-lock 与新 lock 不一致时给出治理 warning(警告)。

### P0-4 WorkspaceTopology 与技术画像

交付内容：

- 新增 read model(读模型) 或现有 `RegistryItem` 扩展，用于存储 workspace/repo/package。
- 技术画像展示字段：language(语言)、frameworks(框架)、packageManager(包管理器)、confidence(置信度)、reasons(原因)。
- Topology 页面消费标准拓扑。

验收口径：

- 单仓、pnpm workspace、多 package 可展示。
- 低置信度技术画像在 UI(用户界面) 中标记待确认。
- 不展示本机绝对路径。

### P0-5 Run/Timeline 状态统一

交付内容：

- RuntimeEventType 到现有 RunState、RunEvent、TimelineEvent 的 projector(投影器)。
- 状态枚举对齐 initialized/planning/branch_preparing/context_building/executing/verifying/diagnosing/recovering/human_review/suspended/completed/failed/cancelled。

验收口径：

- Run 详情可看到阶段、执行器、耗时、失败原因。
- Timeline(时间线) 可展示 gate(门禁)、incident(事故)、history(历史)。
- 非法状态事件记录为 warning，不写坏主状态。

### P0-6 Incident 与熔断视图

交付内容：

- Incident read model(事故读模型)。
- 关联 runId、stage、failureCategory、retryCount、resolution、diagnoseReportRef。
- 页面复用现有 runs/gate/governance 组件展示。

验收口径：

- 可展示重复失败、token 超预算、执行器超时、资产篡改、隐私违规。
- 可区分 recovering(恢复中)、human_review(人工审核)、suspended(暂停)。

### P0-7 Manifest 覆盖率与资产使用

交付内容：

- ManifestCoverage(清单覆盖率) 读模型。
- RunAssetUsage(运行资产使用) 读模型。
- Workspace assets 页面展示 Manifest、Rule、Skill、Role、Flow、Agent Profile。

验收口径：

- 展示 manifest slug/version/checksum。
- 展示 run 阶段使用了哪些资产。
- 标记高风险资产和本地改动。

### P0-8 Hub 回流接口准备

交付内容：

- 定义向 `skill-q-platform` 回流 runtime-feedback(运行反馈) 的 adapter(适配器)。
- 先做 disabled-by-default(默认关闭) 配置。
- 支持批量重试和失败留痕。

验收口径：

- 回流 payload 不包含源码、绝对路径、用户名、raw prompt、raw response。
- Hub 不可用时不影响 Visual 本地展示。

### P0-9 测试与验收

测试内容：

- Collector 隐私测试。
- ingest 幂等测试。
- RuntimeEventType 投影测试。
- lock/index/context-index parser 测试。
- Gate/Incident/Timeline 组件测试。
- WebSocket connect token(连接令牌) 鉴权测试。

验收口径：

- 不依赖真实业务项目源码。
- 所有错误断言 error code(错误码)。
- 隐私测试必须覆盖默认采集路径。

## 与其他项目依赖顺序

1. `br-ai-spec` 先输出标准 RuntimeEvent(运行事件)、lock/index/context-index。
2. `br-ai-spec-visual` 解析并展示这些结构化数据。
3. `skill-q-platform` 提供 runtime-feedback(运行反馈) 接口后，Visual 再开启回流。

## 主要风险

1. 当前 Collector 默认读取 sample(样本内容)，必须先处理隐私，否则后续治理上报风险扩大。
2. 新旧 lock 文件并存，Visual 需要明确优先级：`ai-spec.lock.json` 优先，`hub-lock.json` 兼容。
3. RunState 当前已能服务页面，映射第二阶段状态时要避免破坏现有页面。
4. WebSocket 和 HTTP ingest(采集接口) 都能写入事件，需要统一幂等键和投影路径。
5. Hub 回流必须可关闭，避免本地开发时因 Hub 不可用影响 Visual。

