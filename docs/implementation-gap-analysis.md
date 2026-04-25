# br-ai-spec-visual 第二阶段实现差距分析

## 分析范围

本文对照 `/Users/lizhenwei/Downloads/00download/docs/第二大阶段` 下 7 份 Markdown 文档，分析 `br-ai-spec-visual` 当前代码结构、已实现能力与缺失能力。

本轮只做分析，不涉及业务代码修改。

## 当前项目定位

`br-ai-spec-visual` 当前是 Next.js(前端全栈框架) + Prisma(数据库 ORM) + WebSocket(实时通信) 的可视化与控制面。它已经具备 Workspace(工作区)、Runs(运行记录)、Changes(变更)、Specs(规范文档)、Topology(拓扑)、成员、控制门禁、Collector(采集器)、安装统计和治理看板雏形。

第二阶段文档要求它成为运行态可视化与治理平台，重点展示：

- Workspace / Repo / Package(工作区/仓库/包) 拓扑。
- 项目技术画像。
- Manifest(安装清单) 覆盖率。
- Rule / Skill / Agent Profile(规则/技能/智能体画像) 使用情况。
- Run(运行) 状态、History(历史)、OpenSpec(开放规范)。
- Incident(事故) 与熔断。
- Token(令牌/额度) 预算与消耗。
- 团队报表、项目报表、资产质量报表。
- 接收 `br-ai-spec` 结构化运行事件，并向 Hub(资产中心)回流质量指标。

## 当前代码结构

### 根目录

- `package.json`：Next.js 16.2.4、React 19.2.4、Prisma 7.7、WebSocket `ws`、Collector CLI(采集器命令行)。
- `server.mjs`：自定义服务入口，承载 Next.js 与 WebSocket。
- `prisma/schema.prisma`：包含 User、Session、Workspace、WorkspaceMember、WorkspaceAgent、SyncJob、RegistryItem、RegistryRelation、RunState、RunEvent、RunRoleExecution、ChangeDocument、SpecAsset、GateApproval、TimelineEvent、OmxSession、OmxTurn、Alert、RawIngestEvent、ControlOutbox、Installation 等。
- `src/app/`：App Router 页面和 API route(接口路由)。
- `src/server/`：WebSocket、connect-token(连接令牌)、control(控制)、runtime(运行时)、HTTP API 等。
- `src/collector/`：Collector CLI、扫描、事件构建、HTTP 上报。
- `src/lib/`：鉴权、db(数据库)、ingest(采集入库)、projectors(投影器)、view-models(视图模型)、权限、运行态服务。
- `src/components/`：dashboard(仪表盘)、runs、changes、topology、workspaces、governance、guide、admin 等页面组件。

### API(接口)现状

当前已存在：

- 采集：`/api/internal/ingest/raw`、`/api/internal/ingest/run-state`。
- 工作区：`/api/workspaces`、`/api/workspaces/[workspaceId]`、`connect-token`、assets、governance、dashboard、flow。
- 运行态：`/api/runs`、`/api/runs/[id]`、timeline、gate approve/reject/request-changes。
- 控制：`/api/control/pending`、`/api/control/approve`、`/api/control/resume`。
- 变更与规范：`/api/changes`、`/api/specs`、`/api/tasks`、`/api/trace/recent`。
- 安装统计：`/api/public/installations/report`、`/api/admin/installations/*`。
- 认证与成员：`/api/auth/*`、`/api/me`、`/api/members`。

## 第二阶段目标能力对照

| 能力域 | 第二阶段要求 | 当前状态 | 说明 |
| --- | --- | --- | --- |
| Collector API(采集接口) | 接收结构化运行事件，幂等、鉴权、隐私约束 | 部分实现 | 已有 raw/run-state ingest(采集入库) 和 connect token(连接令牌)，但统一事件 schema(模式)与隐私字段断言未完全对齐。 |
| Workspace 拓扑 | 展示 Workspace/Repo/Package 三层拓扑 | 部分实现 | 有 Workspace、RegistryItem、Topology 页面和 React Flow(流程图)，但依赖采集数据，缺第二阶段标准 WorkspaceTopology。 |
| 项目技术画像 | 展示扫描识别结果、框架、语言、包管理器、置信度 | 部分实现 | 有 assets/profile 和 hub-lock 画像，缺 TechScanner 输出的标准技术画像模型。 |
| Manifest 覆盖率 | 展示安装 Manifest、版本、资产覆盖率 | 部分实现 | 有 hub-lock profile(资产画像) 和 runtime insights(运行洞察)，但缺 Hub 与 CLI 标准 lock/index 的全量对齐。 |
| Rule/Skill/Agent Profile 使用 | 展示运行使用资产 | 部分实现 | 可展示 registry/assets，缺 Agent Profile 一等资产和 run 阶段使用明细。 |
| Run 运行态 | 状态、阶段、事件、执行器、耗时、失败原因 | 部分实现 | 有 RunState、RunEvent、RunRoleExecution、timeline、run detail，但事件类型与第二阶段 RunState/RuntimeEventType 未统一。 |
| History 小需求资产 | 展示 `.ai-spec/history` 摘要 | 部分实现 | Collector 会扫描 `.ai-spec` 和 openspec，缺标准 History 模型与摘要字段。 |
| Incident 熔断 | 展示 incident、诊断、恢复、人工审批 | 部分实现 | 有 GateApproval、Alert、ControlOutbox，但缺 Incident 模型、熔断原因和诊断报告。 |
| 治理报表 | 团队/项目/资产质量、覆盖率、成功率 | 部分实现 | 有 governance summary 和 installations dashboard，但缺 Hub runtime-feedback 关联指标。 |
| Token 预算 | 展示 token 预算与消耗 | 缺失 | 当前未见 tokenBudget 标准字段和消耗报表。 |
| 隐私过滤 | 不展示源码、绝对路径、用户名、密钥、完整 prompt/response | 部分实现 | 文档强调不上传源码，但 Collector 当前会读取小文件 sample(样本) 和绝对 path(路径)，需要收敛。 |
| Hub 回流 | 向 Hub 回流资产使用效果与质量指标 | 缺失 | 当前更像接收 Visual 数据，未形成向 `skill-q-platform` 回写反馈。 |
| 统一 API 响应 | 标准 ApiResponse(接口响应) 和 error code(错误码) | 部分实现 | 部分 API 返回 `{ ok: true }` 或直接 NextResponse，未统一。 |
| 性能验收 | Visual 页面、API、WebSocket 性能指标 | 部分实现 | 有测试，但缺第二阶段性能测试标准。 |

