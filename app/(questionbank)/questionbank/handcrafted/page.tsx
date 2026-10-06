import LearningWorkspace from "@/components/learning/LearningWorkspace";
import LegacyPractice from "./_components/LegacyPractice";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  if (mode === "sample")
    return (
      <>
        <p className="bg-amber-50 p-3 text-sm">
          체험용 예제입니다. 학습 기록은 서버에 저장되지 않습니다.
        </p>
        <LegacyPractice />
      </>
    );
  return <LearningWorkspace source="HANDCRAFTED" />;
}
