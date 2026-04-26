# BR AI Spec Visual

面向 **ai-spec-auto**（规范驱动 AI 研发）体系的**运行态可视化与控制面**：聚合已接入规范的本地/团队项目的运行态、变更、拓扑与采集数据，提供 **REST**、**WebSocket** 实时通道，以及 **Collector** 上报能力。

## 在整体生态中的位置

本系统不是独立「看板」，而是 **AI 工程资产操作系统** 的展示与治理层，与资产 Hub、本地执行引擎分工如下（与《AI 工程资产操作系统：指令级 PRD 与技术蓝图》及 `br-ai-spec` 架构文档一致）：

| 项目 | 定位 | 核心职责 |
| --- | --- | --- |
| **skill-q-platform** | AI 工程资产 **Hub** | 团队/平台资产、Manifest、Agent Profile、审核发布、版本与分发 |
| **br-ai-spec**（npm：`@ex/ai-spec-auto`） | 本地**执行引擎** | 技术栈扫描、InitPlan、`.ai-spec` 与锁文件、状态机、Worktree、**多执行器**适配、运行态落盘与事件上报 |
| **本仓库 br-ai-spec-visual** | **运行态可视化** | 工作区与 Runs/Changes、拓扑与规格视图、Collector/内部 ingest、治理与报表、**不持有业务源码** |

数据流口诀：**Hub 提供资产事实源 → 业务项目通过 `ai-spec-auto` 完成规范与交付闭环 → Visual 经 Hook 与 Collector 汇聚多项目运行态。**

## 本仓库职责与边界

**应做：**

- 展示工作区/仓库拓扑、Manifest 安装与使用情况、Run 与历史、与规范资产相关的可视化。
- 提供 Collector CLI 与 REST/WebSocket 接入，接收结构化元数据、扫描摘要与运行事件。
- 与 `br-ai-spec` 侧 `visual-hooks`、控制拉取/回执等机制协同（详见仓库内 [与 br-ai-spec 协作与技术栈](docs/与%20br-ai-spec%20协作与技术栈.md)）。

**禁止（与架构文档及 [AGENTS.md](AGENTS.md) 一致）：**

- 不将 Codex / Cursor / Claude Code 中任一执行器写死为唯一终端。
- 不默认上传目标项目**源码**、完整提示词与回复；不上传可识别隐私的路径、密钥等。
- 不绕过 **`.ai-spec/ai-spec.lock.json`** 所表达的治理约束；不直接修改 **Hub 已发布资产正文**；不在**原始工作区**直接改业务代码作为常规路径。
- Registry 等展示以服务端数据为准：**数据库中的 RegistryItem（通常随 Hub/CLI 同步）优先于** 本地 `.agents/registry` 的回退读。

## 与 br-ai-spec 的协作通道（概览）

业务项目安装 `@ex/ai-spec-auto` 后，与 Visual 之间典型包括：

- **Hook 推送（实时）**：运行节点事件 HTTP 投递至 Visual 的 internal ingest，失败可降级、不阻塞协议推进。
- **Collector（按需/定时）**：扫描 `.ai-spec/`、`.agents/registry/`、`.omx/logs/`、`openspec/` 等，批量或增量上报。
- **WebSocket**：与 HTTP 同端口挂载 `/ws`，供浏览器与 Collector 侧会话/基线类事件使用。
- **控制回执（可选能力）**：Visual 暴露控制相关 API，由底座轮询/回执，形成闭环。

更细的契约、配置入口（如 `.ai-spec/visual-config.json`）与 mermaid 总图见 [与 br-ai-spec 协作与技术栈](docs/与%20br-ai-spec%20协作与技术栈.md)。

## 功能概览

- **工作区（Workspace）**：多项目纳管、成员与权限、连接令牌（Collector / 实时通道）
- **Runs / Changes**：运行记录、变更与状态（与 `.ai-spec` 运行态、历史 run 等对齐）
- **拓扑与规格**：仓库/包关系与规范资产视图（依赖上报与扫描数据）
- **实时能力**：`server.mjs` 将 Next.js 与 WebSocket 挂在同一 HTTP 端口
- **Collector**：扫描已安装 ai-spec-auto 的目录并上报；详见 [Collector 使用指南](docs/Collector使用指南.md)

