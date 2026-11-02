import LearningHistoryPage from "@/components/learning/LearningHistoryPage";
import { Suspense } from "react";
export default function RecentLearningPage() {
  return (
    <Suspense
      fallback={<p className="px-6 py-6">최근 학습을 불러오는 중이에요.</p>}
    >
      <LearningHistoryPage view="recent" />
    </Suspense>
  );
}
