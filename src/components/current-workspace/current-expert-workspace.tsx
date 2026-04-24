"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  History,
  PanelRightOpen,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { Card, CardEyebrow, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import type {
  CurrentExpertAction,
  CurrentExpertWorkspaceViewModel,
  FlowNodeViewModel,
  StageDrawerTabId,
} from "@/lib/view-models/current-workspace";
import { cn } from "@/lib/utils";

export type { CurrentExpertWorkspaceViewModel } from "@/lib/view-models/current-workspace";

type GateDecisionIntent = Extract<
  CurrentExpertAction["id"],
  "approve" | "reject" | "request-changes"
> | null;

const TAB_ITEMS: TabItem[] = [
  { id: "overview", label: "概览" },
  { id: "spec-assets", label: "规范资产" },
  { id: "gate-approval", label: "门禁审批" },
  { id: "timeline", label: "时间线" },
  { id: "queue-log", label: "队列日志" },
];

const NODE_STATUS_META: Record<
  FlowNodeViewModel["status"],
  {
    label: string;
    badgeClass: string;
    icon: ReactNode;
  }
> = {
  pending: {
    label: "待处理",
    badgeClass: "border-white/10 bg-white/[0.04] text-slate-300",
    icon: <CircleDashed className="h-4 w-4" />,
  },
  active: {
    label: "进行中",
    badgeClass: "status-done",
    icon: <Sparkles className="h-4 w-4" />,
  },
  "waiting-approval": {
    label: "待审批",
    badgeClass: "status-waiting-approval",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  blocked: {
    label: "阻塞",
    badgeClass: "status-blocked",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  done: {
    label: "已完成",
    badgeClass: "status-done",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  skipped: {
    label: "已跳过",
    badgeClass: "border-white/8 bg-white/[0.02] text-slate-500",
    icon: <History className="h-4 w-4" />,
  },
  failed: {
    label: "失败",
    badgeClass: "status-blocked",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
};

export function CurrentExpertWorkspace({
  viewModel,
  onAction,
}: {
  viewModel: CurrentExpertWorkspaceViewModel;
  onAction?: (action: CurrentExpertAction, node: FlowNodeViewModel | null) => void;
}) {
  const router = useRouter();
  const defaultNode = useMemo(
    () =>
      viewModel.flow.nodes.find((node) => node.id === viewModel.drawer.defaultNodeId) ??
      viewModel.flow.nodes[0] ??
      null,
    [viewModel.drawer.defaultNodeId, viewModel.flow.nodes],
  );
  const [selectedNode, setSelectedNode] = useState<FlowNodeViewModel | null>(
    defaultNode,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState<StageDrawerTabId>(viewModel.drawer.defaultTab);
  const [pendingDecision, setPendingDecision] = useState<GateDecisionIntent>(null);
  const [gateComment, setGateComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fallbackDrawerNode = useMemo<FlowNodeViewModel | null>(() => {
    if (defaultNode) return defaultNode;
    return {
      id: "node:workspace-assets",
      roleCode: "workspace-assets",
      roleNameZh: "规范资产总览",
      roleNameEn: "workspace-assets",
      required: false,
      optional: false,
      status: "pending",
      taskSummary: "当前工作区暂无活跃专家流程，可先查看已同步的规范资产与历史留痕。",
      gate: null,
      inputAssets: viewModel.workspaceAssets,
      outputAssets: viewModel.workspaceAssets,
      pendingAssets: [],
      timeline: [],
      queueLog: [],
    };
  }, [defaultNode, viewModel.workspaceAssets]);

  const openDrawer = (
    node: FlowNodeViewModel | null,
    nextTab: StageDrawerTabId = "overview",
    decision: GateDecisionIntent = null,
  ) => {
    setSelectedNode(node);
    setTab(nextTab);
    setPendingDecision(decision);
    setGateComment("");
    setDrawerOpen(true);
  };

  const runAction = (
    action: CurrentExpertAction,
    node = selectedNode ?? fallbackDrawerNode,
  ) => {
    if (action.id === "view-pending-assets") {
      openDrawer(node, "spec-assets", null);
      onAction?.(action, node);
      return;
    }

    if (
      action.id === "view-assets" ||
      action.id === "view-output" ||
      action.id === "view-archive"
    ) {
      openDrawer(node, "spec-assets", null);
      onAction?.(action, node);
      return;
    }

    if (
      action.id === "approve" ||
      action.id === "reject" ||
      action.id === "request-changes"
    ) {
      openDrawer(node, "gate-approval", action.id);
      onAction?.(action, node);
      return;
    }

    if (
      action.id === "view-logs" ||
      action.id === "view-error" ||
      action.id === "retry"
    ) {
      openDrawer(node, "queue-log", null);
      onAction?.(action, node);
      return;
    }

    if (action.id === "manual-intervene") {
      openDrawer(node, "overview", null);
      onAction?.(action, node);
      return;
    }

    openDrawer(node, "overview", null);
    onAction?.(action, node);
  };

  const submitGateAction = async () => {
    if (!selectedNode?.gate || !pendingDecision) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/workspaces/${encodeURIComponent(viewModel.workspaceId)}/runs/${encodeURIComponent(viewModel.flow.runId)}/gate/${encodeURIComponent(selectedNode.gate.id)}/${pendingDecision}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            comment: gateComment || undefined,
            requestedAssets:
              pendingDecision === "request-changes"
                ? selectedNode.pendingAssets.map((asset) => asset.sourcePath)
                : undefined,
          }),
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || `HTTP ${response.status}`);
      }

      setDrawerOpen(false);
      setPendingDecision(null);
      setGateComment("");
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "门禁审批提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <CurrentExpertHero viewModel={viewModel} onAction={runAction} />
        <DynamicExpertFlow
          nodes={viewModel.flow.nodes}
          currentRoleCode={viewModel.flow.currentRoleCode}
          flowName={viewModel.flow.flowName}
          onOpenNode={(node) =>
            openDrawer(
              node,
              node.gate ? "gate-approval" : node.pendingAssets.length > 0
                ? "spec-assets"
                : "overview",
            )
          }
        />
      </div>

      {drawerOpen && (selectedNode ?? fallbackDrawerNode) ? (
        <StageDrawer
          node={(selectedNode ?? fallbackDrawerNode)!}
          flowName={viewModel.flow.flowName}
          nextRole={viewModel.hero.nextRole}
          open={drawerOpen}
          userCanApprove={viewModel.userCanApprove}
          tab={tab}
          pendingDecision={pendingDecision}
          gateComment={gateComment}
          submitting={submitting}
          onClose={() => {
            setDrawerOpen(false);
            setPendingDecision(null);
            setGateComment("");
          }}
          onTabChange={(value) => setTab(value as StageDrawerTabId)}
          onSelectDecision={(decision) => setPendingDecision(decision)}
          onCommentChange={setGateComment}
          onSubmitDecision={submitGateAction}
        />
      ) : null}
    </>
  );
}

function CurrentExpertHero({
  viewModel,
  onAction,
}: {
  viewModel: CurrentExpertWorkspaceViewModel;
  onAction: (action: CurrentExpertAction) => void;
}) {
  return (
    <Card variant="strong" padding="lg" className="overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      <div className="pointer-events-none absolute -right-14 top-0 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-44 w-44 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="space-y-3">
            <CardEyebrow>开发者当前专家工作台</CardEyebrow>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                {viewModel.hero.title}
              </h1>
              <p className="font-mono text-sm uppercase tracking-[0.28em] text-cyan-200/85">
                {viewModel.hero.code}
              </p>
            </div>
            <p className="max-w-3xl text-base leading-8 text-slate-300">
              {viewModel.hero.summary}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-200/85">
              <MetaChip label="流程" value={viewModel.hero.flowName} />
              <MetaChip label="阶段" value={viewModel.hero.stageLabel} />
              <MetaChip label="运行态" value={viewModel.hero.runStatusLabel} />
              <MetaChip label="门禁" value={viewModel.hero.gateStatusLabel} />
              <MetaChip
                label="Registry"
                value={`${viewModel.registryInfo.source}${viewModel.registryInfo.version ? ` v${viewModel.registryInfo.version}` : ""}`}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <HeroMetric label="输入资产" value={String(viewModel.hero.assetSummary.input)} />
            <HeroMetric label="输出资产" value={String(viewModel.hero.assetSummary.output)} />
            <HeroMetric label="待审资产" value={String(viewModel.hero.assetSummary.pending)} />
            <HeroMetric label="历史资产" value={String(viewModel.hero.assetSummary.history)} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="theme-panel rounded-[28px] p-5">
            <div className="flex items-center gap-2 text-cyan-200">
              <PanelRightOpen className="h-4 w-4" />
              <p className="font-mono text-[11px] uppercase tracking-[0.28em]">
                当前任务
              </p>
            </div>
            <p className="mt-4 text-base leading-7 text-white">
              {viewModel.hero.taskSummary}
            </p>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <InfoRow
                label="下一专家"
                value={
                  viewModel.hero.nextRole
                    ? `${viewModel.hero.nextRole.nameZh} / ${viewModel.hero.nextRole.code}`
                    : "当前流程暂无下一专家"
                }
              />
              <InfoRow
                label="同步时间"
                value={viewModel.registryInfo.lastSyncedAt || "未同步"}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {viewModel.hero.actions.primary.map((action) => (
              <Button
                key={action.id}
                variant={action.id === "reject" ? "danger" : "aurora"}
                onClick={() => onAction(action)}
              >
                {action.label}
              </Button>
            ))}
            {viewModel.hero.actions.secondary.map((action) => (
              <Button
                key={action.id}
                variant="secondary"
                onClick={() => onAction(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function DynamicExpertFlow({
  nodes,
  currentRoleCode,
  flowName,
  onOpenNode,
}: {
  nodes: FlowNodeViewModel[];
  currentRoleCode: string | null;
  flowName: string;
  onOpenNode: (node: FlowNodeViewModel) => void;
}) {
  return (
    <Card padding="lg">
      <CardHeader className="items-end">
        <div>
          <CardEyebrow>DynamicExpertFlow</CardEyebrow>
          <CardTitle>{flowName}</CardTitle>
        </div>
        <p className="text-xs leading-6 text-slate-400">
          点击任意专家节点打开右侧抽屉查看职责、资产、审批和时间线。
        </p>
      </CardHeader>

      <div className="-mx-1 overflow-x-auto px-1 pb-2">
        <div className="flex min-w-max items-stretch gap-4">
          {nodes.map((node, index) => (
            <div key={node.id} className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => onOpenNode(node)}
                className={cn(
                  "theme-panel relative flex min-h-[196px] w-[248px] flex-col justify-between rounded-[28px] border px-5 py-5 text-left transition hover:border-white/25 hover:bg-white/[0.08]",
                  node.status === "waiting-approval" && "status-waiting-approval",
                  node.status === "blocked" && "status-blocked",
                  node.status === "done" && "status-done",
                  node.status === "failed" && "status-blocked",
                  node.optional && "border-dashed",
                  currentRoleCode === node.roleCode &&
                    "ring-glow shadow-[0_0_0_1px_rgba(34,211,238,0.18),0_20px_50px_-24px_rgba(34,211,238,0.5)]",
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {node.roleNameZh}
                      </p>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">
                        {node.roleNameEn}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]",
                        NODE_STATUS_META[node.status].badgeClass,
                      )}
                    >
                      {NODE_STATUS_META[node.status].icon}
                      {NODE_STATUS_META[node.status].label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Chip
                      tone={node.required ? "primary" : "muted"}
                      label={node.required ? "Required" : "Optional"}
                    />
                    {node.gate ? <Chip tone="warning" label={node.gate.gateType} /> : null}
                  </div>

                  <p className="line-clamp-4 text-sm leading-6 text-slate-200">
                    {node.taskSummary}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>输入 {node.inputAssets.length}</span>
                  <span>输出 {node.outputAssets.length}</span>
                  <span>待审 {node.pendingAssets.length}</span>
                </div>
              </button>

              {index < nodes.length - 1 ? (
                <div className="flex h-full items-center">
                  <div className="relative h-[2px] w-14 rounded-full bg-white/12">
                    <span className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-gradient-to-r from-cyan-300/60 to-transparent" />
                    <ArrowRight className="absolute -right-2 -top-[10px] h-6 w-6 text-white/35" />
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function StageDrawer({
  node,
  flowName,
  nextRole,
  userCanApprove,
  open,
  tab,
  pendingDecision,
  gateComment,
  submitting,
  onClose,
  onTabChange,
  onSelectDecision,
  onCommentChange,
  onSubmitDecision,
}: {
  node: FlowNodeViewModel;
  flowName: string;
  nextRole: { code: string; nameZh: string } | null;
  userCanApprove: boolean;
  open: boolean;
  tab: StageDrawerTabId;
  pendingDecision: GateDecisionIntent;
  gateComment: string;
  submitting: boolean;
  onClose: () => void;
  onTabChange: (value: string) => void;
  onSelectDecision: (decision: GateDecisionIntent) => void;
  onCommentChange: (value: string) => void;
  onSubmitDecision: () => void;
}) {
  if (!open) return null;

  const pendingActionLabel =
    pendingDecision === "approve"
      ? "确认批准通过"
      : pendingDecision === "reject"
        ? "确认驳回修改"
        : pendingDecision === "request-changes"
          ? "确认要求补充"
          : null;

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        className="flex h-full w-full max-w-[780px] flex-col border-l border-white/10 bg-[linear-gradient(180deg,rgba(8,15,25,0.98),rgba(13,21,34,0.98))] p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
              StageDrawer
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">阶段详情</h2>
            <p className="mt-2 text-sm text-slate-300">
              {node.roleNameZh} / {node.roleNameEn}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            关闭
          </Button>
        </div>

        <div className="mt-5">
          <Tabs items={TAB_ITEMS} value={tab} onChange={onTabChange} />
        </div>

        <div className="mt-5 flex-1 overflow-y-auto pr-1">
          {tab === "overview" ? (
            <DrawerSection title="阶段概览">
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoCard label="流程" value={flowName} />
                  <InfoCard
                    label="状态"
                    value={NODE_STATUS_META[node.status].label}
                  />
                  <InfoCard
                    label="下一步"
                    value={
                      nextRole
                        ? `${nextRole.nameZh} / ${nextRole.code}`
                        : "当前阶段已接近收尾"
                    }
                  />
                  <InfoCard
                    label="风险"
                    value={
                      node.gate?.reason ||
                      (node.status === "failed"
                        ? "当前阶段执行失败，需要优先排查。"
                        : "未发现额外阻塞风险。")
                    }
                  />
                </div>

                <div>
                  <SectionTitle>当前任务</SectionTitle>
                  <p className="mt-2 text-sm leading-7 text-slate-200">
                    {node.taskSummary}
                  </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <AssetGroup title="输入资产" assets={node.inputAssets} emptyText="暂无输入资产" />
                  <AssetGroup title="输出资产" assets={node.outputAssets} emptyText="暂无输出资产" />
                </div>
              </div>
            </DrawerSection>
          ) : null}

          {tab === "spec-assets" ? (
            <DrawerSection title="规范资产">
              <div className="space-y-5">
                <AssetGroup title="待审资产" assets={node.pendingAssets} emptyText="当前阶段没有待审资产" />
                <AssetGroup title="输入资产" assets={node.inputAssets} emptyText="暂无输入资产" />
                <AssetGroup title="输出资产" assets={node.outputAssets} emptyText="暂无输出资产" />
              </div>
            </DrawerSection>
          ) : null}

          {tab === "gate-approval" ? (
            <DrawerSection title="门禁审批">
              {node.gate ? (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoCard label="门禁类型" value={node.gate.gateType} />
                    <InfoCard label="模式" value={node.gate.mode} />
                    <InfoCard
                      label="当前状态"
                      value={NODE_STATUS_META[node.status].label}
                    />
                    <InfoCard label="审批原因" value={node.gate.reason || "—"} />
                    <InfoCard
                      label="放行目标"
                      value={
                        nextRole
                          ? `${nextRole.nameZh} / ${nextRole.code}`
                          : "当前阶段后无下一专家"
                      }
                    />
                  </div>

                  <AssetGroup
                    title="所需资产"
                    assets={node.pendingAssets}
                    emptyText="当前门禁没有指定所需资产"
                  />

                  {userCanApprove ? (
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                      <SectionTitle>审批动作</SectionTitle>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <Button
                          size="sm"
                          variant="aurora"
                          onClick={() => onSelectDecision("approve")}
                        >
                          批准通过
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => onSelectDecision("reject")}
                        >
                          驳回修改
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onSelectDecision("request-changes")}
                        >
                          要求补充
                        </Button>
                      </div>

                      {pendingDecision ? (
                        <div className="mt-4 space-y-3">
                          <label className="block text-sm font-medium text-slate-200">
                            审批备注
                            <textarea
                              aria-label="审批备注"
                              value={gateComment}
                              onChange={(event) => onCommentChange(event.target.value)}
                              rows={4}
                              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
                              placeholder={
                                pendingDecision === "approve"
                                  ? "填写审批说明与放行理由"
                                  : pendingDecision === "reject"
                                    ? "填写驳回原因"
                                    : "填写补充要求与待补资产"
                              }
                            />
                          </label>
                          <Button
                            variant={
                              pendingDecision === "approve" ? "aurora" : pendingDecision === "reject" ? "danger" : "secondary"
                            }
                            disabled={submitting}
                            onClick={onSubmitDecision}
                          >
                            {submitting ? "提交中…" : pendingActionLabel}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {node.timeline.length > 0 ? (
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                      <SectionTitle>最近审批与阶段事件</SectionTitle>
                      <div className="mt-3 space-y-2">
                        {node.timeline.slice(0, 4).map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {item.title}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {item.type}
                                </p>
                              </div>
                              <p className="text-xs text-slate-500">
                                {new Date(item.createdAt).toLocaleString("zh-CN")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-slate-400">当前阶段没有待处理门禁。</p>
              )}
            </DrawerSection>
          ) : null}

          {tab === "timeline" ? (
            <DrawerSection title="时间线">
              {node.timeline.length === 0 ? (
                <p className="text-sm text-slate-400">暂无时间线事件。</p>
              ) : (
                <ol className="space-y-3">
                  {node.timeline.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-400">{item.type}</p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleString("zh-CN")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </DrawerSection>
          ) : null}

          {tab === "queue-log" ? (
            <DrawerSection title="队列日志">
              {node.queueLog.length === 0 ? (
                <p className="text-sm text-slate-400">暂无队列与日志。</p>
              ) : (
                <ol className="space-y-3">
                  {node.queueLog.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{item.message}</p>
                          <p className="mt-1 text-xs text-slate-400">{item.type}</p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleString("zh-CN")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </DrawerSection>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
      {label} · {value}
    </span>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Chip({ label, tone }: { label: string; tone: "primary" | "warning" | "muted" }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]",
        tone === "primary" && "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
        tone === "warning" && "status-waiting-approval",
        tone === "muted" && "border-white/10 bg-white/[0.04] text-slate-300",
      )}
    >
      {label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
        {label}
      </span>
      <span className="text-right text-sm text-white">{value}</span>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-white">{value}</p>
    </div>
  );
}

function DrawerSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-5">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-cyan-200/80">
      {children}
    </p>
  );
}

function AssetGroup({
  title,
  assets,
  emptyText,
}: {
  title: string;
  assets: FlowNodeViewModel["outputAssets"];
  emptyText: string;
}) {
  const openspecAssets = assets.filter((asset) => asset.sourceKind === "openspec");
  const historyAssets = assets.filter((asset) => asset.sourceKind === "ai-spec-history");

  return (
    <div className="space-y-3 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
      <SectionTitle>{title}</SectionTitle>
      {assets.length === 0 ? (
        <p className="text-sm text-slate-400">{emptyText}</p>
      ) : (
        <div className="space-y-4">
          <AssetSourceBlock title="OpenSpec" assets={openspecAssets} />
          <AssetSourceBlock title="历史资产" assets={historyAssets} />
        </div>
      )}
    </div>
  );
}

function AssetSourceBlock({
  title,
  assets,
}: {
  title: string;
  assets: FlowNodeViewModel["outputAssets"];
}) {
  if (assets.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="min-w-0 rounded-2xl border border-white/8 bg-black/20 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {asset.title || asset.assetType}
                </p>
                <p className="mt-1 break-all font-mono text-[11px] leading-6 text-slate-400">
                  {asset.sourcePath}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                {asset.assetType}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
