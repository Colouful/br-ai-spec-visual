import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/server";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  await requireRole("admin", "/platform");
  return <>{children}</>;
}
