import { atomWithStorage } from "jotai/utils";

export const answerNotificationAtom = atomWithStorage(
  "answerNotification",
  false,
);
export const adoptNotificationAtom = atomWithStorage(
  "adoptNotification",
  false,
);
export const subjectQuestionAtom = atomWithStorage("subjectQuestion", false);
export const subjectMaterialAtom = atomWithStorage("subjectMaterial", false);
export const adNotificationAtom = atomWithStorage("adNotification", false);
export const nightAdNotificationAtom = atomWithStorage(
  "nightAdNotification",
  false,
);
