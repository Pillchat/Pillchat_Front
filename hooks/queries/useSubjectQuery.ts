import { fetchAPI } from "@/lib/client/fetch";
import { useQuery } from "@tanstack/react-query";

export const subjectQueryKey = (subjectCode?: string | null) =>
  ["subject", subjectCode] as const;

export const getSubject = (subjectCode: string) => {
  return fetchAPI(`/api/subjects/${subjectCode}`, "GET");
};

export const useSubjectQuery = (subjectCode?: string | null) => {
  return useQuery({
    queryKey: subjectQueryKey(subjectCode),
    queryFn: () => getSubject(subjectCode as string),
    enabled: Boolean(subjectCode),
  });
};
