"use client";

import { ProfileImg, GradeBadge } from "../atoms";
import { useAtom } from "jotai";
import {
  nicknameAtom,
  schoolAtom,
  gradeAtom,
  studentGradeAtom,
  profileImgAtom,
} from "@/store/profile";

interface Option {
  onIconClick?: () => void;
}

export function UserInfoField({ onIconClick }: Option) {
  const [nickname] = useAtom(nicknameAtom);
  const [school] = useAtom(schoolAtom);
  const [studentGrade] = useAtom(studentGradeAtom);
  const [grade] = useAtom(gradeAtom);
  const [profileImg] = useAtom(profileImgAtom);

  return (
    <div className="mt-3 flex w-[90%] flex-row gap-5">
      <ProfileImg src={profileImg ?? "/defaultProfile.svg"} />
      <div className="flex flex-col py-2">
        <div className="flex flex-row items-center gap-2">
          <p className="text-xl font-bold">{nickname || "익명"}</p>
          {grade && <GradeBadge />}
        </div>
        <p className="text-sm font-light">
          {school || "학교정보없음"} / {studentGrade || "학년정보없음"}
        </p>
      </div>
      <img src={"/ArrowIcon.svg"} className="ml-auto" onClick={onIconClick} />
    </div>
  );
}
