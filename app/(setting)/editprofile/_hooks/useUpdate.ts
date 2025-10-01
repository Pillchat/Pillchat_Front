interface UploadParams {
  accessToken: string | null;
  tempNickname: string;
  keys: string[];
}

export const useUpdate = () => {
  const onUpdate = async ({ accessToken, tempNickname, keys }: UploadParams) => {
    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          tempNickname,
          keys,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return alert(data.message || "프로필 편집 실패");
      }

      return data;
    } catch (err: any) {
      console.error("프로필 수정 실패:", err);
      return null;
    }
  };

  return { onUpdate };
};
