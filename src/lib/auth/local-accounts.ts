import bcrypt from "bcryptjs";

import type { UserRole } from "@/lib/permissions";

interface LocalAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  username: string;
}

export interface LoginAccountHint {
  email: string;
  label: string;
  password: string;
  role: UserRole;
  username: string;
}

const LOCAL_PASSWORD = "Console#2026";
const LOCAL_PASSWORD_HASH =
  "$2b$10$r/.ykvinDTFOiKSeiL75f.KBbL/4UdH3FUbDUQwZOp94gcuyh6U9W";

const LOCAL_ACCOUNTS: LocalAccount[] = [
  {
    id: "local-admin",
    email: "admin@local",
    name: "控制台管理员",
    role: "admin",
    passwordHash: LOCAL_PASSWORD_HASH,
    username: "admin",
  },
  {
    id: "local-maintainer",
    email: "maintainer@local",
    name: "执行维护者",
    role: "maintainer",
    passwordHash: LOCAL_PASSWORD_HASH,
    username: "maintainer",
  },
  {
    id: "local-viewer",
    email: "viewer@local",
    name: "只读观察者",
    role: "viewer",
    passwordHash: LOCAL_PASSWORD_HASH,
    username: "viewer",
  },
];

export async function authenticateLocalUser(credential: string, password: string) {
  const normalizedCredential = credential.trim().toLowerCase();
  const account = LOCAL_ACCOUNTS.find(
    (item) =>
      item.email.toLowerCase() === normalizedCredential ||
      item.username.toLowerCase() === normalizedCredential,
  );
  if (!account) {
    return null;
  }

  const isValid = await bcrypt.compare(password, account.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.role,
  };
}

export function getLoginAccountHints(): LoginAccountHint[] {
  return LOCAL_ACCOUNTS.map((account) => ({
    email: account.email,
    label: account.name,
    password: LOCAL_PASSWORD,
    role: account.role,
    username: account.username,
  }));
}