若只保留一句话：**先在业务项目里用 `ai-spec-auto` 完成规范与交付闭环；再用本服务与 Collector 把多项目运行态汇总到统一面板。**

## 技术栈

与当前 [package.json](package.json) 一致，便于选型与评审时对照版本。

### 运行时与框架

| 类别 | 选型 |
| --- | --- |
| **Node** | 建议 **18+**（与文档「前置条件」一致） |
| **包管理** | 仓库声明 **pnpm**；亦可用 `npm`/`yarn` 安装依赖（团队统一即可） |
| **Web 框架** | **Next.js 16.2.x**（App Router），由自定义 **`server.mjs`** 创建 HTTP 并挂载 Next 与 WebSocket |
| **UI 库** | **React 19.2.x**、**React DOM** |
| **语言** | **TypeScript 5.x** |

### 前端 UI 与可视化

| 类别 | 选型 |
| --- | --- |
| **样式** | **Tailwind CSS 4**（`@tailwindcss/postcss`） |
| **类名组合** | **clsx**、**tailwind-merge**、**class-variance-authority（CVA）** |
| **图标** | **lucide-react** |
| **拓扑 / 流程图** | **@xyflow/react**（React Flow） |

### 数据与校验

| 类别 | 选型 |
| --- | --- |
| **ORM** | **Prisma 7.7.x**，配置入口 **`prisma/prisma.config.ts`**（`defineConfig` + `env("DATABASE_URL")`） |
| **数据库** | Schema 为 **`provider = "mysql"`**；运行时通过 **`@prisma/adapter-mariadb`** + **`mariadb`** 驱动（可与 MariaDB / MySQL 兼容实例对接） |
| **校验** | **Zod 4.x**（含服务端环境变量解析等） |

### 认证与安全

| 类别 | 选型 |
| --- | --- |
| **密码哈希** | **bcryptjs** |
| **会话** | Cookie + 服务端校验（可通过 `BR_AI_SPEC_VISUAL_*` 环境变量配置） |

### 实时与集成

| 类别 | 选型 |
| --- | --- |
| **WebSocket** | **`ws`**（服务端）；与 HTTP 共用端口，便于同源实时推送 |
| **Collector CLI** | **commander**、**chokidar**、**glob**；经 **tsx** 执行 **`src/collector/cli.ts`** |

### 工具库

| 类别 | 选型 |
| --- | --- |
| **日期** | **date-fns** |
| **ID** | **nanoid** |

### 开发与质量

| 类别 | 选型 |
| --- | --- |
| **代码检查** | **ESLint 9** + **eslint-config-next** |
| **单元 / 组件测试** | **Vitest 4.x**、**@testing-library/react**、**@testing-library/jest-dom**、**jsdom** |
| **脚本运行时** | **tsx**（Prisma seed、Collector、服务端 TS 加载等） |

## 前置条件

- Node.js **18+**
- 可用的 **MySQL / MariaDB** 实例（`DATABASE_URL`）

## 本地开发

### 1. 安装依赖

```bash
pnpm install
# 或: npm install
```

### 2. 环境变量

至少配置数据库；其余开发环境可使用默认值。创建 `.env` 或 `.env.local`：

```bash
# 必填：MySQL 连接串（与 Prisma datasource 一致）
DATABASE_URL="mysql://USER:PASSWORD@127.0.0.1:3306/br_ai_spec_visual"

# 可选：会话与 Cookie（生产环境务必改为强随机密钥）
# BR_AI_SPEC_VISUAL_SESSION_SECRET="..."
# BR_AI_SPEC_VISUAL_COOKIE_NAME="br-ai-spec-visual-session"
# BR_AI_SPEC_VISUAL_APP_NAME="BR AI Spec Visual"

# Collector / 内部 ingest 校验（与默认值不一致时需显式配置）
# REALTIME_CONNECT_SECRET="..."
```

