export const ROLE_ORDER = ["viewer", "maintainer", "admin"] as const;

export type UserRole = (typeof ROLE_ORDER)[number];

const ROLE_WEIGHT: Record<UserRole, number> = {
  viewer: 0,
  maintainer: 1,
  admin: 2,
};

export function isUserRole(value: string): value is UserRole {
  return ROLE_ORDER.includes(value as UserRole);
}

export function hasPermission(role: UserRole, requiredRole: UserRole) {
  return ROLE_WEIGHT[role] >= ROLE_WEIGHT[requiredRole];
}

export function canAccessRole(
  role: UserRole | null | undefined,
  requiredRole: UserRole,
) {
  return role ? hasPermission(role, requiredRole) : false;
}

export function getRoleLabel(role: UserRole) {
  switch (role) {
    case "admin":
      return "管理员";
    case "maintainer":
      return "维护者";
    case "viewer":
      return "观察者";
  }
}
