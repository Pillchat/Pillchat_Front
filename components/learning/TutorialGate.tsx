"use client";
import { useState, type ReactNode } from "react";
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

type TutorialGateProps = {
  kind: TutorialKind;
  children: ReactNode;
};

export default function TutorialGate({ kind, children }: TutorialGateProps) {
  const progress = useTutorialProgress(kind);
  if (progress.completed === null)
    return <LoadingIndicator label="사용법을 준비하고 있어요" />;
  return (
    <TutorialSession
      key={`${kind}:${progress.scope}`}
      kind={kind}
      initiallyCompleted={progress.completed}
    >
      {children}
    </TutorialSession>
  );
}

function TutorialSession({
  kind,
  children,
  initiallyCompleted,
}: TutorialGateProps & { initiallyCompleted: boolean }) {
  // Keep the completion screen open even after saving progress.
  const [open, setOpen] = useState(!initiallyCompleted);
  const close = () => setOpen(false);

  if (!open) return children;
  if (kind === "flashcards")
    return <FlashcardTutorial mandatory onClose={close} />;
  if (kind === "cbt")
    return <CbtTutorial tutorialOnly onTutorialComplete={close} />;
  return <HandcraftedTutorial mandatory onClose={close} />;
}
