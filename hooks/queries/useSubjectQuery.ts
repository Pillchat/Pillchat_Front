import { fetchAPI } from "@/lib/client/fetch";
import { useQuery } from "@tanstack/react-query";

export type SubjectDetail = {
  id: number;
  code: string;
  name: string;
  categoryName: string;
};

export const subjectQueryKey = (subjectCode?: string | null) =>
  ["subject", subjectCode] as const;

export const getSubject = (subjectCode: string) => {
  return fetchAPI(
    `/api/subjects/${encodeURIComponent(subjectCode)}`,
    "GET",
  ) as Promise<SubjectDetail>;
};

export const useSubjectQuery = (subjectCode?: string | null) => {
  return useQuery<SubjectDetail>({
    queryKey: subjectQueryKey(subjectCode),
    queryFn: () => getSubject(subjectCode as string),
    enabled: Boolean(subjectCode),
  });
};
