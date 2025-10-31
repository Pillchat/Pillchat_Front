// import { useEffect, useState } from "react";

// interface Question {
//   id?: number;
//   title?: string;
//   content?: string;
//   createdAt: string;
//   question?: {
//     id?: number;
//     title?: string;
//     content?: string;
//   };
// }

// interface UseMyQuestionsReturn {
//   data: Question[] | null;
//   loading: boolean;
//   error: string | null;
//   refetch: () => Promise<void>;
// }

// export function useMyQuestions(token?: string): UseMyQuestionsReturn {
//   const [data, setData] = useState<Question[] | null>(null);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);

//   const fetchQuestions = async () => {
//     if (!token) {
//       setError("토큰이 없습니다.");
//       return;
//     }

//     try {
//       setLoading(true);
//       setError(null);

//       const response = await fetch("/api/archive/myQuestions", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const result = await response.json();
//       setData(result);
//     } catch (err: any) {
//       console.error("내 질문 목록 API 에러:", err);
//       setError("내 질문 목록을 불러오지 못했습니다.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (token) fetchQuestions();
//   }, [token]);

//   return { data, loading, error, refetch: fetchQuestions };
// }

// useMyQuestions.ts

import { useEffect, useState } from "react";

interface Question {
  id?: number;
  title?: string;
  content?: string;
  createdAt: string;
  question?: {
    id?: number;
    title?: string;
    content?: string;
  };
}

interface UseMyQuestionsReturn {
  data: Question[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMyQuestions(token?: string): UseMyQuestionsReturn {
  const [data, setData] = useState<Question[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    if (!token) {
      setError("토큰이 없습니다.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/archive/myQuestions", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error("내 질문 목록 API 에러:", err);
      setError("내 질문 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchQuestions();
  }, [token]);

  return { data, loading, error, refetch: fetchQuestions };
}
