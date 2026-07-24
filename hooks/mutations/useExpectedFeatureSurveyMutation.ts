import { fetchAPI } from "@/lib/client/fetch";
import type { ExpectedFeatureSurveyRequest } from "@/types/notification";
import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

export const submitExpectedFeatureSurvey = async (
  request: ExpectedFeatureSurveyRequest,
) => {
  await fetchAPI("/api/notification-consents/survey", "POST", request);
};

export const useExpectedFeatureSurveyMutation = <TContext = unknown>(
  options?: UseMutationOptions<
    void,
    Error,
    ExpectedFeatureSurveyRequest,
    TContext
  >,
) => {
  return useMutation<void, Error, ExpectedFeatureSurveyRequest, TContext>({
    mutationFn: submitExpectedFeatureSurvey,
    ...options,
  });
};
