import { readWeaknessFilters } from "@/lib/learning/weakness";
import WeaknessSettings from "../_components/WeaknessSettings";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <WeaknessSettings
      initialFilters={readWeaknessFilters(await searchParams)}
    />
  );
}
