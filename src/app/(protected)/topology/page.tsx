import { redirect } from "next/navigation";

import { resolveDefaultWorkspaceSlug } from "@/lib/workspace-context/server";

export default async function TopologyRedirectPage() {
  const slug = await resolveDefaultWorkspaceSlug();
  if (slug) redirect(`/w/${encodeURIComponent(slug)}/topology`);
  redirect("/workspaces");
}
