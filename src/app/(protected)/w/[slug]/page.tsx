import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceRootPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/w/${encodeURIComponent(slug)}/pipeline`);
}
