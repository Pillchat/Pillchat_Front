"use client";
import { useCallback, useEffect, useSyncExternalStore } from "react";
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
  useEffect(() => {
    if (userId && hasCompletedTutorial(kind, null)) {
      completeTutorial(kind, userId);
    }
  }, [kind, userId]);

  const completed = useSyncExternalStore(
    subscribe,
    () => {
      if (!userId) return null;
      if (hasCompletedTutorial(kind, userId)) return true;
      return hasCompletedTutorial(kind, null) ? null : false;
    },
    () => null,
  );
  const complete = useCallback(() => {
    if (userId) completeTutorial(kind, userId);
  }, [kind, userId]);

  return {
    completed,
    scope: userId ?? "guest",
    complete,
  };
}
