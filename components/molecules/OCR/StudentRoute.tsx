import { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { useSetAtom } from "jotai"; // Jotai 상태 설정을 위한 useSetAtom
import { studentInfoAtom } from "@/components/atoms/StudentAtomOCR";

const StudentCameraOCR = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const setStudentInfo = useSetAtom(studentInfoAtom); // Jotai 상태 설정 함수

  useEffect(() => {
    // 카메라 시작
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });

    // OCR 주기적 실행
    const interval = setInterval(captureAndRecognize, 3000); // 3초마다 실행

    return () => clearInterval(interval);
  }, []);

  // OCR 후 필요한 정보를 추출하는 함수
  const extractInfo = (text: string) => {
    const nameRegex = /이름\s*[:：]?\s*(\S+)/;
    const schoolRegex = /학교\s*[:：]?\s*(\S+)/;
    const departmentRegex = /학과\s*[:：]?\s*(\S+)/;
    const studentIdRegex = /학번\s*[:：]?\s*(\d{6,10})/;

    const nameMatch = text.match(nameRegex);
    const schoolMatch = text.match(schoolRegex);
    const departmentMatch = text.match(departmentRegex);
    const studentIdMatch = text.match(studentIdRegex);

    return {
      studentName: nameMatch ? nameMatch[1] : "",
      school: schoolMatch ? schoolMatch[1] : "",
      department: departmentMatch ? departmentMatch[1] : "",
      studentId: studentIdMatch ? studentIdMatch[1] : "",
    };
  };

  // OCR 캡처 후 인식
  const captureAndRecognize = async () => {
    if (!videoRef.current || !canvasRef.current || isRecognizing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 프레임의 중앙 영역만 캡처 (프레임 비율과 일치하게)
    const w = video.videoWidth;
    const h = video.videoHeight;

    const frameWidth = w * 0.8;
    const frameHeight = h * 0.5;
    const sx = (w - frameWidth) / 2;
    const sy = (h - frameHeight) / 2;

    canvas.width = frameWidth;
    canvas.height = frameHeight;

    ctx.drawImage(
      video,
      sx,
      sy,
      frameWidth,
      frameHeight,
      0,
      0,
      frameWidth,
      frameHeight,
    );

    setIsRecognizing(true);
    const { data } = await Tesseract.recognize(canvas, "eng+kor", {
      logger: (m) => console.log(m),
    });

    console.log("📸 OCR 결과:", data.text);

    // OCR 결과에서 필요한 정보 추출
    const studentInfo = extractInfo(data.text);

    // 학생증 정보가 포함되었으면, 다음 단계로 이동
    if (
      studentInfo.studentName &&
      studentInfo.school &&
      studentInfo.department &&
      studentInfo.studentId
    ) {
      alert("학생증이 인식되었습니다!");

      // Jotai 상태에 학생 정보 저장
      setStudentInfo(studentInfo);
    }

    setIsRecognizing(false);
  };

  return (
    <div className="relative h-[calc(100vh-60px)] w-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute left-0 top-0 h-full w-full object-cover"
      />

      {/* OCR용 캔버스 (화면엔 보이지 않음) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 안내 문구 */}
      <div className="absolute left-1/2 top-[10%] flex w-full -translate-x-1/2 transform justify-center text-center">
        <p className="font-[pretendard] text-[17px] font-medium text-white">
          프레임에 맞게 촬영해주세요
        </p>
      </div>

      {/* 프레임 */}
      <div className="pointer-events-none absolute left-1/2 top-[40%] h-1/2 w-4/5 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-white" />
    </div>
  );
};

export default StudentCameraOCR;
