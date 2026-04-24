import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useAuth } from "@/hooks"; // 기존 토큰 저장 훅 재사용

// 기존 SignupFormData에 수동 입력 필드를 확장한 인터페이스 정의
export interface ManualSignupFormData {
  nickname: string;
  password: string;
  email: string;
  agreeToTerms: boolean;
  realName: string;
  documentType: "student" | "professional";
  // 학생용 (Optional로 정의하되 로직에서 타입에 따라 필수 체크)
  studentId?: string;
  university?: string;
  department?: string;
  grade?: string;
  // 전문가용
  licenseNumber?: string;
  issueDate?: string;
}

export const useManualSubmit = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { saveTokensAndSetupRefresh } = useAuth();

  // OCR 방식과 달리 Temp-Token 체크 로직 제거

  const onSubmit = async (data: ManualSignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // 위에서 만든 새로운 Route 핸들러로 요청
      const response = await fetch("/api/auth/submit-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Temp-Token 헤더 제거
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success && result.data) {
        // 기존 로직과 동일하게 토큰 저장 처리 (응답 구조가 동일하다고 가정)
        // 만약 백엔드 응답(5.1)에 token이 없고 바로 로그인 페이지로 가야 한다면
        // 아래 saveTokens 로직 대신 router.push('/login')을 사용해야 할 수 있음.
        // *명세서 5.1 응답 예시에는 토큰이 안보이므로, 자동 로그인이 안된다면 로그인 페이지 이동이 맞음*
        // 다만, 기존 useSubmit 로직을 따라 토큰이 있다고 가정하고 작성함.
        // (없다면 백엔드에서 토큰을 주도록 협의하거나, 여기서 바로 /login으로 이동)

        const { access_token, refresh_token } = result.data;

        if (access_token && refresh_token) {
          saveTokensAndSetupRefresh(access_token, refresh_token);
          router.push("/"); // 메인으로 이동
        } else {
          // 명세서 5.1에 토큰이 명시되어 있지 않지만, 기존 로직 유지를 위해 토큰이 없으면 로그인 페이지로 이동 처리 등을 고려
          // 여기서는 토큰이 없으면 성공했어도 에러 처리 혹은 로그인 페이지 이동
          // 예: router.push("/login");
          setError("회원가입은 성공했으나 자동 로그인 정보를 받지 못했습니다.");
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
