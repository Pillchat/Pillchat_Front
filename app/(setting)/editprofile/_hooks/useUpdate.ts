import { fetchAPI } from "@/lib/client/fetch";
interface UploadParams {
  accessToken: string | null;
  tempNickname: string;
  keys: string[];
}

export const useUpdate = () => {
  const onUpdate = async ({
    accessToken,
    tempNickname,
    keys,
  }: UploadParams) => {
    try {
      const data = await fetchAPI("/api/profile/update", "PUT", {
        tempNickname,
        keys,
      });
      return data;
    } catch (err: any) {
      console.error("프로필 수정 실패:", err);
      return null;
    }
  };

  return { onUpdate };
};
