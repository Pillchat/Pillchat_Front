import { atomWithStorage } from "jotai/utils";

export const nicknameAtom = atomWithStorage<string>("nickname", "");
export const profileImgAtom = atomWithStorage<string | null>(
  "profileImg",
  null,
);
export const schoolAtom = atomWithStorage<string>("school", "");
export const gradeAtom = atomWithStorage<number | null>("grade", null);
export const ageAtom = atomWithStorage<number | null>("age", null);
