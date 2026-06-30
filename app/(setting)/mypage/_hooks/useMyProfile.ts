import { useCallback, useState } from "react";
import { useAtom } from "jotai";
import {
  schoolAtom,
  gradeAtom,
  profileLoadingAtom,
  profileErrorAtom,
  updateProfileAtom,
  clearProfileAtom,
  studentGradeAtom,
  idAtom,
  nicknameAtom,
  keysAtom,
  profileImgAtom,
} from "@/store/profile";
import { fetchAPI } from "@/lib/client/fetch";

export const useMyProfile = () => {
  const [profileDetails, setProfileDetails] = useState({
    userType: "STUDENT",
    followerCount: 0,
    followingCount: 0,
    farmMoney: 0,
    ticketCount: 0,
    job: "",
    workplace: "",
  });
  const [isLoading, setIsLoading] = useAtom(profileLoadingAtom);
  const [error, setError] = useAtom(profileErrorAtom);

  const [, updateProfile] = useAtom(updateProfileAtom);
  const [, clearProfile] = useAtom(clearProfileAtom);

  const [nickname] = useAtom(nicknameAtom);
  const [school] = useAtom(schoolAtom);
  const [grade] = useAtom(gradeAtom);
  const [studentGrade] = useAtom(studentGradeAtom);
  const [id] = useAtom(idAtom);
  const [keys, setKeys] = useAtom(keysAtom);
  const [profileImg, setProfileImg] = useAtom(profileImgAtom);

  const onMyProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchAPI("/api/auth/inquiry-myprofile", "GET");
      if (!result.success)
        throw new Error(result.message || "프로필 조회 실패");

      const payload = result.data ?? {};
      const numberValue = (...values: unknown[]) => {
        const value = values.find(
          (candidate) => candidate !== undefined && candidate !== null,
        );

        if (Array.isArray(value)) return value.length;

        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      };
      const textValue = (value: unknown) => {
        if (typeof value === "string") return value;
        if (value && typeof value === "object") {
          const item = value as {
            label?: string;
            value?: string;
            name?: string;
          };
          return item.label ?? item.value ?? item.name ?? "";
        }
        return "";
      };

      setProfileDetails({
        userType: payload.userType ?? "STUDENT",
        followerCount: numberValue(
          payload.followerCount,
          payload.followersCount,
          payload.followers,
        ),
        followingCount: numberValue(
          payload.followingCount,
          payload.followingsCount,
          payload.following,
        ),
        farmMoney: numberValue(
          payload.farmMoney,
          payload.pharmMoney,
          payload.money,
        ),
        ticketCount: numberValue(
          payload.ticketCount,
          payload.tickets,
          payload.questionTicketCount,
        ),
        job: textValue(payload.job ?? payload.profession),
        workplace: textValue(payload.workplace ?? payload.company),
      });
      const fetchedKeys: string[] = Array.isArray(payload.images)
        ? payload.images
            .map((img: { urlKey: string }) => img.urlKey)
            .filter(Boolean)
        : [];

      updateProfile({
        nickname: payload.nickname ?? null,
        school: payload.school ?? null,
        grade: payload.grade?.grade ?? null,
        studentGrade: payload.studentGrade ?? null,
        id: payload.id ?? null,
        keys: fetchedKeys,
      });
      setKeys(fetchedKeys);

      // 이전 유저 이미지 잔존 방지
      setProfileImg(null);

      if (fetchedKeys.length > 0) {
        try {
          // fetchAPI: localStorage에서 항상 최신 토큰 사용 (stale accessTokenAtom 문제 해결)
          const data = await fetchAPI("/api/files", "GET", {
            keys: fetchedKeys,
          });
          if (Array.isArray(data) && data[0]?.preSignedUrl) {
            setProfileImg(data[0].preSignedUrl);
          }
        } catch {
          console.warn("프로필 이미지 resolve 실패");
        }
      }
    } catch (err: any) {
      console.error("프로필 조회 실패:", err);
      setError(err?.message || "프로필 조회 실패");
      if (
        err?.message?.includes("로그인") ||
        err?.message?.includes("인증") ||
        err?.message?.includes("401")
      ) {
        clearProfile();
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    setIsLoading,
    setError,
    updateProfile,
    clearProfile,
    setKeys,
    setProfileImg,
  ]);

  const resetProfile = useCallback(() => {
    clearProfile();
    setError(null);
  }, [clearProfile, setError]);

  return {
    onMyProfile,
    resetProfile,
    isLoading,
    error,
    profile: {
      nickname,
      school,
      grade,
      studentGrade,
      id,
      profileImg,
      ...profileDetails,
    },
  };
};
