import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await request.json().catch(() => ({}));

    return NextResponse.json(
      {
        message:
          "토픽 직접 발송은 알림 설정 필터를 우회하므로 지원하지 않습니다. 관심 과목 알림은 게시물/자료 등록 이벤트에서 백엔드 PushJob 파이프라인으로 발송됩니다.",
      },
      { status: 501 },
    );
  } catch (error) {
    console.error("토픽 푸시 발송 API 에러:", error);
    return NextResponse.json(
      { message: "토픽 푸시 발송을 처리할 수 없습니다." },
      { status: 500 },
    );
  }
}
