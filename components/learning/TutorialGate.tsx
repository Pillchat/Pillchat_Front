"use client";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { useTutorialProgress } from "@/hooks/useTutorialProgress";
import type { TutorialKind } from "@/lib/client/tutorial";
import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
const FlashcardTutorial = dynamic(() =>
  import("@/app/(learn)/learn/_components/FlashcardTutorialApp").then(
    (module) => module.FlashcardTutorialApp,
  ),
);
const HandcraftedTutorial = dynamic(
  () =>
    import(
      "@/app/(questionbank)/questionbank/handcrafted/_components/HandcraftedTutorial"
    ),
);
const CbtTutorial = dynamic(
  () => import("@/app/(learn)/learning/cbt/_components/LegacyPractice"),
);

export default function TutorialGate({
  kind,
  children,
}: {
  kind: TutorialKind;
  children: ReactNode;
}) {
  const progress = useTutorialProgress(kind);
  if (progress.completed === null)
    return <LoadingIndicator label="사용법을 준비하고 있어요" />;
  if (progress.completed) return children;
  if (kind === "flashcards")
    return (
      <FlashcardTutorial
        key={progress.scope}
        mandatory
        onComplete={progress.complete}
      />
    );
  if (kind === "cbt")
    return (
      <CbtTutorial
        key={progress.scope}
        tutorialOnly
        onTutorialComplete={progress.complete}
      />
    );
  return (
    <HandcraftedTutorial
      key={progress.scope}
      mandatory
      onComplete={progress.complete}
      onClose={() => {}}
    />
  );
}
