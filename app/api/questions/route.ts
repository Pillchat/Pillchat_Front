import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { title, content, subjectId } = await request.json();

    // Authorization 헤더에서 Bearer 토큰 추출
    const authorization = request.headers.get("authorization");

    // 백엔드로 전달할 FormData 생성
    const backendFormData = new FormData();
    backendFormData.append("title", title);
    backendFormData.append("content", content);
    backendFormData.append("subjectId", subjectId);

    const headers: Record<string, string> = {
      // FormData 사용 시 Content-Type 설정하지 않음 (axios가 자동으로 설정)
    };

    // Bearer 토큰이 있으면 백엔드에 전달
    if (authorization) {
      headers["Authorization"] = authorization;
    }

    const response = await axios.post(
      process.env.NEXT_PUBLIC_API_HOST + "/api/questions",
      backendFormData,
      { headers },
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error(error);
    const status = error.response?.status || 500;
    const data = error.response?.data || { message: "Internal Server Error" };

    return NextResponse.json(data, { status });
  }
}
