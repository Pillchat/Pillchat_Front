import { useState } from "react";

interface UploadParams {
  userId: number;
  file: File;
  type: "profile" | "question" | "answer";
  access_token: string | null;
}

export const useUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);

  const onUpload = async ({
    userId,
    file,
    type,
    access_token,
  }: UploadParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("userId", userId.toString());
      formData.append("files", `profile_${userId}`);
      formData.append("type", type);

      const response = await fetch("/api/profile/uploadS3", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `${access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "이미지 업로드 실패");
        return null;
      }

      const { key, preSignedUrl } = data[0];
      const uploadResponse = await fetch(preSignedUrl, {
        method: "PUT",
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("S3 업로드 실패");
      }

      setUploadedKey(key);
      return { success: true, key };
    } catch (err: any) {
      console.error("이미지 업로드 실패:", err);
      setError(err.message || "이미지 업로드 실패");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { onUpload, isLoading, error, uploadedKey };
};
