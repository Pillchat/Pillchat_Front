import { fetchAPI } from "@/lib/client/fetch";
import { NotificationConsentStatus } from "@/types/notification";
import { useQuery } from "@tanstack/react-query";

export const notificationConsentQueryKey = (userId: string) =>
  ["notification-consent", userId] as const;

export const normalizeNotificationConsentStatus = (
  response: unknown,
): NotificationConsentStatus => {
  const source =
    response && typeof response === "object" && "data" in response
      ? ((response as { data?: unknown }).data ?? response)
      : response;

  if (!source || typeof source !== "object") return { agreed: false };

  return {
    agreed: (source as Record<string, unknown>).agreed === true,
  };
};

export const getNotificationConsentStatus = async () => {
  const response = await fetchAPI("/api/notification-consents/me", "GET");
  return normalizeNotificationConsentStatus(response);
};

export const useNotificationConsentQuery = (userId: string | null) => {
  return useQuery<NotificationConsentStatus>({
    queryKey: notificationConsentQueryKey(userId ?? "anonymous"),
    queryFn: getNotificationConsentStatus,
    enabled: Boolean(userId),
  });
};
