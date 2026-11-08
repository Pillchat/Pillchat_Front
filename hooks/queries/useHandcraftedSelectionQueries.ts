"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/client/fetch";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import type { SubjectOption } from "@/lib/learning/handcraftedSubjects";
export function useHandcraftedSubjectsQuery() {
  const user = useAuthIdentity();
  return useQuery({
    queryKey: ["handcrafted-subject-directory", user],
    enabled: !!user,
    queryFn: async (): Promise<SubjectOption[]> => {
      const raw = await fetchAPI(
        "/api/questionbank/ai-questions/subjects",
        "GET",
      );
      const data = raw.data ?? raw;
      if (!Array.isArray(data))
        throw new Error("과목 목록을 불러오지 못했습니다.");
      return data;
    },
  });
}
export function useHandcraftedAvailabilityQuery(
  subjectId?: string,
  topicId?: string,
) {
  const user = useAuthIdentity();
  return useQuery({
    queryKey: ["handcrafted-availability", user, subjectId, topicId],
    enabled: !!user && !!subjectId,
    staleTime: 0,
    queryFn: () =>
      fetchAPI("/api/learning/handcrafted/availability", "GET", {
        subjectId,
        ...(topicId ? { topicId } : {}),
      }) as Promise<{
        newCount: number;
        answeredCount: number;
        inProgressCount: number;
        weaknessCount: number;
      }>,
  });
}
