import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole("admin", "/admin");
  return <>{children}</>;
}
