import { summarizeSpecAssets, type SpecAssetRecord, type SpecAssetSummary } from "@/lib/spec-assets";

export type FlowNodeStatus =
  | "pending"
  | "active"
  | "waiting-approval"
  | "blocked"
  | "done"
  | "skipped"
  | "failed";

export type StageDrawerTabId =
  | "overview"
  | "spec-assets"
  | "gate-approval"
  | "timeline"
  | "queue-log";

export type RegistrySourceKind =
  | "hub-sync"
  | "local-fallback"
  | "seed"
  | "missing";

export interface RegistryProvenanceInfo {
  source: RegistrySourceKind;
  version: number | null;
  lastSyncedAt: string | null;
}

export interface CurrentWorkspaceRoleSource {
  slug: string;
  nameZh: string;
  nameEn?: string | null;
}

export interface CurrentWorkspaceFlowTemplateSource {
  slug: string;
  name: string;
  requiredRoles: string[];
  optionalRoles: string[];
}

export interface CurrentWorkspaceGateSource {
  id: string;
  gateType: string;
  status: string;
  mode: string;
  resolution: string | null;
  comment: string | null;
  reason: string | null;
  requiredAssets: SpecAssetRecord[];
}

export interface CurrentWorkspaceTimelineItem {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  payload?: Record<string, unknown> | null;
  nodeId?: string | null;
}

export interface CurrentWorkspaceQueueItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  level?: "info" | "warning" | "error";
}

export interface CurrentWorkspaceSource {
  workspace: {
    id: string;
    slug: string;
    name: string;
    rootPath: string | null;
  };
  activeRun: {
    runId: string;
    status: string;
    lastEventType: string;
    lastOccurredAt: string;
    payload: Record<string, unknown>;
  } | null;
  flowTemplate: CurrentWorkspaceFlowTemplateSource | null;
  roles: CurrentWorkspaceRoleSource[];
  gate: CurrentWorkspaceGateSource | null;
  specAssets: SpecAssetRecord[];
  timeline: CurrentWorkspaceTimelineItem[];
  queueLog: CurrentWorkspaceQueueItem[];
  userCanApprove: boolean;
  registryInfo: RegistryProvenanceInfo;
}

export interface CurrentExpertAction {
  id:
    | "approve"
    | "reject"
    | "view-pending-assets"
    | "request-changes"
    | "view-stage"
    | "view-assets"
    | "view-output"
    | "view-archive"
    | "view-error"
    | "view-logs"
    | "continue"
    | "manual-intervene"
    | "retry";
  label: string;
}

export interface CurrentExpertActions {
  primary: CurrentExpertAction[];
  secondary: CurrentExpertAction[];
}

export interface FlowNodeViewModel {
  id: string;
  roleCode: string;
  roleNameZh: string;
  roleNameEn: string;
  required: boolean;
  optional: boolean;
  status: FlowNodeStatus;
  taskSummary: string;
  gate: CurrentWorkspaceGateSource | null;
  inputAssets: SpecAssetRecord[];
  outputAssets: SpecAssetRecord[];
  pendingAssets: SpecAssetRecord[];
  timeline: CurrentWorkspaceTimelineItem[];
  queueLog: CurrentWorkspaceQueueItem[];
}

export interface FlowInstanceViewModel {
  id: string;
  flowCode: string;
  flowName: string;
  runId: string;
  status: string;
  currentRoleCode: string | null;
  nodes: FlowNodeViewModel[];
}

export interface CurrentExpertWorkspaceViewModel {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  userCanApprove: boolean;
  registryInfo: RegistryProvenanceInfo;
  workspaceAssets: SpecAssetRecord[];
  hero: {
    title: string;
    code: string;
    summary: string;
    flowName: string;
    stageLabel: string;
    runStatusLabel: string;
    gateStatusLabel: string;
    taskSummary: string;
    nextRole: {
      code: string;
      nameZh: string;
    } | null;
    assetSummary: SpecAssetSummary & {
      input: number;
      output: number;
      pending: number;
    };
    actions: CurrentExpertActions;
  };
  flow: FlowInstanceViewModel;
  drawer: {
    defaultNodeId: string | null;
    defaultTab: StageDrawerTabId;
  };
}

const TERMINAL_STATUSES = new Set(["success", "completed", "cancelled", "canceled", "failed"]);

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item))
    : [];
}

