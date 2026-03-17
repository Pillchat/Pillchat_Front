import { BoardDetailPage } from "@/components/organisms";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <BoardDetailPage boardId={id} />;
}