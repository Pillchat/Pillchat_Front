import { useState } from "react";

export const useReportType = () => {
  const [reportTypes, setReportTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onReportType = async () => {
    setIsLoading(true);
    setError(null);
    setReportTypes([
        "부적절한 언어 사용",
        "허위 · 왜곡 정보",
        "의약 · 약학적 사실과 다른 내용 유포",
        "광고 및 스팸",
        "특정 상품 · 서비스 홍보",
        "반복적, 무의미한 게시글 및 댓글",
        "개인정보 노출",
        "주제와 무관환 내용",
        "괴롭힘 · 따돌림",
        "기타"
    ])
    return reportTypes;
  };

  return { reportTypes, isLoading, error, onReportType };
};
