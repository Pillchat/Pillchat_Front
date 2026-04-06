"use client";

import { FC, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/functions";

const OnboardingPage: FC = () => {
  const router = useRouter();

  useEffect(() => {
    const redirectToRole = async () => {
      try {
        const result = await fetchAPI("/api/auth/inquiry-myprofile", "GET");
        const userType = result?.data?.userType;
        const role = userType === "PROFESSIONAL" ? "professional" : "student";

        router.replace(`/onboarding/${role}`);
      } catch (error) {
        console.error("온보딩 리다이렉트 실패:", error);
        router.replace("/login");
      }
    };

    redirectToRole();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">불러오는 중...</p>
    </div>
  );
};

export default OnboardingPage;