### 3. 初始化数据库与种子数据

```bash
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

### 4. 启动开发服务

```bash
npm run dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000)（默认端口 `3000`，可通过 `PORT`、`HOSTNAME` 调整）。根路径会重定向到 **`/workspaces`**。

### 与 ai-spec-auto 项目联动（Collector）

在已执行 `npx @ex/ai-spec-auto init .` 的仓库中：

```bash
npm run collector -- \
  --workspace-id <工作区标识> \
  --server http://localhost:3000
```

说明与排障见 **[Collector 使用指南](docs/Collector使用指南.md)**。底座安装、命令与 OpenSpec 流程见兄弟仓：`../br-ai-spec/README.md`（路径按你本地克隆位置调整）。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` / `pnpm dev` | 开发（`node server.mjs`，Next + WebSocket） |
| `npm run build` | 生产构建 |
| `npm run start` | 生产启动（`NODE_ENV=production node server.mjs`） |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 检查 |
| `npm run test` | Vitest |
| `npm run prisma:generate` | 生成 Prisma Client |
| `npm run prisma:push` | 开发环境同步 schema |
| `npm run prisma:seed` | 种子数据 |
| `npm run collector -- --help` | Collector CLI 帮助 |

## 相关文档

### 本仓库 `docs/`

- [与 br-ai-spec 协作与技术栈](docs/与%20br-ai-spec%20协作与技术栈.md)（三仓协同、通道与契约）
- [Collector 使用指南](docs/Collector使用指南.md)
- [快速部署指南](docs/快速部署指南.md)、[BR AI Spec Visual 部署指南](docs/BR%20AI%20Spec%20部署指南.md)
- [需求说明文档](docs/需求说明文档.md)、[端到端安装测试](docs/端到端安装测试-init-update-sync.md) 等

### 配套体系说明（`docs` 项目 / 知识库，路径以实际为准）

- **总入口**：`br-ai-spec-docs` 等文档包通常位于你本机或团队网盘，例如：  
  `/Users/lizhenwei/Downloads/00download/docs`
- **阶段化交付包（指令级 PRD/物理目录/数据模型/API/路线/测试/验收）**  
  其下 `第二大阶段/` 目录中的 **7 份** 编号 Markdown，例如：  
  `1-AI 工程资产操作系统：指令级 PRD 与技术蓝图.md` … `7-最终交付验收清单.md`（与 [AGENTS.md](AGENTS.md) 所述「开发前必读的 7 份文档」对应）。
- **规范核心架构**（`ai-spec` 与三项目边界、原则）  
  同包内 `知识库文档/ai-spec规范核心架构/` 下的 `01-br-ai-spec-architecture.md` 及各 `*-spec` 等。

若你与作者使用相同目录布局，兄弟仓示例：`/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec`。

## 部署提示

生产环境请务必：

- 设置强随机 **`BR_AI_SPEC_VISUAL_SESSION_SECRET`**
- 配置 **`REALTIME_CONNECT_SECRET`**（若使用 Collector / 内部 ingest 校验）
- 使用 `npm run build` + `npm run start`（或 `pnpm build` + `pnpm start`），并配置反向代理与健康检查

更多见 [BR AI Spec Visual 部署指南](docs/BR%20AI%20Spec%20部署指南.md) 与 [快速部署指南](docs/快速部署指南.md)。

## 贡献与实现约束

参与开发前请阅读 [AGENTS.md](AGENTS.md)：三项目边界、禁止事项（不删业务逻辑、不一次实现全部能力、不无限重试等）以及 **中文** 提示/CLI 输出、**类型**与 **JSON Schema**、**核心模块需测试** 等要求。

---

**外部参考**：[Next.js 文档](https://nextjs.org/docs)（本仓库基于 App Router；细节以已安装 `next` 版本为准。）
