import { useState } from "react";
import { LoginFormData } from "../page";
import { useAuth } from "@/hooks";
import { useRouter } from "next/navigation";
import { fetchAPI, setTokens } from "@/lib/functions";

export const useSubmit = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { saveTokensAndSetupRefresh } = useAuth();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchAPI("/api/auth/login", "POST", {
        email: data.email,
        password: data.password,
      });
      if (response.success && response.data) {
        const { access_token, refresh_token } = response.data;

        if (access_token && refresh_token) {
          saveTokensAndSetupRefresh(access_token, refresh_token);
          router.push("/");
        } else {
          setError("로그인 응답에 토큰 데이터가 없습니다.");
        }
      } else {
        setError(response.message || "로그인에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("로그인 실패:", error);
      setError(error.message || "로그인에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return { onSubmit, isLoading, error };
};
