"use client";

import { PUBLIC_ASSETS } from "@/constants/assets";
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
  const displayProfileImg = author?.avatarUrl || profileImg;
  const hasGrade = author ? !!author.grade : !!grade;

  return (
    <div className="mt-3 flex w-[90%] min-w-0 flex-row items-center gap-3 sm:gap-5">
      <ProfileImg src={displayProfileImg} />
      <div className="flex min-w-0 flex-1 flex-col py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="min-w-0 text-xl font-bold">{displayNickname}</p>
          {hasGrade && <GradeBadge />}
        </div>
        <p className="text-sm font-light">
          {displaySchool} / {displayGrade}
        </p>
      </div>
      {onIconClick && (
        <img
          src={PUBLIC_ASSETS.icons.chevronRight}
          className="ml-auto h-6 w-6 shrink-0"
          alt="프로필 편집"
          onClick={onIconClick}
        />
      )}
    </div>
  );
}
