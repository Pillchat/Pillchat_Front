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
      // 1) Presigned URL 발급 요청
      const response = await fetch("/api/profile/uploadS3", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${access_token}`,
        },
        body: JSON.stringify({
          filename: `profile_${userId}`,
          type,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || "Presigned URL 발급 실패");
        return null;
      }

      // 백엔드 응답: [{key, preSignedUrl}]
      const data = await response.json();
      const { key, preSignedUrl } = data[0];

      // 2) S3에 파일 업로드 (Content-Type 필수)
      const uploadResponse = await fetch(preSignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
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