function prettifyRunStatus(status: string) {
  switch (status) {
    case "waiting-approval":
      return "等待门禁审批";
    case "failed":
      return "执行失败";
    case "success":
    case "completed":
      return "已完成";
    case "blocked":
      return "已阻塞";
    default:
      return "执行中";
  }
}

function prettifyGateLabel(gateType: string | null) {
  switch (gateType) {
    case "before-implementation":
      return "实现前门禁";
    case "before-guardian":
      return "守护前门禁";
    case "before-archive":
      return "归档前门禁";
    case "stage":
      return "阶段门禁";
    case "artifact":
      return "资产门禁";
    case "manual":
      return "人工门禁";
    default:
      return "none";
  }
}

function deriveStageLabel(runStatus: string, gate: CurrentWorkspaceGateSource | null) {
  if (gate?.status === "waiting-approval") {
    return `等待${prettifyGateLabel(gate.gateType)}`;
  }
  if (gate?.status === "rejected") {
    return `已卡在${prettifyGateLabel(gate.gateType)}`;
  }
  switch (runStatus) {
    case "failed":
      return "当前运行失败";
    case "blocked":
      return "当前阶段阻塞";
    case "success":
    case "completed":
      return "当前阶段完成";
    default:
      return "当前阶段执行中";
  }
}

function buildRoleNameMap(roles: CurrentWorkspaceRoleSource[]) {
  return new Map(
    roles.map((role) => [
      role.slug,
      {
        zh: role.nameZh || role.slug,
        en: role.nameEn || role.slug,
      },
    ]),
  );
}

function getVisitedRoles(events: unknown[]) {
  const visited = new Set<string>();
  for (const rawEvent of events) {
    const event = asRecord(rawEvent);
    const fromRole = asString(event.from_role);
    const toRole = asString(event.to_role);
    if (fromRole) visited.add(fromRole);
    if (toRole) visited.add(toRole);
  }
  return visited;
}

function deriveNodeStatus(input: {
  roleCode: string;
  currentRoleCode: string | null;
  visitedRoles: Set<string>;
  activeRunStatus: string;
  gate: CurrentWorkspaceGateSource | null;
  optional: boolean;
}): FlowNodeStatus {
  if (input.currentRoleCode === input.roleCode) {
    if (input.activeRunStatus === "failed") return "failed";
    if (input.gate?.status === "rejected") return "blocked";
    if (
      input.activeRunStatus === "waiting-approval" ||
      input.gate?.status === "waiting-approval"
    ) {
      return "waiting-approval";
    }
    return "active";
  }

  if (input.visitedRoles.has(input.roleCode)) {
    return "done";
  }

  if (input.optional) {
    return "skipped";
  }

  if (input.activeRunStatus === "failed" && input.visitedRoles.size > 0) {
    return "blocked";
  }

  return "pending";
}

export function deriveHeroActions(input: {
  runStatus: string;
  gateStatus: string | null;
  userCanApprove: boolean;
}): CurrentExpertActions {
  if (input.gateStatus === "waiting-approval") {
    return {
      primary: input.userCanApprove
        ? [
            { id: "approve", label: "批准通过" },
            { id: "reject", label: "驳回修改" },
          ]
        : [{ id: "view-stage", label: "查看当前阶段" }],
      secondary: [
        { id: "view-pending-assets", label: "查看待审资产" },
        ...(input.userCanApprove
          ? [{ id: "request-changes", label: "要求补充" } satisfies CurrentExpertAction]
          : []),
      ],
    };
  }

  if (input.gateStatus === "rejected" || input.runStatus === "blocked") {
    return {
      primary: [{ id: "view-stage", label: "查看阻塞原因" }],
      secondary: [
        { id: "manual-intervene", label: "人工介入" },
        { id: "view-logs", label: "查看日志" },
        { id: "view-assets", label: "查看规范资产" },
      ],
    };
  }

  if (input.runStatus === "failed") {
    return {
      primary: [{ id: "view-error", label: "查看失败原因" }],
      secondary: [
        { id: "retry", label: "重试" },
        { id: "manual-intervene", label: "人工介入" },
      ],
    };
  }

  if (TERMINAL_STATUSES.has(input.runStatus)) {
    return {
      primary: [{ id: "view-output", label: "查看产物" }],
      secondary: [{ id: "view-archive", label: "查看归档" }],
    };
  }

  return {
    primary: [{ id: "continue", label: "继续执行" }],
    secondary: [
      { id: "view-assets", label: "查看规范资产" },
      { id: "manual-intervene", label: "人工介入" },
    ],
  };
}

