import { fetchAPI } from "@/lib/client/fetch";
import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

export const consentToOpenNotification = async () => {
  await fetchAPI("/api/notification-consents", "POST");
};

export const useNotificationConsentMutation = <TContext = unknown>(
  options?: UseMutationOptions<void, Error, void, TContext>,
) => {
  return useMutation<void, Error, void, TContext>({
    mutationFn: consentToOpenNotification,
    ...options,
  });
};
