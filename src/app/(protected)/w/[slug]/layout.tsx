import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { WorkspaceContextProvider } from "@/lib/workspace-context/client";
import {
  findWorkspaceBySlugOrId,
  rememberWorkspaceSlug,
} from "@/lib/workspace-context/server";

interface WorkspaceLayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { slug } = await params;
  const workspace = await findWorkspaceBySlugOrId(slug);

  if (!workspace) {
    notFound();
  }

  // remember which workspace the user last visited
  await rememberWorkspaceSlug(workspace.slug);

  return (
    <WorkspaceContextProvider
      value={{
        id: workspace.id,
        slug: workspace.slug,
        name: workspace.name,
        description: workspace.description,
        rootPath: workspace.rootPath,
        status: workspace.status,
      }}
    >
      {children}
    </WorkspaceContextProvider>
  );
}
