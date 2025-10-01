// store/profile.ts
import { atom } from "jotai";

// 프로필 상태 atoms
export const nicknameAtom = atom<string | null>(null);
export const profileImgAtom = atom<string | null>(null);
export const schoolAtom = atom<string | null>(null);
export const gradeAtom = atom<string | null>(null);
export const studentGradeAtom = atom<string | null>(null);
export const idAtom = atom<number | null>(null);
export const keysAtom = atom<string[] | null>(null);

// 로딩/에러
export const profileLoadingAtom = atom<boolean>(false);
export const profileErrorAtom = atom<string | null>(null);

// 초기화
export const clearProfileAtom = atom(null, (get, set) => {
  set(nicknameAtom, null);
  set(profileImgAtom, null);
  set(schoolAtom, null);
  set(gradeAtom, null);
  set(studentGradeAtom, null);
  set(idAtom, null);
  set(profileErrorAtom, null);
  set(keysAtom, null);
});

// 업데이트
export const updateProfileAtom = atom(
  null,
  (
    get,
    set,
    update: {
      nickname?: string;
      profileImg?: string | null;
      school?: string;
      grade?: string;
      studentGrade?: string;
      id?: number;
      keys?: string[];
    },
  ) => {
    if (update.nickname !== undefined) set(nicknameAtom, update.nickname);
    if (update.profileImg !== undefined) set(profileImgAtom, update.profileImg);
    if (update.school !== undefined) set(schoolAtom, update.school);
    if (update.grade !== undefined) set(gradeAtom, update.grade);
    if (update.studentGrade !== undefined)
      set(studentGradeAtom, update.studentGrade);
    if (update.id !== undefined) set(idAtom, update.id);
    if (update.keys !== undefined) set(keysAtom, update.keys);
  },
);
