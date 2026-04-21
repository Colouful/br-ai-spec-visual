import { type UserRole } from "./index";

export function canTriggerSync(role: UserRole) {
  return role === "maintainer" || role === "admin";
}

export function canOperateControl(role: UserRole) {
  return role === "maintainer" || role === "admin";
}

export function canManageWorkspace(role: UserRole) {
  return role === "admin";
}

export function getAllowedNavigation(role: UserRole) {
  const items = ["workspaces", "runs", "changes", "topology"] as const;
  return role === "admin" ? [...items, "settings"] : [...items];
}
