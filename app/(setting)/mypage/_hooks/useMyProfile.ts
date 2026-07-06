import { useCallback, useState } from "react";
import { useAtom } from "jotai";

import { fetchAPI } from "@/lib/client/fetch";
import {
  buildFileUrlMap,
  getFileKey,
  getFilePreviewUrl,
} from "@/lib/shared/filePreview";
import {
  clearProfileAtom,
  gradeAtom,
  idAtom,
  keysAtom,
  nicknameAtom,
  profileErrorAtom,
  profileImgAtom,
  profileLoadingAtom,
  schoolAtom,
  studentGradeAtom,
  updateProfileAtom,
} from "@/store/profile";

type ProfileDetails = {
  userType: string;
  followerCount: number;
  followingCount: number;
  farmMoney: number;
  ticketCount: number;
  job: string;
  workplace: string;
};

const initialProfileDetails: ProfileDetails = {
  userType: "STUDENT",
  followerCount: 0,
  followingCount: 0,
  farmMoney: 0,
  ticketCount: 0,
  job: "",
  workplace: "",
};

const isResolvedImageUrl = (value: string) =>
  /^(https?:|blob:|data:)/i.test(value) || value.startsWith("/");

const uniqueStrings = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean)));

const normalizeFilesResponse = (value: any) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.files)) return value.files;
  if (Array.isArray(value?.result)) return value.result;
  return [];
};

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
      grade?: string;
    };
    return item.label ?? item.value ?? item.name ?? item.grade ?? "";
  }
  return "";
};

const getProfileImageCandidates = (payload: any) =>
  [
    ...(Array.isArray(payload.images) ? payload.images : []),
    payload.profileImg,
    payload.profileImage,
    payload.imageUrl,
  ].filter(Boolean);

const resolveProfileImage = async (payload: any) => {
  const imageCandidates = getProfileImageCandidates(payload);
  const directProfileImg =
    imageCandidates
      .map((image) => getFilePreviewUrl(image as any))
      .find(Boolean) ??
    imageCandidates
      .filter((image): image is string => typeof image === "string")
      .find(isResolvedImageUrl) ??
    null;
  const fetchedKeys = uniqueStrings(
    imageCandidates
      .map((image) => getFileKey(image as any))
      .filter((key) => key && !isResolvedImageUrl(key)),
  );

  if (fetchedKeys.length === 0) {
    return { fetchedKeys, profileImageUrl: directProfileImg };
  }

  try {
    const filesResponse = await fetchAPI("/api/files", "GET", {
      keys: fetchedKeys,
    });
    const files = normalizeFilesResponse(filesResponse);
    const fileUrlMap = buildFileUrlMap(fetchedKeys, files);
    const profileImageUrl =
      fetchedKeys.map((key) => fileUrlMap[key]).find(Boolean) ??
      files.map((file: any) => getFilePreviewUrl(file)).find(Boolean) ??
      directProfileImg;

    return { fetchedKeys, profileImageUrl: profileImageUrl ?? null };
  } catch {
    console.warn("Failed to resolve profile image");
    return { fetchedKeys, profileImageUrl: directProfileImg };
  }
};

export const useMyProfile = () => {
  const [profileDetails, setProfileDetails] = useState<ProfileDetails>(
    initialProfileDetails,
  );
  const [isLoading, setIsLoading] = useAtom(profileLoadingAtom);
  const [error, setError] = useAtom(profileErrorAtom);

  const [, updateProfile] = useAtom(updateProfileAtom);
  const [, clearProfile] = useAtom(clearProfileAtom);

  const [nickname] = useAtom(nicknameAtom);
  const [school] = useAtom(schoolAtom);
  const [grade] = useAtom(gradeAtom);
  const [studentGrade] = useAtom(studentGradeAtom);
  const [id] = useAtom(idAtom);
  const [, setKeys] = useAtom(keysAtom);
  const [profileImg, setProfileImg] = useAtom(profileImgAtom);

  const onMyProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchAPI("/api/auth/inquiry-myprofile", "GET");
      if (!result.success) {
        throw new Error(result.message || "Failed to load profile");
      }

      const payload = result.data ?? {};
      const { fetchedKeys, profileImageUrl } =
        await resolveProfileImage(payload);

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

      updateProfile({
        nickname: payload.nickname ?? null,
        school: payload.school ?? null,
        grade: textValue(payload.grade) || null,
        studentGrade: payload.studentGrade ?? null,
        id: payload.id ?? null,
        keys: fetchedKeys,
      });
      setKeys(fetchedKeys);
      setProfileImg(profileImageUrl);
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      setError(err?.message || "Failed to load profile");
      if (
        err?.message?.includes("login") ||
        err?.message?.includes("auth") ||
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
    setKeys,
    setProfileImg,
    clearProfile,
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
