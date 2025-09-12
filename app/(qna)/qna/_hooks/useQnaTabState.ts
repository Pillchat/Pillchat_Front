import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

type QnaStatus = "pending" | "completed";

const DEFAULT_STATUS: QnaStatus = "pending";

export const useQnaTabState = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus =
    (searchParams.get("status") as QnaStatus) || DEFAULT_STATUS;

  // URL에 status 파라미터가 없으면 기본값으로 리디렉션
  useEffect(() => {
    if (!searchParams.get("status")) {
      router.replace(`/qna?status=${DEFAULT_STATUS}`);
    }
  }, [router, searchParams]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", value);
    router.push(`/qna?${params.toString()}`);
  };

  return {
    currentStatus,
    handleTabChange,
  };
};
