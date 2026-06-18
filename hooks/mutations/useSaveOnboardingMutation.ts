import { fetchAPI } from "@/lib/client/fetch";
import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type SaveOnboardingPayload = {
  role: string;
  data: any;
};

export const saveOnboarding = async ({ role, data }: SaveOnboardingPayload) => {
  const response = await fetchAPI(`/api/onboarding/${role}`, "PUT", data);
  return response?.data ?? response;
};

export const useSaveOnboardingMutation = (
  options?: UseMutationOptions<any, Error, SaveOnboardingPayload>,
) => {
  return useMutation({
    mutationFn: saveOnboarding,
    ...options,
  });
};
