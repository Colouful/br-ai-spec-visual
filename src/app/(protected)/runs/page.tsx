import { redirect } from "next/navigation";

import { resolveDefaultWorkspaceSlug } from "@/lib/workspace-context/server";

export default async function RunsRedirectPage() {
  const slug = await resolveDefaultWorkspaceSlug();
  if (slug) redirect(`/w/${encodeURIComponent(slug)}/runs`);
  redirect("/workspaces");
}
