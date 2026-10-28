import { readWeaknessFilters } from "@/lib/learning/weakness";
import WeaknessMain from "./_components/WeaknessMain";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <WeaknessMain filters={readWeaknessFilters(await searchParams)} />;
}
