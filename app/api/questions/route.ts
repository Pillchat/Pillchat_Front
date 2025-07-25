import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { QuestionCreateRequest } from "@/types/question";
import { serverFetch } from "@/lib/functions";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST;

export async function POST(request: NextRequest) {
  try {
    const { title, content, subjectId, reward }: QuestionCreateRequest =
      await request.json();

    const authorization = request.headers.get("authorization");
    //TODO: JSON 형식으로 변경
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("subjectId", subjectId);
    if (reward) {
      formData.append("reward", reward);
    }

    const response = await axios.post(
      `${API_BASE_URL}/api/questions`,
      formData, // FormData 객체를 직접 전달
      { headers: { Authorization: authorization } },
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error("질문 생성 API 에러:", error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const data = error.response?.data || { message: "백엔드 서버 오류" };
      return NextResponse.json(data, { status });
    }

    return NextResponse.json(
      { message: "서버 내부 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const data = await serverFetch("/api/questions", {
      method: "GET",
      request,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("질문 목록 조회 API 에러:", error);

    const errorInfo = JSON.parse(error.message || "{}");
    return NextResponse.json(
      { message: errorInfo.message || "질문 목록을 불러오는데 실패했습니다." },
      { status: errorInfo.status || 500 },
    );
  }
}
