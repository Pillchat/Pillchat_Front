import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import { useAuth } from "@/hooks";
import { SignupFormData } from "@/app/(auth)/signup/page";
import { tempTokenAtom } from "@/store/tempToken";

export const useSubmit = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { saveTokensAndSetupRefresh } = useAuth();
  const tempToken = useAtomValue(tempTokenAtom);

  const onSubmit = async (data: SignupFormData) => {
    if (!tempToken) {
      setError("OCR 인증이 필요합니다.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Temp-Token": tempToken,
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          nickname: data.nickname,
          agreeToTerms: data.agreeToTerms,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.data) {
        const { access_token, refresh_token } = result.data;

        if (access_token && refresh_token) {
          saveTokensAndSetupRefresh(access_token, refresh_token);
          router.push("/");
        } else {
          setError("회원가입 응답에 토큰 데이터가 없습니다.");
        }
      } else {
        setError(result.error || result.message || "회원가입에 실패했습니다.");
      }
    } catch (err: any) {
      setError(err.message || "회원가입에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return { onSubmit, isLoading, error };
};
