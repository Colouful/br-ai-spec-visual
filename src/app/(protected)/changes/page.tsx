import { redirect } from "next/navigation";

import { resolveDefaultWorkspaceSlug } from "@/lib/workspace-context/server";

export default async function ChangesRedirectPage() {
  const slug = await resolveDefaultWorkspaceSlug();
  if (slug) redirect(`/w/${encodeURIComponent(slug)}/changes`);
  redirect("/workspaces");
}
