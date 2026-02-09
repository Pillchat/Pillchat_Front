// import { NextRequest, NextResponse } from "next/server";
// import { SignupFormData } from "@/app/(auth)/signup/page";

// export const POST = async (request: NextRequest) => {
//   const { email } = (await request.json()) as SignupFormData;

//   try {
//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_API_HOST}/api/email/send`,
//       {
//         method: "POST",
//         body: JSON.stringify({ email }),
//         headers: {
//           "Content-Type": "application/json",
//         },
//       },
//     );

//     if (!response.ok) {
//       const data = await response.json();
//       return NextResponse.json(
//         { error: data.reason || "이메일 인증에 실패하였습니다" },
//         { status: response.status },
//       );
//     }

//     return NextResponse.json({ message: "success" }, { status: 200 });
//   } catch (error) {
//     return NextResponse.json(
//       { error: "서버 오류가 발생했습니다" },
//       { status: 500 },
//     );
//   }
// };

import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  // 클라이언트에서 { email: "..." } 형태로 보냄
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json(
      { error: "이메일을 입력해주세요." },
      { status: 400 },
    );
  }

  try {
    // 백엔드 서버로 요청 전달
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_HOST}/api/email/send`,
      {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: {
          "Content-Type": "application/json",
          // 백엔드 API가 토큰 없이도 이메일 발송을 허용하는지 확인 필요 (보통 허용함)
        },
      },
    );

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { error: data.reason || data.message || "이메일 인증 발송 실패" },
        { status: response.status },
      );
    }

    return NextResponse.json({ message: "success" }, { status: 200 });
  } catch (error) {
    console.error("Email send proxy error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
};
