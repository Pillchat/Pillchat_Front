import { MarketItemForm } from "../../_components/MarketItemForm";

export default async function MarketEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <MarketItemForm mode="edit" marketId={id} />;
}
