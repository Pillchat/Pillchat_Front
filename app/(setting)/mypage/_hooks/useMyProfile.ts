import { useCallback } from "react";
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
  profileImgAtom
} from "@/store/profile";
import { fetchAPI } from "@/lib/functions";
import { accessTokenAtom } from "@/store/S3auth";

export const useMyProfile = () => {
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
  const [accessToken] = useAtom(accessTokenAtom);

  const onMyProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchAPI('/api/auth/inquiry-myprofile', 'GET');
      if (!result.success) throw new Error(result.message || '프로필 조회 실패');

      const payload = result.data ?? {};
      const fetchedKeys: string[] = Array.isArray(payload.images)
        ? payload.images.map(img => img.urlKey).filter(Boolean)
        : [];

      updateProfile({
        nickname: payload.nickname ?? null,
        school: payload.school ?? null,
        grade: payload.grade?.grade ?? null,
        studentGrade: payload.studentGrade ?? null,
        id: payload.id ?? null,
        keys: fetchedKeys
      });
      setKeys(fetchedKeys);

      if (fetchedKeys.length > 0) {
        const query = new URLSearchParams();
        fetchedKeys.forEach((k) => query.append("keys", k));

        const res = await fetch(`/api/profile/image-view?${query.toString()}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setProfileImg(data[0]?.preSignedUrl ?? undefined);
          } else if (data.preSignedUrl) {
            setProfileImg(data.preSignedUrl);
          }
        } else {
          console.warn("S3 pre-signed URL 조회 실패:", res.status, await res.text());
        }
      }

    } catch (err: any) {
      console.error('프로필 조회 실패:', err);
      setError(err?.message || '프로필 조회 실패');
      if (err?.message?.includes('로그인') || err?.message?.includes('인증') || err?.message?.includes('401')) {
        clearProfile();
      }
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setError, updateProfile, clearProfile, setKeys, accessToken, setProfileImg]);

  const resetProfile = useCallback(() => {
    clearProfile();
    setError(null);
  }, [clearProfile, setError]);

  return {
    onMyProfile,
    resetProfile,
    isLoading,
    error,
    profile: { nickname, school, grade, studentGrade, id, profileImg }
  };
};
