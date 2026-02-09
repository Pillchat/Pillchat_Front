// import { useState } from "react";
// import { useAtomValue } from "jotai";
// import { tempTokenAtom } from "@/store/tempToken";

// export const useVerify = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>();
//   const [isVerified, setIsVerified] = useState(false);
//   const tempToken = useAtomValue(tempTokenAtom);

//   const onVerify = async (email: string) => {
//     if (!tempToken) {
//       setError("OCR 인증이 필요합니다.");
//       return;
//     }

//     setIsLoading(true);
//     setError(null);

//     console.log("temp token:", tempToken);

//     try {
//       const response = await fetch("/api/auth/send-verify", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           // "Temp-Token": tempToken,
//         },
//         body: JSON.stringify({ email }),
//       });

//       if (!response.ok) {
//         throw new Error("인증코드 발송 실패");
//       }

//       setIsVerified(true);
//     } catch (error: any) {
//       console.error("인증코드 발송 실패:", error);
//       setError(
//         error.message || "인증코드 발송에 실패했습니다. 다시 시도해주세요.",
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return { onVerify, isLoading, error, isVerified };
// };

import { useState } from "react";
// import { useAtomValue } from "jotai"; // 제거
// import { tempTokenAtom } from "@/store/tempToken"; // 제거

export const useVerify = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  // 수동 가입에서는 OCR 토큰이 없으므로 제거
  // const tempToken = useAtomValue(tempTokenAtom);

  const onVerify = async (email: string) => {
    // 수동 가입 시 이 시점에는 토큰이 없으므로 체크 로직 제거
    /* if (!tempToken) {
      setError("OCR 인증이 필요합니다.");
      return;
    }
    */

    setIsLoading(true);
    setError(null);

    try {
      // API Route 호출
      const response = await fetch("/api/auth/send-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "Temp-Token": tempToken, // 헤더에서도 제거
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        // 에러 응답 파싱 시도
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "인증코드 발송 실패");
      }

      setIsVerified(true);
    } catch (error: any) {
      console.error("인증코드 발송 실패:", error);
      setError(
        error.message || "인증코드 발송에 실패했습니다. 다시 시도해주세요.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { onVerify, isLoading, error, isVerified };
};
