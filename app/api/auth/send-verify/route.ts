import { NextRequest, NextResponse } from "next/server";
import { SignupFormData } from "@/app/(auth)/signup/page";

export const POST = async (request: NextRequest) => {
    const { email } = await request.json() as SignupFormData

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_HOST}/api/email/send`,
            {
                method: "POST",
                body: JSON.stringify({ email }),
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            const data = await response.json();
            return NextResponse.json(
                { error: data.reason || "이메일 인증에 실패하였습니다" },
                { status: response.status }
            );
        }

        return NextResponse.json({ message: "success" }, { status: 200 });
    }

    catch(error) {
        return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
    }
}