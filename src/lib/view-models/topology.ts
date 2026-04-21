import { prisma } from "@/lib/db/prisma";
import { getStatusBadge } from "@/lib/view-models/status";
import type {
  DemoTopologyLink,
  DemoTopologyModel,
  MetricVm,
  PageHeroVm,
} from "@/lib/view-models/types";
import { getDemoConsoleData } from "@/lib/demo/console-data";

export interface ActiveRoleHighlight {
  roleSlug: string;
  workspaceId: string;
  workspaceName: string;
  runKey: string;
  pendingGate: string | null;
  lastEventType: string;
  lastOccurredAt: string;
}

export interface TopologyNodeVm {
  id: string;
  label: string;
  kind: string;
  ring: number;
  x: number;
  y: number;
  memberCount: number;
  members: string[];
  statusLabel: string;
  tone: ReturnType<typeof getStatusBadge>["tone"];
}

export type TopologyEdgeVm = DemoTopologyLink;

export interface RoleTopologyVm {
  scopeLabel: string;
  nodes: TopologyNodeVm[];
  edges: TopologyEdgeVm[];
}

export interface TopologyPageVm {
  hero: PageHeroVm;
  graph: RoleTopologyVm;
  signals: MetricVm[];
  activeRoles: ActiveRoleHighlight[];
}

export interface FlowTopologyInput {
  flows: Array<{
    slug: string;
    name: string;
    requiredRoles: string[];
    optionalRoles: string[];
  }>;
  roles: Array<{
    slug: string;
    name: string;
    status: "active" | "warning" | "inactive";
  }>;
}

export interface FlowTopologyVm {
  nodes: Array<{
    id: string;
    label: string;
    type: "flow" | "role";
    status?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    kind: "required" | "optional";
  }>;
}

function polarPoint(index: number, total: number, ring: number) {
  if (ring === 0) {
    return { x: 50, y: 50 };
  }

  const radius = 22 + ring * 12;
  const angle = (-90 + (360 / Math.max(total - 1, 1)) * (index - 1)) * (Math.PI / 180);

  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
  };
}

export function mapRoleTopology(input: DemoTopologyModel): RoleTopologyVm {
  const nodes = input.roles.map((role, index) => {
    const ring = Math.min(index, 2);
    const point = polarPoint(index, input.roles.length, ring);
    const badge = getStatusBadge(role.status);

    return {
      id: role.id,
      label: role.label,
      kind: role.kind === "human" ? "人工环节" : "系统环节",
      ring,
      x: Number(point.x.toFixed(2)),
      y: Number(point.y.toFixed(2)),
      memberCount: role.members.length,
      members: role.members,
      statusLabel: badge.label,
      tone: badge.tone,
    };
  });

  return {
    scopeLabel: input.scopeLabel,
    nodes,
    edges: input.links.map((link) => ({
      from: link.from,
      to: link.to,
      weight: link.weight,
    })),
  };
}

export function buildTopologyViewModel(input: FlowTopologyInput): FlowTopologyVm {
  const flowNodes = input.flows.map((flow) => ({
    id: flow.slug,
    label: flow.name,
    type: "flow" as const,
  }));
  const roleNodes = input.roles.map((role) => ({
    id: role.slug,
    label: role.name,
    type: "role" as const,
    status: role.status,
  }));
  const edges = input.flows.flatMap((flow) => [
    ...flow.requiredRoles.map((target) => ({
      source: flow.slug,
      target,
      kind: "required" as const,
    })),
    ...flow.optionalRoles.map((target) => ({
      source: flow.slug,
      target,
      kind: "optional" as const,
    })),
  ]);

  return {
    nodes: [...flowNodes, ...roleNodes],
    edges,
  };
}

async function loadActiveRoleHighlights(): Promise<ActiveRoleHighlight[]> {
  try {
    const states = await prisma.runState.findMany({
      where: { status: { notIn: ["completed", "success", "cancelled"] } },
      orderBy: { lastOccurredAt: "desc" },
      take: 30,
      include: { workspace: true },
    });

    return states
      .map((state) => {
        const payload =
          state.payload && typeof state.payload === "object" && !Array.isArray(state.payload)
            ? (state.payload as Record<string, unknown>)
            : {};
        const role =
          (typeof payload.current_role === "string" && payload.current_role) ||
          null;
        const pendingGate =
          (typeof payload.pending_gate === "string" && payload.pending_gate) ||
          null;
        if (!role) return null;
        return {
          roleSlug: role,
          workspaceId: state.workspaceId,
          workspaceName: state.workspace?.name || state.workspaceId,
          runKey: state.runKey,
          pendingGate,
          lastEventType: state.lastEventType,
          lastOccurredAt: state.lastOccurredAt.toISOString(),
        } satisfies ActiveRoleHighlight;
      })
      .filter((entry): entry is ActiveRoleHighlight => Boolean(entry));
  } catch {
    return [];
  }
}

export async function getTopologyPageVm(): Promise<TopologyPageVm> {
  const data = await getDemoConsoleData();
  const graph = mapRoleTopology(data.topology);
  const activeRoles = await loadActiveRoleHighlights();

  return {
    activeRoles,
    hero: {
      eyebrow: "角色拓扑",
      title: "跨工作区执行网络",
      subtitle:
        "把人工复核、自动执行与审计回写放进同一张拓扑图里，优先暴露脆弱节点和串行瓶颈。",
      stats: [
        {
          label: "角色数",
          value: String(graph.nodes.length),
        },
        {
          label: "主链路",
          value: String(graph.edges.filter((edge) => edge.weight === "primary").length),
        },
        {
          label: "热点节点",
          value: String(graph.nodes.filter((node) => node.statusLabel !== "健康").length),
        },
      ],
    },
    graph,
    signals: [
      {
        label: "人工环节",
        value: String(graph.nodes.filter((node) => node.kind === "人工环节").length),
        note: "需要人工确认的关键节点",
      },
      {
        label: "系统环节",
        value: String(graph.nodes.filter((node) => node.kind === "系统环节").length),
        note: "适合后续挂载实时订阅",
      },
      {
        label: "范围",
        value: graph.scopeLabel,
        note: "后续可直接替换为真实接口返回值",
      },
    ],
  };
}
