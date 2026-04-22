import { cookies } from "next/headers";

import { prisma } from "@/lib/db/prisma";
import { ensureReadModelBootstrap } from "@/lib/services/read-model";

export const LAST_WORKSPACE_COOKIE = "br-ai-spec-visual-last-workspace";
const LAST_WORKSPACE_COOKIE_TTL_DAYS = 30;

export interface WorkspaceContextRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  rootPath: string | null;
  status: string;
}

interface WorkspaceSummaryRecord extends WorkspaceContextRecord {
  updatedAt: Date;
}

export async function listWorkspaceSummaries(): Promise<WorkspaceSummaryRecord[]> {
  await ensureReadModelBootstrap();
  const items = await prisma.workspace.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      rootPath: true,
      status: true,
      updatedAt: true,
    },
  });
  return items;
}

export async function findWorkspaceBySlugOrId(
  slugOrId: string,
): Promise<WorkspaceContextRecord | null> {
  if (!slugOrId) return null;
  await ensureReadModelBootstrap();

  const decoded = (() => {
    try {
      return decodeURIComponent(slugOrId);
    } catch {
      return slugOrId;
    }
  })();

  const record = await prisma.workspace.findFirst({
    where: {
      OR: [{ slug: decoded }, { id: decoded }],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      rootPath: true,
      status: true,
    },
  });

  return record;
}

export async function readLastWorkspaceSlug(): Promise<string | null> {
  const store = await cookies();
  return store.get(LAST_WORKSPACE_COOKIE)?.value ?? null;
}

export async function rememberWorkspaceSlug(slug: string) {
  // Next.js 16 禁止在 Layout/Page 渲染期间写 cookie，
  // 这里只在 Server Action / Route Handler 上下文中可写，
  // 其它情况静默忽略，避免渲染抛错导致页面 500（进而把用户弹回 /login）。
  try {
    const store = await cookies();
    const expires = new Date();
    expires.setDate(expires.getDate() + LAST_WORKSPACE_COOKIE_TTL_DAYS);
    store.set(LAST_WORKSPACE_COOKIE, slug, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires,
    });
  } catch {
    // ignore: 渲染上下文不允许写 cookie
  }
}

export async function resolveDefaultWorkspaceSlug(): Promise<string | null> {
  const remembered = await readLastWorkspaceSlug();
  if (remembered) {
    const exists = await findWorkspaceBySlugOrId(remembered);
    if (exists) return exists.slug;
  }
  const list = await listWorkspaceSummaries();
  return list[0]?.slug ?? null;
}
