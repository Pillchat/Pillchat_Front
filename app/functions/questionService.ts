import { QuestionCreateRequest, QuestionResponse } from "@/types/question";

export const createQuestion = async (
  data: QuestionCreateRequest,
): Promise<QuestionResponse> => {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/questions", {
    method: "POST",
    body: JSON.stringify(data),
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        `API Error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};

export const getQuestions = async (): Promise<QuestionResponse[]> => {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/questions", {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch questions: ${response.status}`);
  }

  return response.json();
};
