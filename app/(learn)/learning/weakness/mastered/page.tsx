import { readWeaknessFilters, weaknessHref } from "@/lib/learning/weakness";
import MasteredQuestions from "../_components/MasteredQuestions";
import { WeaknessAccess } from "../_components/WeaknessAccess";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = readWeaknessFilters(await searchParams);
  return (
    <WeaknessAccess returnTo={weaknessHref(filters, "mastered")}>
      <MasteredQuestions filters={filters} />
    </WeaknessAccess>
  );
}
