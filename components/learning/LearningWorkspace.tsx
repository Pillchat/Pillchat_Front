"use client";
import TutorialGate from "@/components/learning/TutorialGate";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { useLearningSession } from "@/hooks/useLearningSession";
import type { Source } from "@/lib/learning/api";
import HandcraftedPractice from "./practice/HandcraftedPractice";
import CbtPractice from "./practice/CbtPractice";

export default function LearningWorkspace({ source }: { source: Source }) {
  const userId = useAuthIdentity();
  return (
    <TutorialGate kind={source === "CBT" ? "cbt" : "handcrafted"}>
      <LearningWorkspaceContent key={`${userId}:${source}`} source={source} />
    </TutorialGate>
  );
}
function LearningWorkspaceContent({ source }: { source: Source }) {
  const session = useLearningSession(source);
  return source === "CBT" ? (
    <CbtPractice session={session} />
  ) : (
    <HandcraftedPractice session={session} />
  );
}