const ROLE_INPUT_ASSET_TYPES: Record<string, SpecAssetRecord["assetType"][]> = {
  "requirement-analyst": [],
  "frontend-implementer": ["proposal", "spec", "design", "tasks"],
  "code-guardian": ["proposal", "spec", "design", "tasks"],
  "archive-change": ["proposal", "spec", "design", "tasks", "checklist", "iterations"],
};

const ROLE_OUTPUT_ASSET_TYPES: Record<string, SpecAssetRecord["assetType"][]> = {
  "requirement-analyst": ["proposal", "spec", "design", "tasks"],
  "frontend-implementer": ["implementation-notes", "bugfix", "other"],
  "code-guardian": ["checklist", "iterations"],
  "archive-change": ["archive"],
};

function partitionNodeAssets(input: {
  roleCode: string;
  specAssets: SpecAssetRecord[];
  changeId: string | null;
  runId: string;
  pendingAssets: SpecAssetRecord[];
}) {
  const roleAssets = input.specAssets.filter(
    (asset) =>
      asset.runId === input.runId ||
      asset.changeId === input.changeId ||
      (!asset.runId && !asset.changeId),
  );
  const inputTypes =
    ROLE_INPUT_ASSET_TYPES[input.roleCode] ??
    ["proposal", "spec", "design", "tasks"];
  const outputTypes = ROLE_OUTPUT_ASSET_TYPES[input.roleCode] ?? [];

  return {
    inputAssets: roleAssets.filter((asset) => inputTypes.includes(asset.assetType)),
    outputAssets: roleAssets.filter((asset) => outputTypes.includes(asset.assetType)),
    pendingAssets: input.pendingAssets,
  };
}

function deriveDefaultTab(gate: CurrentWorkspaceGateSource | null, runStatus: string) {
  if (gate?.status === "waiting-approval") return "gate-approval" satisfies StageDrawerTabId;
  if (runStatus === "failed" || gate?.status === "rejected") {
    return "queue-log" satisfies StageDrawerTabId;
  }
  return "overview" satisfies StageDrawerTabId;
}

