export type WorkspaceHealth = "healthy" | "warning" | "critical" | "idle";
export type RunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "canceled";
export type ChangeStatus =
  | "draft"
  | "review"
  | "approved"
  | "merged"
  | "blocked";
export type StatusKey = WorkspaceHealth | RunStatus | ChangeStatus;

export type TopologyRoleKind = "human" | "system";
export type TopologyLinkWeight = "primary" | "secondary";

export interface MetricVm {
  label: string;
  value: string;
  note?: string;
}

export interface PageHeroVm {
  eyebrow: string;
  title: string;
  subtitle: string;
  stats: MetricVm[];
}

export interface DemoWorkspace {
  id: string;
  name: string;
  description: string;
  zone: string;
  health: WorkspaceHealth;
  owners: string[];
  projectCount: number;
  throughput: number;
  successRate: number;
  tags: string[];
  focus: string;
}

export interface DemoRunStage {
  id: string;
  label: string;
  status: RunStatus;
  durationMs: number;
  summary: string;
}

export interface DemoRun {
  id: string;
  workspaceId: string;
  title: string;
  summary: string;
  trigger: string;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string;
  updatedAt: string;
  progress: number;
  operator: string;
  changeId?: string;
  stages: DemoRunStage[];
  logs: string[];
}

export interface DemoChangeTimelineItem {
  id: string;
  label: string;
  at: string;
  note: string;
}

export interface DemoChange {
  id: string;
  workspaceId: string;
  title: string;
  summary: string;
  status: ChangeStatus;
  owner: string;
  reviewers: string[];
  risk: "low" | "medium" | "high";
  updatedAt: string;
  systems: string[];
  checklist: string[];
  relatedRunIds: string[];
  timeline: DemoChangeTimelineItem[];
}

export interface DemoTopologyRole {
  id: string;
  label: string;
  kind: TopologyRoleKind;
  status: WorkspaceHealth;
  members: string[];
}

export interface DemoTopologyLink {
  from: string;
  to: string;
  weight: TopologyLinkWeight;
}

export interface DemoTopologyModel {
  scopeLabel: string;
  roles: DemoTopologyRole[];
  links: DemoTopologyLink[];
}

export interface DemoSettingItem {
  id: string;
  label: string;
  value: string;
  description: string;
  mode: "managed" | "hybrid" | "draft";
}

export interface DemoSettingSection {
  id: string;
  title: string;
  summary: string;
  items: DemoSettingItem[];
}

export interface DemoConsoleData {
  now: string;
  workspaces: DemoWorkspace[];
  runs: DemoRun[];
  changes: DemoChange[];
  topology: DemoTopologyModel;
  settings: DemoSettingSection[];
}
