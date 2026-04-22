import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getRunDetailVm } from "@/lib/view-models/runs";

export default async function RunDetailRedirectPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const viewModel = await getRunDetailVm(runId);
  if (!viewModel) notFound();
  const ws = await prisma.workspace.findUnique({
    where: { id: viewModel.run.workspaceId },
    select: { slug: true },
  });
  const slug = ws?.slug ?? viewModel.run.workspaceId;
  redirect(`/w/${encodeURIComponent(slug)}/runs/${encodeURIComponent(runId)}`);
}
