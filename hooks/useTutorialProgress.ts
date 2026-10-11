"use client";
import { useSyncExternalStore } from "react";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import {
  completeTutorial,
  hasCompletedTutorial,
  TUTORIAL_EVENT,
  type TutorialKind,
} from "@/lib/client/tutorial";
const subscribe = (listener: () => void) => {
  window.addEventListener("storage", listener);
  window.addEventListener(TUTORIAL_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(TUTORIAL_EVENT, listener);
  };
};
export function useTutorialProgress(kind: TutorialKind) {
  const userId = useAuthIdentity();
  const completed = useSyncExternalStore(
    subscribe,
    () => hasCompletedTutorial(kind, userId),
    () => null,
  );
  return {
    completed,
    scope: userId ?? "guest",
    complete: () => completeTutorial(kind, userId),
  };
}
