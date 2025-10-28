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
import { Author } from "@/types/question";

interface Option {
  onIconClick?: () => void;
  author?: Author; // author 정보를 props로 받을 수 있도록 추가
}

export function UserInfoField({ onIconClick, author }: Option) {
  const [nickname] = useAtom(nicknameAtom);
  const [school] = useAtom(schoolAtom);
  const [studentGrade] = useAtom(studentGradeAtom);
  const [grade] = useAtom(gradeAtom);
  const [profileImg] = useAtom(profileImgAtom);

  // author props가 있으면 해당 정보를 사용, 없으면 전역 상태 사용
  const displayNickname = author?.nickname || nickname || "익명";
  const displaySchool = author?.school || school || "학교정보없음";
  const displayGrade = author?.grade || studentGrade || "학년정보없음";
  const displayProfileImg =
    author?.avatarUrl || profileImg || "/defaultProfile.svg";
  const hasGrade = author ? !!author.grade : !!grade;

  return (
    <div className="mt-3 flex w-[90%] flex-row gap-5">
      <ProfileImg src={displayProfileImg} />
      <div className="flex flex-col py-2">
        <div className="flex flex-row items-center gap-2">
          <p className="text-xl font-bold">{displayNickname}</p>
          {hasGrade && <GradeBadge />}
        </div>
        <p className="text-sm font-light">
          {displaySchool} / {displayGrade}
        </p>
      </div>
      {onIconClick && (
        <img src={"/ArrowIcon.svg"} className="ml-auto" onClick={onIconClick} />
      )}
    </div>
  );
}