## 已实现能力

1. Workspace(工作区)管理：工作区、成员、权限、连接令牌。
2. Collector(采集器)：扫描 `.agents/registry`、`.ai-spec`、`.omx/logs`、`openspec` 并上报。
3. Raw ingest(原始采集) 与 projector(投影器)：可将原始事件投影为 RunState、RunEvent、ChangeDocument 等。
4. WebSocket(实时通信)：浏览器与 Collector/Agent 可通过 connect token 连接并推送实时事件。
5. Runs/Changes/Specs 页面：运行、变更和规范文档展示已经成型。
6. GateApproval(门禁审批)：支持运行节点审批、拒绝、要求修改。
7. ControlOutbox(控制发件箱)：支持控制命令下发、状态追踪。
8. Installation(安装统计)：接收 CLI 安装/命令上报并提供后台 dashboard(仪表盘)。
9. Governance(治理)雏形：平台与工作区治理汇总视图。
10. Hub lock 画像展示：可基于 `.agents/registry/hub-lock.json` 展示 Manifest、资产版本、本地改动和风险。

## 缺失能力 Top 20

1. 标准 `RuntimeEventType(运行事件类型)` 与事件 schema(模式)。
2. 标准 `WorkspaceTopology(工作区拓扑)` 入库与展示。
3. Repo/Package(仓库/包) 层级模型。
4. Tech Profile(技术画像) 数据模型和置信度展示。
5. Manifest 覆盖率与资产覆盖率统计。
6. Agent Profile(智能体画像) 展示与运行关联。
7. Run 阶段使用的 Rule/Skill/Role/Flow/Agent Profile 明细。
8. Incident(事故) 数据模型与熔断面板。
9. diagnosing/recovering/human_review/suspended 状态口径统一。
10. Token Budget(令牌预算) 与消耗展示。
11. History 小需求资产标准摘要展示。
12. OpenSpec 变更状态与 run/history 的强关联。
13. 隐私过滤：禁止 sample(样本内容)、绝对路径、用户名进入上报或展示。
14. 对 `br-ai-spec` 新 `.ai-spec/ai-spec.lock.json`、`.agents/registry.index.json`、`.ai-spec/context-index.json` 的消费。
15. 对 `skill-q-platform` runtime-feedback(运行反馈) 的回流。
16. 统一 ApiResponse(接口响应) 和 Error Code(错误码)。
17. Collector 幂等与重复事件更严格校验。
18. 团队报表、项目报表、资产质量报表完整指标。
19. Visual 性能测试和 WebSocket 压力测试。
20. 隐私与安全测试矩阵。

## 与其他两个项目的依赖

`br-ai-spec-visual` 的核心数据源应来自 `br-ai-spec`。只有 `br-ai-spec` 先稳定输出 WorkspaceTopology(工作区拓扑)、RunEvent(运行事件)、History(历史)、Incident(事故)、lock/index/context-index，Visual 才能形成标准展示。资产质量、Manifest 推荐效果和运行反馈的闭环需要 `skill-q-platform` 提供资产与反馈接口。

## 风险点

1. Collector 当前会读取小文件 sample(样本)，与第二阶段“不上传源码/内部文档原文”存在冲突风险。
2. Installation(安装统计) 中存在 hostname/username 字段，若未来作为治理数据上报，需要明确脱敏和可配置开关。
3. 当前 Visual 同时有本地 memory runtime(内存运行时)和 Prisma 数据模型，事件源口径需要统一。
4. 页面已经较多，标准数据模型迁移时容易出现旧页面读旧字段、新页面读新字段的双轨维护成本。
5. 没有 Hub 回流前，治理报表只能看过程，不能形成资产推荐和质量闭环。

