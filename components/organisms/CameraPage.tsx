import { useRef, useState, useEffect } from "react";
import { useSetAtom } from "jotai";

const CameraPage = () => {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        // 카메라 시작
        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        });
    }, []);

    return(
        <div className="relative h-[calc(100vh-60px)] w-full bg-black">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute left-0 top-0 h-full w-full object-cover"
            />

            {/* 안내 문구 */}
            <div className="absolute left-1/2 top-[10%] flex w-full -translate-x-1/2 transform justify-center text-center">
                <p className="font-[pretendard] text-[17px] font-medium text-white">
                프레임에 맞게 촬영해주세요
                </p>
            </div>

            {/* 프레임 */}
            <div className="pointer-events-none absolute left-1/2 top-[52%] h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-white" />
        </div>
    )
}

export default CameraPage