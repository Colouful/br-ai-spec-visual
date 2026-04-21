import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireCurrentUser } from "@/lib/auth/server";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const user = await requireCurrentUser();

  return <AppShell user={user}>{children}</AppShell>;
}
