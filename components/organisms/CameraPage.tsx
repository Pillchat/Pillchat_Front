// "use client";

// import { useEffect } from "react";
// import { useSetAtom } from "jotai";
// import { tempTokenAtom } from "@/store/tempToken";
// import { useUpload } from "@/app/(auth)/signup/_hooks";

// interface CameraPageProps {
//   setStep: (step: number) => void;
//   route: "학생" | "전문가";
//   setOcrData: (data: any) => void;
// }

// export const CameraPage = ({ setStep, route, setOcrData }: CameraPageProps) => {
//   const { onUpload, isLoading, error } = useUpload();
//   const setTempToken = useSetAtom(tempTokenAtom);

//   useEffect(() => {
//     // RN에서 보낸 data URI (base64) 받는 핸들러.
//     (window as any).onNativeCameraResult = async (base64: string) => {
//       try {
//         const res = await fetch(base64); // data URI를 fetch하면 blob 얻음
//         const blob = await res.blob();
//         const file = new File([blob], "capture.png", { type: "image/png" });

//         const result = await onUpload(
//           file,
//           route === "학생" ? "student" : "professional",
//         );

//         if (result?.success) {
//           setTempToken(result.tempToken);
//           setOcrData(result);
//           setStep(4);
//         } else {
//           alert(result?.error || "OCR 인증 실패");
//         }
//       } catch (err) {
//         console.error("onNativeCameraResult error:", err);
//         alert("이미지 처리 중 오류가 발생했습니다.");
//       }
//     };

//     // cleanup: optional
//     return () => {
//       (window as any).onNativeCameraResult = undefined;
//     };
//   }, [onUpload, route, setOcrData, setStep, setTempToken]);

//   const openNativeCamera = () => {
//     if ((window as any).ReactNativeWebView) {
//       (window as any).ReactNativeWebView.postMessage(
//         JSON.stringify({ type: "OPEN_CAMERA" }),
//       );
//     } else {
//       alert("모바일 앱에서만 사용 가능합니다.");
//     }
//   };

//   return (
//     <div className="flex h-full w-full flex-col items-center justify-center bg-black text-white">
//       <p className="mb-6 text-lg">자격증을 프레임에 맞게 촬영해주세요</p>

//       <button
//         onClick={openNativeCamera}
//         disabled={isLoading}
//         className="rounded-full bg-white px-6 py-4 text-black"
//       >
//         카메라 열기
//       </button>

//       {error && <p className="mt-4 text-red-500">{error}</p>}
//     </div>
//   );
// };

"use client";

import { useEffect, useCallback } from "react";
import { useSetAtom } from "jotai";
import { tempTokenAtom } from "@/store/tempToken";
import { useUpload } from "@/app/(auth)/signup/_hooks";

interface CameraPageProps {
  setStep: (step: number) => void;
  route: "학생" | "전문가";
  setOcrData: (data: any) => void;
}

// [핵심] Base64 -> File 객체 변환 유틸리티 함수
const dataURLtoFile = (dataurl: string, filename: string) => {
  const arr = dataurl.split(",");
  // data:image/png;base64 꼴에서 mime type 추출
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};

export const CameraPage = ({ setStep, route, setOcrData }: CameraPageProps) => {
  const { onUpload, isLoading, error } = useUpload();
  const setTempToken = useSetAtom(tempTokenAtom);

  // 의존성 배열 문제 해결을 위해 useCallback 사용 권장
  const handleNativeResult = useCallback(async (base64: string) => {
    try {
      // 1. Base64 문자열을 File 객체로 직접 변환 (fetch 사용 X)
      const file = dataURLtoFile(base64, "capture.png");

      console.log("File created:", file.name, file.size, file.type);

      // 2. 변환된 File로 업로드 훅 실행
      const result = await onUpload(
        file,
        route === "학생" ? "student" : "professional"
      );

      if (result?.success) {
        setTempToken(result.tempToken);
        setOcrData(result);
        setStep(4);
      } else {
        alert(result?.error || "OCR 인증 실패");
      }
    } catch (err) {
      console.error("onNativeCameraResult error:", err);
      alert("이미지 처리 중 오류가 발생했습니다.");
    }
  }, [onUpload, route, setStep, setOcrData, setTempToken]);

  useEffect(() => {
    // window 객체에 함수 바인딩
    (window as any).onNativeCameraResult = handleNativeResult;

    return () => {
      // 컴포넌트 언마운트 시 cleanup (선택 사항이나 메모리 누수 방지)
      // (window as any).onNativeCameraResult = null; 
    };
  }, [handleNativeResult]);

  const openNativeCamera = () => {
    // RN WebView인지 확인
    if ((window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(
        JSON.stringify({ type: "OPEN_CAMERA" })
      );
    } else {
      // 웹 브라우저 테스트용 (임시)
      alert("모바일 앱 환경에서만 카메라가 작동합니다.");
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-black text-white">
      <p className="mb-6 text-lg">자격증을 프레임에 맞게 촬영해주세요</p>

      <button
        onClick={openNativeCamera}
        disabled={isLoading}
        className="rounded-full bg-white px-6 py-4 text-black font-bold active:bg-gray-200"
      >
        {isLoading ? "처리중..." : "카메라 열기"}
      </button>

      {error && <p className="mt-4 text-red-500 text-center px-4">{error}</p>}
    </div>
  );
};