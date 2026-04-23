"use client";

import type { ReactNode } from "react";

import { usePathname } from "next/navigation";

export function AppShellSidebarSlot({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/guide") {
    return null;
  }

  return <>{children}</>;
}
