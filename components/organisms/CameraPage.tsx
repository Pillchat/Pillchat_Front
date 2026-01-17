"use client";

import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { tempTokenAtom } from "@/store/tempToken";
import { useUpload } from "@/app/(auth)/signup/_hooks";

interface CameraPageProps {
  setStep: (step: number) => void;
  route: "학생" | "전문가";
  setOcrData: (data: any) => void;
}

export const CameraPage = ({ setStep, route, setOcrData }: CameraPageProps) => {
  const { onUpload, isLoading, error } = useUpload();
  const setTempToken = useSetAtom(tempTokenAtom);

  useEffect(() => {
    // RN에서 보낸 data URI (base64) 받는 핸들러.
    (window as any).onNativeCameraResult = async (base64: string) => {
      try {
        const res = await fetch(base64); // data URI를 fetch하면 blob 얻음
        const blob = await res.blob();
        const file = new File([blob], "capture.png", { type: "image/png" });

        const result = await onUpload(
          file,
          route === "학생" ? "student" : "professional",
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
    };

    // cleanup: optional
    return () => {
      (window as any).onNativeCameraResult = undefined;
    };
  }, [onUpload, route, setOcrData, setStep, setTempToken]);

  const openNativeCamera = () => {
    if ((window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(
        JSON.stringify({ type: "OPEN_CAMERA" }),
      );
    } else {
      alert("모바일 앱에서만 사용 가능합니다.");
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-black text-white">
      <p className="mb-6 text-lg">자격증을 프레임에 맞게 촬영해주세요</p>

      <button
        onClick={openNativeCamera}
        disabled={isLoading}
        className="rounded-full bg-white px-6 py-4 text-black"
      >
        카메라 열기
      </button>

      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
};
