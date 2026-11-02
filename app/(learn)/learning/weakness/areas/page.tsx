import { readWeaknessFilters, weaknessHref } from "@/lib/learning/weakness";
import WeaknessSettings from "../_components/WeaknessSettings";
import { WeaknessAccess } from "../_components/WeaknessAccess";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = readWeaknessFilters(await searchParams);
  return (
    <WeaknessAccess returnTo={weaknessHref(filters, "areas")}>
      <WeaknessSettings initialFilters={filters} />
    </WeaknessAccess>
  );
}
