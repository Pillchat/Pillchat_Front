import { useState } from "react";
import { fetchAPI } from "@/lib/functions";
import { useRouter } from "next/navigation";

export const useLogout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>();
  const router = useRouter()

  const onLogout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchAPI("/api/auth/logout", "POST");
      if(response.success) {
        router.push("/login");
      }

    } catch (error: any) {
      console.error("로그아웃 실패:", error);
      setError(error.message || "로그아웃에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return { onLogout };
};
