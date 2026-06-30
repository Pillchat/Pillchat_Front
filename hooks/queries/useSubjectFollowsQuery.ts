import { fetchAPI } from "@/lib/client/fetch";
import { useQuery } from "@tanstack/react-query";

export type SubjectFollow = {
  subjectId: number;
  subjectName?: string;
  [key: string]: unknown;
};

export const subjectFollowsQueryKey = ["subject-follows"] as const;

export const getSubjectFollows = async () => {
  const response = await fetchAPI("/api/subject-follows", "GET");
  const data =
    response && typeof response === "object" && "data" in response
      ? (response as { data?: unknown }).data
      : response;

  return Array.isArray(data) ? (data as SubjectFollow[]) : [];
};

export const useSubjectFollowsQuery = () => {
  return useQuery<SubjectFollow[]>({
    queryKey: subjectFollowsQueryKey,
    queryFn: getSubjectFollows,
  });
};
