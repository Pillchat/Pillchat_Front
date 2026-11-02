import LearningHistoryPage from "@/components/learning/LearningHistoryPage";
import { Suspense } from "react";
export default function HistoryPage() {
  return (
    <Suspense
      fallback={<p className="px-6 py-6">학습 기록을 불러오는 중이에요.</p>}
    >
      <LearningHistoryPage view="all" />
    </Suspense>
  );
}