export function buildCurrentWorkspaceVm(
  source: CurrentWorkspaceSource,
): CurrentExpertWorkspaceViewModel {
  const emptyFlow: FlowInstanceViewModel = {
    id: "flow-empty",
    flowCode: "no-flow",
    flowName: "暂无活跃流程",
    runId: "no-run",
    status: "idle",
    currentRoleCode: null,
    nodes: [],
  };

  if (!source.activeRun || !source.flowTemplate) {
    return {
      workspaceId: source.workspace.id,
      workspaceName: source.workspace.name,
      workspaceSlug: source.workspace.slug,
      userCanApprove: source.userCanApprove,
      registryInfo: source.registryInfo,
      workspaceAssets: source.specAssets,
      hero: {
        title: "暂无活跃专家",
        code: "idle",
        summary: "当前工作区暂无运行中的专家流程",
        flowName: "暂无流程",
        stageLabel: "空闲",
        runStatusLabel: "空闲",
        gateStatusLabel: "none",
        taskSummary: "等待新的运行进入工作台。",
        nextRole: null,
        assetSummary: {
          ...summarizeSpecAssets(source.specAssets),
          input: 0,
          output: 0,
          pending: 0,
        },
        actions: {
          primary: [{ id: "view-assets", label: "查看规范资产" }],
          secondary: [],
        },
      },
      flow: emptyFlow,
      drawer: {
        defaultNodeId: null,
        defaultTab: "overview",
      },
    };
  }

  const payload = asRecord(source.activeRun.payload);
  const flow = asRecord(payload.flow);
  const task = asRecord(payload.task);
  const events = Array.isArray(payload.events) ? payload.events : [];
  const currentRoleCode = asString(payload.current_role) || null;
  const roleNameMap = buildRoleNameMap(source.roles);
  const visitedRoles = getVisitedRoles(events);
  const taskSummary =
    asString(task.summary) ||
    asString(task.description) ||
    asString(payload.summary) ||
    "等待当前阶段继续推进";

  const summaryAssets = summarizeSpecAssets(source.specAssets);
  const activeRunId = source.activeRun.runId;
  const defaultNodeId = currentRoleCode
    ? `node:${currentRoleCode}`
    : source.flowTemplate.requiredRoles[0]
      ? `node:${source.flowTemplate.requiredRoles[0]}`
      : null;

  const nodes: FlowNodeViewModel[] = [
    ...source.flowTemplate.requiredRoles.map((roleCode) => ({
      roleCode,
      required: true,
      optional: false,
    })),
    ...source.flowTemplate.optionalRoles.map((roleCode) => ({
      roleCode,
      required: false,
      optional: true,
    })),
  ].map(({ roleCode, required, optional }) => {
    const names = roleNameMap.get(roleCode) ?? {
      zh: roleCode,
      en: roleCode,
    };
    const status = deriveNodeStatus({
      roleCode,
      currentRoleCode,
      visitedRoles,
      activeRunStatus: source.activeRun?.status ?? "idle",
      gate: currentRoleCode === roleCode ? source.gate : null,
      optional,
    });
    const pendingAssets =
      currentRoleCode === roleCode ? source.gate?.requiredAssets ?? [] : [];
    const assetGroups = partitionNodeAssets({
      roleCode,
      specAssets: source.specAssets,
      changeId: asString(task.change_id) || null,
      runId: activeRunId,
      pendingAssets,
    });
    return {
      id: `node:${roleCode}`,
      roleCode,
      roleNameZh: names.zh,
      roleNameEn: names.en,
      required,
      optional,
      status,
      taskSummary:
        currentRoleCode === roleCode ? taskSummary : `${names.zh} 阶段待命`,
      gate: currentRoleCode === roleCode ? source.gate : null,
      inputAssets: assetGroups.inputAssets,
      outputAssets: assetGroups.outputAssets,
      pendingAssets: assetGroups.pendingAssets,
      timeline: source.timeline.filter(
        (item) => item.nodeId === `node:${roleCode}` || !item.nodeId,
      ),
      queueLog: source.queueLog,
    };
  });

  const currentRoleNames = currentRoleCode
    ? roleNameMap.get(currentRoleCode) ?? {
        zh: currentRoleCode,
        en: currentRoleCode,
      }
    : {
        zh: "当前专家",
        en: "current-expert",
      };
  const currentNode =
    nodes.find((node) => node.roleCode === currentRoleCode) ?? nodes[0] ?? null;
  const currentNodeIndex = currentNode
    ? nodes.findIndex((node) => node.id === currentNode.id)
    : -1;
  const nextNode =
    currentNodeIndex >= 0
      ? nodes
          .slice(currentNodeIndex + 1)
          .find((node) =>
            ["pending", "active", "waiting-approval", "blocked"].includes(
              node.status,
            ),
          ) ?? null
      : null;

  return {
    workspaceId: source.workspace.id,
    workspaceName: source.workspace.name,
    workspaceSlug: source.workspace.slug,
    userCanApprove: source.userCanApprove,
    registryInfo: source.registryInfo,
    workspaceAssets: source.specAssets,
    hero: {
      title: currentRoleNames.zh,
      code: currentRoleNames.en,
      summary: `${asString(flow.name, source.flowTemplate.name)} / 当前任务：${taskSummary}`,
      flowName: asString(flow.name, source.flowTemplate.name),
      stageLabel: deriveStageLabel(source.activeRun.status, source.gate),
      runStatusLabel: prettifyRunStatus(source.activeRun.status),
      gateStatusLabel: prettifyGateLabel(source.gate?.gateType ?? null),
      taskSummary,
      nextRole: nextNode
        ? {
            code: nextNode.roleCode,
            nameZh: nextNode.roleNameZh,
          }
        : null,
      assetSummary: {
        ...summaryAssets,
        input: currentNode?.inputAssets.length ?? 0,
        output: currentNode?.outputAssets.length ?? 0,
        pending: currentNode?.pendingAssets.length ?? 0,
      },
      actions: deriveHeroActions({
        runStatus: source.activeRun.status,
        gateStatus: source.gate?.status ?? null,
        userCanApprove: source.userCanApprove,
      }),
    },
    flow: {
      id: `flow:${source.activeRun.runId}`,
      flowCode: source.flowTemplate.slug,
      flowName: source.flowTemplate.name,
      runId: source.activeRun.runId,
      status: source.activeRun.status,
      currentRoleCode,
      nodes,
    },
    drawer: {
      defaultNodeId,
      defaultTab: deriveDefaultTab(source.gate, source.activeRun.status),
    },
  };
}

