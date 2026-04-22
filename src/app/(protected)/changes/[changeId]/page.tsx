import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getChangeDetailVm } from "@/lib/view-models/changes";

export default async function ChangeDetailRedirectPage({
  params,
}: {
  params: Promise<{ changeId: string }>;
}) {
  const { changeId } = await params;
  const decoded = (() => {
    try {
      return decodeURIComponent(changeId);
    } catch {
      return changeId;
    }
  })();
  const viewModel =
    (await getChangeDetailVm(decoded)) ?? (await getChangeDetailVm(changeId));
  if (!viewModel) notFound();
  const ws = await prisma.workspace.findUnique({
    where: { id: viewModel.change.workspaceId },
    select: { slug: true },
  });
  const slug = ws?.slug ?? viewModel.change.workspaceId;
  redirect(`/w/${encodeURIComponent(slug)}/changes/${encodeURIComponent(changeId)}`);
}
