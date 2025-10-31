import { useEffect, useState } from "react";

interface Question {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

interface Answer {
  id: number;
  content: string;
  createdAt: string;
  question: Question; // ✅ 답변이 참조하는 질문 정보
}

interface UseMyAnswersReturn {
  data: Answer[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMyAnswers(token?: string): UseMyAnswersReturn {
  const [data, setData] = useState<Answer[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnswers = async () => {
    if (!token) {
      setError("토큰이 없습니다.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/archive/myAnswers", {
        headers: { Authorization: token },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error("내 답변 목록 API 에러:", err);
      setError("내 답변 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAnswers();
  }, [token]);

  return { data, loading, error, refetch: fetchAnswers };
}
