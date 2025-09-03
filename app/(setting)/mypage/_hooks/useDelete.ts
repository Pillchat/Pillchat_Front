import { useState } from "react";
import { fetchAPI } from "@/lib/functions";

export const useDelete = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>();

  const onDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchAPI("/api/auth/delete-user", "DELETE");
    } catch (error: any) {
      console.error("계정탈퇴 실패:", error);
      setError(error.message || "계정탈퇴에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return { onDelete };
};
