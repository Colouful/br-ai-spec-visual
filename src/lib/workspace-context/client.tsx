"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface WorkspaceContextValue {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  rootPath: string | null;
  status: string;
}

const Ctx = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceContextProvider({
  value,
  children,
}: {
  value: WorkspaceContextValue;
  children: ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrentWorkspace(): WorkspaceContextValue | null {
  return useContext(Ctx);
}

export function useRequireWorkspace(): WorkspaceContextValue {
  const value = useContext(Ctx);
  if (!value) {
    throw new Error(
      "useRequireWorkspace must be used inside a /w/[slug]/* route segment",
    );
  }
  return value;
}
