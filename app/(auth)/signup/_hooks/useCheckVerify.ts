import { useState } from "react";

export const useCheckVerify = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>();

  const onCheckVerify = async (email: string, code: string): Promise<{ success: boolean; status: number; message?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/check-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.message || "인증코드 확인 실패";
        setError(message);
        return { success: false, status: response.status, message };
      }

      return { success: true, status: 200, message: data.message || "인증 성공" };
    } catch (err: any) {
      setError(err.message || "인증 오류 발생");
      return { success: false, status: 500, message: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  return { onCheckVerify, isLoading, error, setError };
};
