import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
    try {
        const formData = await request.formData();
        const userId = formData.get("userId");
        const files = formData.get("files");
        const type = formData.get("type");

        if (!userId || !files || !type) {
            return NextResponse.json(
                { success: false, message: "file과 type 필드는 필수입니다." },
                { status: 400 }
            );
        }

        const accessToken = request.headers.get("authorization") || "";
        const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}/api/files`, {
            method: "POST",
            body: formData,
            headers: {
                Authorization: accessToken,
            },
        });

        const data = await apiResponse.json();
       return NextResponse.json({
  success: true,
  ...data
}, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || "서버 오류" }, { status: 500 });
    }
};