import { redirect } from "next/navigation";

import { resolveDefaultWorkspaceSlug } from "@/lib/workspace-context/server";

export default async function HomePage() {
  const slug = await resolveDefaultWorkspaceSlug();
  if (slug) {
    redirect(`/w/${encodeURIComponent(slug)}`);
  }
  redirect("/workspaces");
}
