import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Compass,
  FileStack,
  Folders,
  GitBranch,
  LayoutDashboard,
  Network,
  Settings,
  Shield,
  Users,
  Workflow,
} from "lucide-react";
import Link from "next/link";

import { ConsolePage } from "@/components/dashboard/console-page";
import { Panel } from "@/components/dashboard/panel";
import { getRoleLabel, type UserRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";

import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";

interface QuickStartStep {
  cta: string;
  href: string;
  icon: LucideIcon;
  step: string;
  summary: string;
  title: string;
}

interface GuideModule {
  availability: string;
  href?: string;
  icon: LucideIcon;
  role: UserRole;
  summary: string;
  title: string;
}

interface GuideRegion {
  summary: string;
  title: string;
}

interface RecommendedFlow {
  path: string;
  summary: string;
  title: string;
}

const SECTION_LINKS = [
  { id: "quick-start", label: "快速上手" },
  { id: "platform-modules", label: "平台模块" },
  { id: "workspace-modules", label: "工作区模块" },
  { id: "page-regions", label: "页面结构" },
  { id: "recommended-flows", label: "推荐路径" },
] as const;

const QUICK_START_STEPS: QuickStartStep[] = [
  {
    step: "01",
    title: "先看驾驶舱",
    summary: "用平台级总览快速判断活跃运行、阻塞点和全局健康，先知道问题在哪一层。",
    href: "/overview",
    cta: "打开驾驶舱",
    icon: LayoutDashboard,
  },
  {
    step: "02",
    title: "再定位工作区",
    summary: "进入工作区列表，找到目标项目，确认当前工作区的运行态、文档量和连接状态。",
    href: "/workspaces",
    cta: "查看工作区",
    icon: Folders,
  },
  {
    step: "03",
    title: "改动前先分流",
    summary: "在分流决策页判断当前改动应该走轻量修正还是完整变更，避免路径选错。",
    href: "/route-decision",
    cta: "打开分流决策",
    icon: Workflow,
  },
  {
    step: "04",
    title: "进入项目主线",
    summary: "选定工作区后，按流水线、规范、运行、变更、拓扑这些模块逐步推进和回看产物。",
    href: "/workspaces",
    cta: "进入项目列表",
    icon: GitBranch,
  },
];

const PLATFORM_MODULES: GuideModule[] = [
  {
    title: "驾驶舱",
    summary: "平台级首页，适合先看接入状态、阻塞点、待处理积压和默认工作区入口。",
    role: "viewer",
    href: "/overview",
    availability: "所有已登录角色可见",
    icon: LayoutDashboard,
  },
  {
    title: "工作区",
    summary: "查看所有工作区健康、连接情况和实时状态，是从平台视角进入项目的主入口。",
    role: "viewer",
    href: "/workspaces",
    availability: "所有已登录角色可见",
    icon: Folders,
  },
  {
    title: "分流决策",
    summary: "在真正改动代码前，先判断当前需求或修正应该走哪条变更链路。",
    role: "viewer",
    href: "/route-decision",
    availability: "所有已登录角色可见",
    icon: Workflow,
  },
  {
    title: "用户安装使用",
    summary: "管理员查看安装趋势、活跃情况和命令使用热度，适合平台运营分析。",
    role: "admin",
    href: "/platform/installations",
    availability: "仅管理员可见",
    icon: BarChart3,
  },
  {
    title: "全局成员",
    summary: "管理员统一维护平台账号、角色和访问权限，处理跨工作区的成员治理。",
    role: "admin",
    href: "/platform/members",
    availability: "仅管理员可见",
    icon: Users,
  },
  {
    title: "系统设置",
    summary: "配置默认权限、连接策略和平台级运行规则，适合做全局治理收口。",
    role: "admin",
    href: "/platform/settings",
    availability: "仅管理员可见",
    icon: Settings,
  },
];

const WORKSPACE_MODULES: GuideModule[] = [
  {
    title: "流水线",
    summary: "查看规范、计划、运行、评审、归档五阶段主线，是理解当前项目推进位置的第一屏。",
    role: "viewer",
    availability: "进入任一工作区后可见",
    icon: Workflow,
  },
  {
    title: "规范",
    summary: "集中查看 proposal、tasks、design、spec 等规范资产，适合做需求与方案回看。",
    role: "viewer",
    availability: "进入任一工作区后可见",
    icon: FileStack,
  },
  {
    title: "运行",
    summary: "查看当前工作区的执行历史、阶段状态和实时流转，是定位执行问题的核心页面。",
    role: "maintainer",
    availability: "维护者及以上可见",
    icon: Activity,
  },
  {
    title: "变更",
    summary: "按状态查看变更看板和文档索引，适合守门评审与变更闭环跟踪。",
    role: "maintainer",
    availability: "维护者及以上可见",
    icon: GitBranch,
  },
  {
    title: "拓扑",
    summary: "从角色、资产和关系图谱理解项目结构，适合做系统边界和依赖梳理。",
    role: "viewer",
    availability: "进入任一工作区后可见",
    icon: Network,
  },
  {
    title: "成员",
    summary: "查看工作区内角色分配和成员组成，适合确认协作边界和责任归属。",
    role: "viewer",
    availability: "进入任一工作区后可见",
    icon: Users,
  },
  {
    title: "设置",
    summary: "维护工作区级连接参数和策略，通常由管理员在项目级做最终收口。",
    role: "admin",
    availability: "工作区管理员可见",
    icon: Shield,
  },
];

const PAGE_REGIONS: GuideRegion[] = [
  {
    title: "顶部导航",
    summary:
      "右侧聚合工作区切换、快速跳转、使用指南和用户菜单，适合做跨页面操作。",
  },
  {
    title: "左侧导航",
    summary:
      "桌面端左侧导航按平台级和工作区级分组，帮助你始终知道自己处在哪个上下文。",
  },
  {
    title: "英雄区",
    summary:
      "每个页面顶部的大标题、副标题和指标带，用来说明当前页面目标、范围和关键数字。",
  },
  {
    title: "面板区",
    summary:
      "主体内容由多个信息面板组成，分别承载实时流、表格、卡片、图谱和说明信息。",
  },
];

const RECOMMENDED_FLOWS: RecommendedFlow[] = [
  {
    title: "第一次进入系统",
    path: "驾驶舱 → 工作区 → 工作区流水线",
    summary: "先建立全局认知，再下钻到具体项目，避免一开始就在局部页面里迷路。",
  },
  {
    title: "准备开始一项改动",
    path: "分流决策 → 工作区流水线 → 规范",
    summary: "先选对变更路径，再确认规范资产是否齐全，适合需求还在收敛期时使用。",
  },
  {
    title: "排查执行异常",
    path: "驾驶舱 → 工作区 → 运行 → 变更",
    summary: "先定位异常在哪个工作区，再结合运行历史和变更状态缩小问题范围。",
  },
  {
    title: "做治理或运营复盘",
    path: "用户安装使用 → 全局成员 → 系统设置",
    summary: "更适合管理员，从平台层面回看活跃度、权限和策略是否匹配现状。",
  },
];

function getRoleBadgeVariant(role: UserRole) {
  switch (role) {
    case "admin":
      return "warm";
    case "maintainer":
      return "accent";
    case "viewer":
      return "muted";
  }
}

function QuickStartCard({
  cta,
  href,
  icon: Icon,
  step,
  summary,
  title,
}: QuickStartStep) {
  return (
    <article className="glass-panel group relative overflow-hidden rounded-[28px] p-5 sm:p-6">
      <div className="absolute -right-3 top-0 text-[72px] font-semibold tracking-[-0.08em] text-white/[0.05]">
        {step}
      </div>
      <Badge variant="aurora">第 {step} 步</Badge>
      <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
        <Icon className="h-5 w-5 text-cyan-200" />
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-tight text-white">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-400">{summary}</p>
      <Link
        href={href}
        className={cn(
          buttonVariants({ size: "sm", variant: "ghost" }),
          "mt-6 h-9 px-0 text-cyan-200 ring-0 hover:bg-transparent hover:text-cyan-100",
        )}
      >
        {cta}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </Link>
    </article>
  );
}

function GuideModuleCard({
  availability,
  href,
  icon: Icon,
  role,
  summary,
  title,
}: GuideModule) {
  const entryHref = href ?? "/workspaces";
  const entryLabel = href ? "打开页面" : "从工作区进入";

  return (
    <article className="glass-panel relative overflow-hidden rounded-[28px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
          <Icon className="h-5 w-5 text-cyan-200" />
        </div>
        <Badge variant={getRoleBadgeVariant(role)}>{getRoleLabel(role)}</Badge>
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-white">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-400">{summary}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge variant="outline">{availability}</Badge>
      </div>
      <Link
        href={entryHref}
        className={cn(
          buttonVariants({ size: "sm", variant: "secondary" }),
          "mt-6 h-9 px-3",
        )}
      >
        {entryLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

export function UsageGuidePage() {
  return (
    <ConsolePage
      statsVariant="guide"
      hero={{
        eyebrow: "使用指南",
        title: "5 分钟看懂 br-ai-spec-visual 的页面结构与使用路径",
        subtitle:
          "这不是一张单纯的功能清单，而是一份按使用顺序组织的导航图。先看平台总览，再进入工作区主线，最后根据角色进入治理页面。",
        stats: [
          { label: "快速上手步骤", value: String(QUICK_START_STEPS.length) },
          { label: "平台模块", value: String(PLATFORM_MODULES.length) },
          { label: "工作区模块", value: String(WORKSPACE_MODULES.length) },
          { label: "推荐路径", value: String(RECOMMENDED_FLOWS.length) },
        ],
      }}
      actions={
        <>
          <Link
            href="/overview"
            className={cn(
              buttonVariants({ size: "default", variant: "aurora" }),
              "px-5",
            )}
          >
            返回驾驶舱
          </Link>
          <Link
            href="/workspaces"
            className={cn(
              buttonVariants({ size: "default", variant: "outline" }),
              "px-5",
            )}
          >
            查看工作区
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <Panel className="overflow-visible">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl space-y-3">
              <Badge variant="accent">建议先按“驾驶舱 → 工作区 → 分流决策”理解系统</Badge>
              <p className="text-sm leading-7 text-slate-400">
                如果你是第一次使用，先不要急着看细节页。先建立全局认知，再进入具体工作区，理解会更快。
              </p>
            </div>
            <nav className="flex flex-wrap gap-2">
              {SECTION_LINKS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                >
                  {section.label}
                </a>
              ))}
            </nav>
          </div>
        </Panel>

        <div
          id="quick-start"
          className="grid scroll-mt-28 gap-4 xl:grid-cols-2 2xl:grid-cols-4"
        >
          {QUICK_START_STEPS.map((step) => (
            <QuickStartCard key={step.step} {...step} />
          ))}
        </div>

        <div id="platform-modules" className="scroll-mt-28">
          <Panel
            eyebrow="平台模块"
            title="平台模块"
            aside={
              <div className="hidden sm:block">
                <Badge variant="outline">适合先建立全局视角</Badge>
              </div>
            }
          >
            <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
              {PLATFORM_MODULES.map((module) => (
                <GuideModuleCard key={module.title} {...module} />
              ))}
            </div>
          </Panel>
        </div>

        <div id="workspace-modules" className="scroll-mt-28">
          <Panel
            eyebrow="工作区模块"
            title="工作区模块"
            aside={
              <div className="hidden sm:block">
                <Badge variant="outline">用于推进单个项目主线</Badge>
              </div>
            }
          >
            <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
              {WORKSPACE_MODULES.map((module) => (
                <GuideModuleCard key={module.title} {...module} />
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div id="page-regions" className="scroll-mt-28">
            <Panel eyebrow="页面结构" title="页面结构说明">
              <div className="grid gap-4 md:grid-cols-2">
                {PAGE_REGIONS.map((region, idx) => (
                  <article
                    key={region.title}
                    className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5"
                  >
                    <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">
                      0{idx + 1}
                    </p>
                    <h3 className="mt-3 text-lg font-semibold text-white">
                      {region.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">
                      {region.summary}
                    </p>
                  </article>
                ))}
              </div>
            </Panel>
          </div>

          <div id="recommended-flows" className="scroll-mt-28">
            <Panel eyebrow="推荐路径" title="推荐使用路径">
              <div className="space-y-4">
                {RECOMMENDED_FLOWS.map((flow, idx) => (
                  <article
                    key={flow.title}
                    className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-sm font-semibold text-cyan-100">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          {flow.title}
                        </h3>
                        <p className="mt-1 text-xs text-cyan-200">{flow.path}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-400">
                      {flow.summary}
                    </p>
                  </article>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <Panel className="overflow-hidden">
          <div className="relative rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(99,102,241,0.12),rgba(168,85,247,0.12))] p-6 sm:p-7">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08]">
                    <Compass className="h-5 w-5 text-cyan-100" />
                  </div>
                  <Badge variant="aurora">建议从平台总览进入，不要直接跳细节页</Badge>
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight text-white">
                  如果只记一条，就记住这条主线
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  驾驶舱负责建立全局认知，工作区负责定位项目，分流决策负责选对链路，工作区模块负责推进与复盘。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/overview"
                  className={cn(
                    buttonVariants({ size: "default", variant: "secondary" }),
                    "px-5",
                  )}
                >
                  回到驾驶舱
                </Link>
                <Link
                  href="/route-decision"
                  className={cn(
                    buttonVariants({ size: "default", variant: "aurora" }),
                    "px-5",
                  )}
                >
                  打开分流决策
                </Link>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </ConsolePage>
  );
}