function mapDbFlowTemplate(
  item: {
    slug: string;
    name: string;
    payload: unknown;
  },
): CurrentWorkspaceFlowTemplateSource {
  const payload = asRecord(item.payload);
  return {
    slug: item.slug,
    name: item.name,
    requiredRoles: asStringArray(payload.required_roles),
    optionalRoles: asStringArray(payload.optional_roles),
  };
}

function mapDbRole(
  item: {
    slug: string;
    name: string;
    payload: unknown;
  },
): CurrentWorkspaceRoleSource {
  const payload = asRecord(item.payload);
  return {
    slug: item.slug,
    nameZh: item.name || asString(payload.name) || item.slug,
    nameEn: asString(payload.code) || item.slug,
  };
}

async function loadRegistryFallback(rootPath: string | null) {
  if (!rootPath) {
    return {
      flowTemplates: [] as CurrentWorkspaceFlowTemplateSource[],
      roles: [] as CurrentWorkspaceRoleSource[],
    };
  }

  try {
    const [{ readFile }, { parseRegistryFile }, pathModule] = await Promise.all([
      import("node:fs/promises"),
      import("@/lib/ingest/registry"),
      import("node:path"),
    ]);

    const flowPath = pathModule.resolve(rootPath, ".agents/registry/flows.json");
    const rolePath = pathModule.resolve(rootPath, ".agents/registry/roles.json");

    const [flowContent, roleContent] = await Promise.all([
      readFile(flowPath, "utf8").catch(() => null),
      readFile(rolePath, "utf8").catch(() => null),
    ]);

    const flowTemplates =
      flowContent
        ? parseRegistryFile({
            filePath: ".agents/registry/flows.json",
            content: flowContent,
          }).items
            .filter((item) => item.category === "flow")
            .map((item) =>
              mapDbFlowTemplate({
                slug: item.slug,
                name: item.name,
                payload: item.payload,
              }),
            )
        : [];

    const roles =
      roleContent
        ? parseRegistryFile({
            filePath: ".agents/registry/roles.json",
            content: roleContent,
          }).items
            .filter((item) => item.category === "role")
            .map((item) =>
              mapDbRole({
                slug: item.slug,
                name: item.name,
                payload: item.payload,
              }),
            )
        : [];

    return { flowTemplates, roles };
  } catch {
    return {
      flowTemplates: [] as CurrentWorkspaceFlowTemplateSource[],
      roles: [] as CurrentWorkspaceRoleSource[],
    };
  }
}

function deriveRegistryInfo(input: {
  dbRegistryItems: Array<{ version: number; updatedAt: Date }>;
  registryRawEventCount: number;
  fallbackAvailable: boolean;
}): RegistryProvenanceInfo {
  if (input.dbRegistryItems.length > 0) {
    return {
      source: input.registryRawEventCount > 0 ? "hub-sync" : "seed",
      version: Math.max(...input.dbRegistryItems.map((item) => item.version)),
      lastSyncedAt: input.dbRegistryItems
        .map((item) => item.updatedAt)
        .sort((left, right) => right.getTime() - left.getTime())[0]
        ?.toISOString() ?? null,
    };
  }

  if (input.fallbackAvailable) {
    return {
      source: "local-fallback",
      version: null,
      lastSyncedAt: null,
    };
  }

  return {
    source: "missing",
    version: null,
    lastSyncedAt: null,
  };
}

