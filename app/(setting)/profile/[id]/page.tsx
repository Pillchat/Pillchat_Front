import { UserProfilePage } from "./_components/UserProfilePage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <UserProfilePage userId={id} />;
}
