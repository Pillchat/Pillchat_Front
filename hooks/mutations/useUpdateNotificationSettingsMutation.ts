import { fetchAPI } from "@/lib/client/fetch";
import {
  NotificationSetting,
  NotificationSettingUpdateRequest,
} from "@/types/notification";
import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import { normalizeNotificationSetting } from "../queries/useNotificationSettingsQuery";

export const updateNotificationSettings = async (
  data: NotificationSettingUpdateRequest,
) => {
  const response = await fetchAPI("/api/notification-settings", "PUT", data);
  return normalizeNotificationSetting(response);
};

export const useUpdateNotificationSettingsMutation = <TContext = unknown>(
  options?: UseMutationOptions<
    NotificationSetting,
    Error,
    NotificationSettingUpdateRequest,
    TContext
  >,
) => {
  return useMutation<
    NotificationSetting,
    Error,
    NotificationSettingUpdateRequest,
    TContext
  >({
    mutationFn: updateNotificationSettings,
    ...options,
  });
};
