import { useState, useCallback } from "react";
import { fetchAPI } from "@/lib/functions";
import { useAtom } from "jotai";
import { nicknameAtom, schoolAtom, gradeAtom } from "@/store/profile";

export const useMyProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>();

  const [, setNickname] = useAtom(nicknameAtom);
  const [, setSchool] = useAtom(schoolAtom);
  const [, setGrade] = useAtom(gradeAtom);

  const onMyProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchAPI("/api/auth/inquiry-myprofile", "GET");
      const data = await response.json();

      setNickname(data.username);
      setSchool(data.school);
      setGrade(data.grade.grade);
    } catch (error: any) {
      console.error("내 프로필 조회 실패:", error);
      setError(
        error.message || "내 프로필 조회에 실패했습니다. 다시 시도해주세요",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { onMyProfile };
};
