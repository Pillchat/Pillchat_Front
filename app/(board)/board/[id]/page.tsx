import { BoardDetailPage } from "./_components/BoardDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <BoardDetailPage boardId={id} />;
}
