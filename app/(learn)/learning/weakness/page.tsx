import { readWeaknessFilters, weaknessHref } from "@/lib/learning/weakness";
import WeaknessMain from "./_components/WeaknessMain";
import { WeaknessAccess } from "./_components/WeaknessAccess";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = readWeaknessFilters(await searchParams);
  return (
    <WeaknessAccess returnTo={weaknessHref(filters)}>
      <WeaknessMain filters={filters} />
    </WeaknessAccess>
  );
}
