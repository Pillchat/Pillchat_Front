"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useSetAtom } from "jotai";
import { tempTokenAtom } from "@/store/tempToken";
import { useUpload } from "@/app/(auth)/signup/_hooks";

interface CameraPageProps {
  setStep: (step: number) => void;
  route: "학생" | "전문가";
  setOcrData: (data: any) => void;
}

export const CameraPage: React.FC<CameraPageProps> = ({
  setStep,
  route,
  setOcrData,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );
  const { onUpload, isLoading, error } = useUpload();
  const setTempToken = useSetAtom(tempTokenAtom);

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  useEffect(() => {
    const initCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput",
        );
        const rearCamera = videoDevices.find((device) =>
          device.label.toLowerCase().includes("back"),
        );
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: rearCamera ? { exact: rearCamera.deviceId } : undefined,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: "environment",
          },
          audio: false,
        };

        const mediaStream =
          await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("카메라 접근 실패:", err);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const handleOrientationChange = () => {
      if (window.matchMedia("(orientation: landscape)").matches) {
        setOrientation("landscape");
      } else {
        setOrientation("portrait");
      }
    };

    handleOrientationChange();
    window.addEventListener("resize", handleOrientationChange);

    return () => window.removeEventListener("resize", handleOrientationChange);
  }, []);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const frame = document.querySelector(".capture-frame") as HTMLElement;
    if (frame) {
      const videoRect = video.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();

      const scaleX = video.videoWidth / videoRect.width;
      const scaleY = video.videoHeight / videoRect.height;

      const sx = (frameRect.left - videoRect.left) * scaleX;
      const sy = (frameRect.top - videoRect.top) * scaleY;
      const sw = frameRect.width * scaleX;
      const sh = frameRect.height * scaleY;

      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
        const croppedImage = canvas.toDataURL("image/png");
        setImgSrc(croppedImage);

        const file = dataURLtoFile(croppedImage, "capture.png");
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
      }
    }
  }, [onUpload, setStep, route, setOcrData, setTempToken]);

  return (
    <div className="relative h-[calc(100vh-60px)] w-full bg-black">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute left-0 top-0 h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-white">
          카메라 접근 권한이 거부되어 촬영할 수 없습니다. 인증을 위해 브라우저를
          통해 카메라 권한을 허용해주세요.
        </div>
      )}

      <div className="absolute left-1/2 top-[2%] flex w-full -translate-x-1/2 transform justify-center text-center text-white">
        <p className="font-[pretendard] text-[17px] font-medium">
          프레임에 맞게 촬영해주세요 ({orientation})
        </p>
      </div>

      {orientation === "portrait" ? (
        <div className="capture-frame pointer-events-none absolute left-1/2 top-[45%] h-[60%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-white" />
      ) : (
        <div className="capture-frame pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-white" />
      )}

      {orientation === "portrait" ? (
        <div className="absolute bottom-[70px] left-1/2 -translate-x-1/2">
          <button
            onClick={handleCapture}
            className="rounded-full bg-white px-4 py-4 text-black shadow-md"
            disabled={isLoading}
          >
            <img src={"/Camera_Vector.svg"} alt="촬영버튼" />
          </button>
          {error && <div className="mt-2 text-red-500">{error}</div>}
        </div>
      ) : (
        <div className="absolute right-[20px] top-1/2 -translate-y-1/2">
          <button
            onClick={handleCapture}
            className="rounded-full bg-white px-4 py-4 text-black shadow-md"
            disabled={isLoading}
          >
            <img src={"/Camera_Vector.svg"} alt="촬영버튼" />
          </button>
          {error && <div className="mt-2 text-red-500">{error}</div>}
        </div>
      )}
    </div>
  );
};
