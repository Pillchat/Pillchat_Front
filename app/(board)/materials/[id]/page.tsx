import { MaterialDetailPage } from "./_components/MaterialDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <MaterialDetailPage materialId={id} />;
}