function mapRequiredAssets(
  value: unknown,
  specAssets: SpecAssetRecord[],
): SpecAssetRecord[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry, index) => {
    if (typeof entry === "string") {
      const hit = specAssets.find((asset) => asset.sourcePath === entry);
      return (
        hit ?? {
          id: `required-${index}`,
          sourceKind: entry.startsWith(".ai-spec/history/")
            ? "ai-spec-history"
            : "openspec",
          sourcePath: entry,
          assetType: "other",
          status: "reviewing",
          title: entry.split("/").pop() ?? entry,
        }
      );
    }

    const record = asRecord(entry);
    const sourcePath = asString(record.sourcePath);
    if (!sourcePath) return [];

    const hit = specAssets.find((asset) => asset.sourcePath === sourcePath);
    return (
      hit ?? {
        id: `required-${index}`,
        sourceKind:
          asString(record.sourceKind) === "ai-spec-history"
            ? "ai-spec-history"
            : "openspec",
        sourcePath,
        assetType: (asString(record.assetType) as SpecAssetRecord["assetType"]) || "other",
        status: "reviewing",
        title: asString(record.title) || sourcePath.split("/").pop() || sourcePath,
      }
    );
  });
}

async function ensureGateApprovalRecord(input: {
  workspaceId: string;
  runId: string;
  runStatus: string;
  payload: Record<string, unknown>;
  specAssets: SpecAssetRecord[];
}) {
  const [{ prisma }, { buildDraftGateApproval }] = await Promise.all([
    import("@/lib/db/prisma"),
    import("@/server/gate-approval"),
  ]);

  const pendingGate = asString(input.payload.pending_gate) || null;
  const currentRoleCode = asString(input.payload.current_role) || null;
  const gateContext = asRecord(input.payload.gate_context);
  const nodeId = currentRoleCode ? `node:${currentRoleCode}` : "";

  const existing = await prisma.gateApproval.findFirst({
    where: {
      workspaceId: input.workspaceId,
      runId: input.runId,
      ...(pendingGate
        ? {
            OR: [{ gateType: pendingGate }, { status: "waiting-approval" }],
          }
        : undefined),
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    return {
      id: existing.id,
      gateType: existing.gateType,
      status: existing.status,
      mode: existing.mode,
      resolution: existing.resolution,
      comment: existing.comment,
      reason: existing.reason,
      requiredAssets: mapRequiredAssets(existing.requiredAssetsJson, input.specAssets),
    } satisfies CurrentWorkspaceGateSource;
  }

  if (!pendingGate || input.runStatus !== "waiting-approval") {
    return null;
  }

  const created = await prisma.gateApproval.create({
    data: buildDraftGateApproval({
      workspaceId: input.workspaceId,
      runId: input.runId,
      nodeId,
      roleCode: currentRoleCode || pendingGate,
      gateType: pendingGate,
      reason:
        asString(gateContext.blocked_reason) ||
        asString(gateContext.required_user_action) ||
        "等待 Visual 门禁审批",
      requiredAssets: input.specAssets
        .filter((asset) => asset.status === "reviewing")
        .map((asset) => asset.sourcePath),
    }),
  });

  return {
    id: created.id,
    gateType: created.gateType,
    status: created.status,
    mode: created.mode,
    resolution: created.resolution,
    comment: created.comment,
    reason: created.reason,
    requiredAssets: mapRequiredAssets(created.requiredAssetsJson, input.specAssets),
  } satisfies CurrentWorkspaceGateSource;
}

function mapSpecAssetRecord(
  asset: Record<string, unknown>,
): SpecAssetRecord {
  return {
    id: asString(asset.id),
    sourceKind:
      asString(asset.sourceKind) === "ai-spec-history"
        ? "ai-spec-history"
        : "openspec",
    sourcePath: asString(asset.sourcePath),
    assetType: (asString(asset.assetType) as SpecAssetRecord["assetType"]) || "other",
    status: (asString(asset.status) as SpecAssetRecord["status"]) || "active",
    title: asString(asset.title) || null,
    workspaceId: asString(asset.workspaceId) || null,
    runId: asString(asset.runId) || null,
    changeId: asString(asset.changeId) || null,
    roleCode: asString(asset.roleCode) || null,
    updatedAt: asString(asset.updatedAt) || null,
  };
}

export async function getCurrentWorkspaceViewModel(input: {
  workspace: {
    id: string;
    slug: string;
    name: string;
    rootPath: string | null;
  };
  userCanApprove: boolean;
}) {
  const [{ prisma }, { syncWorkspaceSpecAssets }] = await Promise.all([
    import("@/lib/db/prisma"),
    import("@/lib/spec-assets"),
  ]);

  const [activeRun, latestRun, dbRegistryItems, registryRawEventCount, syncedAssets] = await Promise.all([
    prisma.runState.findFirst({
      where: {
        workspaceId: input.workspace.id,
        status: {
          notIn: ["completed", "success", "cancelled", "canceled"],
        },
      },
      orderBy: { lastOccurredAt: "desc" },
    }),
    prisma.runState.findFirst({
      where: { workspaceId: input.workspace.id },
      orderBy: { lastOccurredAt: "desc" },
    }),
    prisma.registryItem.findMany({
      where: {
        workspaceId: input.workspace.id,
        category: { in: ["flow", "role"] },
      },
      orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.rawIngestEvent.count({
      where: {
        workspaceId: input.workspace.id,
        sourceType: "registry-json",
      },
    }),
    syncWorkspaceSpecAssets({
      workspaceId: input.workspace.id,
      rootPath: input.workspace.rootPath,
    }),
  ]);

  const run = activeRun ?? latestRun;
  const dbFlowTemplates = dbRegistryItems
    .filter((item) => item.category === "flow")
    .map((item) =>
      mapDbFlowTemplate({
        slug: item.slug,
        name: item.name,
        payload: item.payload,
      }),
    );
  const dbRoles = dbRegistryItems
    .filter((item) => item.category === "role")
    .map((item) =>
      mapDbRole({
        slug: item.slug,
        name: item.name,
        payload: item.payload,
      }),
    );
  const fallback = await loadRegistryFallback(input.workspace.rootPath);
  const flowTemplates = dbFlowTemplates.length > 0 ? dbFlowTemplates : fallback.flowTemplates;
  const roles = dbRoles.length > 0 ? dbRoles : fallback.roles;
  const registryInfo = deriveRegistryInfo({
    dbRegistryItems,
    registryRawEventCount,
    fallbackAvailable: flowTemplates.length > 0 || roles.length > 0,
  });
  const specAssets = syncedAssets.map((asset) =>
    mapSpecAssetRecord(asset as unknown as Record<string, unknown>),
  );

  const activePayload = asRecord(run?.payload);
  const flowId = asString(asRecord(activePayload.flow).id);
  const currentRoleCode = asString(activePayload.current_role) || null;
  const flowTemplate =
    flowTemplates.find((item) => item.slug === flowId) ?? flowTemplates[0] ?? null;

  const [timelineRows, runEvents, gate] = run
    ? await Promise.all([
        prisma.timelineEvent.findMany({
          where: {
            workspaceId: input.workspace.id,
            runId: run.runKey,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        prisma.runEvent.findMany({
          where: {
            workspaceId: input.workspace.id,
            runKey: run.runKey,
          },
          orderBy: { occurredAt: "desc" },
          take: 50,
        }),
        ensureGateApprovalRecord({
          workspaceId: input.workspace.id,
          runId: run.runKey,
          runStatus: run.status ?? "running",
          payload: activePayload,
          specAssets,
        }),
      ])
    : [[], [], null];

  return buildCurrentWorkspaceVm({
    workspace: input.workspace,
    activeRun: run
      ? {
          runId: run.runKey,
          status: run.status ?? "running",
          lastEventType: run.lastEventType,
          lastOccurredAt: run.lastOccurredAt.toISOString(),
          payload: activePayload,
        }
      : null,
    flowTemplate,
    roles,
    gate,
    specAssets,
    timeline: [
      ...timelineRows.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        createdAt: row.createdAt.toISOString(),
        payload: asRecord(row.payload),
        nodeId: row.nodeId,
      })),
      ...runEvents.map((event) => ({
        id: event.id,
        type: event.eventType,
        title: event.eventType,
        createdAt: event.occurredAt.toISOString(),
        payload: asRecord(event.payload),
        nodeId:
          currentRoleCode && event.eventType.includes("gate")
            ? `node:${currentRoleCode}`
            : null,
      })),
    ].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    ),
    queueLog: runEvents
      .filter(
        (event) =>
          /control|receipt|error|failed|blocked|gate/iu.test(event.eventType) ||
          event.eventType === run?.lastEventType,
      )
      .map((event) => ({
        id: event.id,
        type: event.eventType,
        message: event.eventType,
        createdAt: event.occurredAt.toISOString(),
        level: /error|failed|blocked/iu.test(event.eventType)
          ? "error"
          : /gate|receipt/iu.test(event.eventType)
            ? "warning"
            : "info",
      })),
    userCanApprove: input.userCanApprove,
    registryInfo,
  });
}
