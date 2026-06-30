import { fetchAPI } from "@/lib/client/fetch";
import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

export type SetSubjectFollowPayload = {
  subjectId: number | string;
  subjectLabel?: string;
  followed: boolean;
};

export const setSubjectFollow = ({
  subjectId,
  followed,
}: SetSubjectFollowPayload) => {
  return fetchAPI(
    `/api/subject-follows/${encodeURIComponent(String(subjectId))}`,
    followed ? "POST" : "DELETE",
  );
};

export const useSetSubjectFollowMutation = <TContext = unknown>(
  options?: UseMutationOptions<any, Error, SetSubjectFollowPayload, TContext>,
) => {
  return useMutation<any, Error, SetSubjectFollowPayload, TContext>({
    mutationFn: setSubjectFollow,
    ...options,
  });
};
