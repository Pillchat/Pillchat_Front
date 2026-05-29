import SupportDetailClient from "./SupportDetailClient";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SupportDetailClient inquiryId={id} />;
}
