// import { NextRequest, NextResponse } from "next/server";

// export const runtime = "nodejs";
// export const POST = async (request: NextRequest) => {
//   try {
//     const formData = await request.formData();
//     const file = formData.get("file") as Blob | null;
//     const docType = formData.get("type") as string | null;

//     if (!file || !docType) {
//       return NextResponse.json(
//         { error: "file과 type 필드는 필수입니다." },
//         { status: 400 },
//       );
//     }

//     const filename = (file as any).name || "capture.jpg";
//     const mime = file.type || "image/jpeg";
//     const ab = await file.arrayBuffer();
//     const convertedFile = new File([new Uint8Array(ab)], filename, {
//       type: mime,
//     });

//     const forward = new FormData();
//     forward.append("file", convertedFile, filename);
//     forward.append("type", docType);

//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/ocr-verify`,
//       {
//         method: "POST",
//         body: forward,
//       },
//     );

//     const data = await response.json();

//     if (!response.ok) {
//       return NextResponse.json(
//         { error: data.reason || "OCR 인증 실패" },
//         { status: response.status },
//       );
//     }

//     return NextResponse.json(data, { status: 200 });
//   } catch (error) {
//     console.error("OCR 업로드 오류:", error);
//     return NextResponse.json(
//       { error: "서버 오류가 발생했습니다." },
//       { status: 500 },
//     );
//   }
// };

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export const POST = async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;
    const docType = formData.get("type") as string | null;

    if (!file || !docType) {
      return NextResponse.json(
        { error: "파일과 타입 정보가 없습니다." },
        { status: 400 },
      );
    }

    // 백엔드로 보낼 새로운 FormData 생성
    const forward = new FormData();
    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = new Blob([buffer], { type: file.type });
    
    forward.append("file", blob, (file as any).name || "capture.png");
    forward.append("type", docType);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/ocr-verify`,
      {
        method: "POST",
        body: forward,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.reason || "OCR 인증 실패" },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("OCR API Route Error:", error);
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 },
    );
  }
};