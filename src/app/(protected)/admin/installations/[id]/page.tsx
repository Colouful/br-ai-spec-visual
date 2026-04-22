import { redirect } from "next/navigation";

export default async function Redirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/platform/installations/${encodeURIComponent(id)}`);
}
