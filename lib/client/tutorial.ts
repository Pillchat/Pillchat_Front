export type TutorialKind = "flashcards" | "handcrafted" | "cbt";
const completedInSession = new Set<string>();
export const TUTORIAL_EVENT = "pillchat:tutorial-completed";
const keyFor = (kind: TutorialKind, userId: string | null) =>
  `pillchat:tutorial:v1:${userId ?? "guest"}:${kind}`;

export function hasCompletedTutorial(
  kind: TutorialKind,
  userId: string | null,
) {
  const key = keyFor(kind, userId);
  if (completedInSession.has(key)) return true;
  try {
    return window.localStorage.getItem(key) === "complete";
  } catch {
    return false;
  }
}
export function completeTutorial(kind: TutorialKind, userId: string | null) {
  const key = keyFor(kind, userId);
  completedInSession.add(key);
  try {
    window.localStorage.setItem(key, "complete");
  } catch {
    /* Keep completion for this session if storage is unavailable. */
  }
  window.dispatchEvent(new Event(TUTORIAL_EVENT));
}
