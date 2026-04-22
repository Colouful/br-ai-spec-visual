import { redirect } from "next/navigation";

import { resolveDefaultWorkspaceSlug } from "@/lib/workspace-context/server";

export default async function TasksRedirectPage() {
  const slug = await resolveDefaultWorkspaceSlug();
  if (slug) {
    redirect(`/w/${encodeURIComponent(slug)}/pipeline`);
  }
  redirect("/workspaces");
}
