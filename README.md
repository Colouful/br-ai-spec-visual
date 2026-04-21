# BR AI Spec Visual

面向 **ai-spec-auto**（规范驱动 AI 研发）体系的**可视化与控制面**：聚合已接入规范的本地/团队项目的运行态、变更、拓扑与采集数据，并提供 WebSocket 实时能力与 Collector 上报通道。

与同目录底座仓库的关系：

| 仓库 | 角色 |
| --- | --- |
| `br-ai-spec`（npm：`@ex/ai-spec-auto`，本地常与本文库同级：`../br-ai-spec`） | **规范与运行时底座**：规则、技能、IDE 命令、OpenSpec、`/.ai-spec` 运行状态等 |
| **本仓库**（`br-ai-spec-visual`） | **可视化与接入层**：工作区管理、Runs/Changes、拓扑与规格视图、REST + WS、Collector CLI 上报 |

如果只保留一句话：**先在业务项目里用 `ai-spec-auto` 完成规范与交付闭环；再用本服务与 Collector 把多项目的运行态汇总到统一面板。**

## 功能概览

- **工作区（Workspace）**：多项目纳管、成员与权限、连接令牌（用于 Collector / 实时通道）
- **Runs / Changes**：运行记录、变更文档与状态追踪（与 `.ai-spec` 运行态、历史 run 等数据对齐）
- **拓扑与规格**：仓库/角色关系与规范资产的可视化呈现（依赖上报数据）
- **实时能力**：自定义 `server.mjs` 将 Next.js 与 WebSocket 挂在同一 HTTP 端口，便于浏览器订阅更新
- **Collector**：扫描已安装 ai-spec-auto 的项目目录（`.ai-spec/`、`.agents/registry/`、`.omx/logs/`、`openspec/` 等），批量上报至本服务；详见 [Collector 使用指南](docs/Collector使用指南.md)

## 技术栈

以下内容与当前仓库 `package.json` 保持一致，便于选型与评审时对照版本。

### 运行时与框架

| 类别 | 选型 |
| --- | --- |
| **Node** | 建议 **18+**（与文档「前置条件」一致） |
| **Web 框架** | **Next.js 16.2.x**（App Router），由自定义 **`server.mjs`** 创建 HTTP 服务并挂载 Next 与 WebSocket |
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
| **数据库** | Schema 为 **`provider = "mysql"`**；运行时通过 **`@prisma/adapter-mariadb`** + **`mariadb`** 驱动连接（可与 MariaDB / MySQL 兼容实例对接） |
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
| **Collector CLI** | **commander**（CLI）、**chokidar**（监听）、**glob**（扫描）、通过 **tsx** 执行 TypeScript 入口 **`src/collector/cli.ts`** |

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
| **脚本运行时** | **tsx**（Prisma seed、Collector、服务端 TS 模块加载等） |

## 前置条件

- Node.js **18+**
- 可用的 **MySQL / MariaDB** 实例（用于 `DATABASE_URL`）

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 环境变量

至少配置数据库连接；其余可使用默认值（开发环境）。

创建 `.env`（或 `.env.local`，依你团队约定），示例：

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

浏览器访问 [http://localhost:3000](http://localhost:3000)（默认端口 `3000`，可通过环境变量 `PORT`、`HOSTNAME` 调整）。  
根路径会重定向到 **`/workspaces`**。

### 与 ai-spec-auto 项目联动（Collector）

在已执行 `npx @ex/ai-spec-auto init .` 的前端/业务仓库中，使用本仓库提供的 Collector 将扫描结果上报到 Visual 服务，例如：

```bash
npm run collector -- \
  --workspace-id <你的工作区标识> \
  --server http://localhost:3000
```

完整参数、WebSocket 模式与排障说明见 **[Collector 使用指南](docs/Collector使用指南.md)**。  
ai-spec-auto 的安装、命令入口与 OpenSpec 流程说明见底座仓库 README：`../br-ai-spec/README.md`。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 开发模式（`node server.mjs`，含 Next + WebSocket） |
| `npm run build` | 生产构建 |
| `npm run start` | 生产启动（`NODE_ENV=production node server.mjs`） |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 检查 |
| `npm run test` | Vitest |
| `npm run prisma:generate` | 生成 Prisma Client |
| `npm run prisma:push` | 将 schema 同步到数据库（开发常用） |
| `npm run prisma:seed` | 种子数据 |
| `npm run collector -- --help` | Collector CLI 帮助 |

## 相关文档

- [Collector 使用指南](docs/Collector使用指南.md)
- [Next.js 文档](https://nextjs.org/docs)（本项目基于 Next.js App Router；框架细节以仓库内 `node_modules/next/dist/docs/` 为准）

## 部署提示

生产环境请务必：

- 设置强随机 **`BR_AI_SPEC_VISUAL_SESSION_SECRET`**
- 配置 **`REALTIME_CONNECT_SECRET`**（若使用 Collector / 内部 ingest 校验）
- 使用 **`npm run build`** + **`npm run start`**，并配置反向代理与健康检查

---

若你与作者使用相同的目录布局，底座仓库路径为：`/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec`（也可将兄弟仓库克隆到任意路径后，按上文 `../br-ai-spec` 相对关系访问）。
