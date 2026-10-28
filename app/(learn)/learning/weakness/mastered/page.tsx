import { readWeaknessFilters } from "@/lib/learning/weakness";
import MasteredQuestions from "../_components/MasteredQuestions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <MasteredQuestions filters={readWeaknessFilters(await searchParams)} />
  );
}
