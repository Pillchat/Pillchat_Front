import { fetchAPI } from "@/lib/client/fetch";
import {
  DEFAULT_NOTIFICATION_SETTING,
  NotificationSetting,
} from "@/types/notification";
import { useQuery } from "@tanstack/react-query";

export const notificationSettingsQueryKey = ["notification-settings"] as const;

const readBoolean = (
  source: Record<string, unknown>,
  camelKey: keyof NotificationSetting,
  snakeKey: string,
) => {
  const camelValue = source[camelKey];
  if (typeof camelValue === "boolean") return camelValue;

  const snakeValue = source[snakeKey];
  if (typeof snakeValue === "boolean") return snakeValue;

  return DEFAULT_NOTIFICATION_SETTING[camelKey];
};

export const normalizeNotificationSetting = (
  response: unknown,
): NotificationSetting => {
  const source =
    response && typeof response === "object" && "data" in response
      ? ((response as { data?: unknown }).data ?? response)
      : response;

  if (!source || typeof source !== "object")
    return DEFAULT_NOTIFICATION_SETTING;

  const record = source as Record<string, unknown>;

  return {
    notificationEnabled: readBoolean(
      record,
      "notificationEnabled",
      "notification_enabled",
    ),
    nightNotificationEnabled: readBoolean(
      record,
      "nightNotificationEnabled",
      "night_notification_enabled",
    ),
    answerNotificationEnabled: readBoolean(
      record,
      "answerNotificationEnabled",
      "answer_notification_enabled",
    ),
    adoptNotificationEnabled: readBoolean(
      record,
      "adoptNotificationEnabled",
      "adopt_notification_enabled",
    ),
    subjectQuestionEnabled: readBoolean(
      record,
      "subjectQuestionEnabled",
      "subject_question_enabled",
    ),
    subjectMaterialEnabled: readBoolean(
      record,
      "subjectMaterialEnabled",
      "subject_material_enabled",
    ),
    benefitNotificationEnabled: readBoolean(
      record,
      "benefitNotificationEnabled",
      "benefit_notification_enabled",
    ),
  };
};

export const getNotificationSettings = async () => {
  const response = await fetchAPI("/api/notification-settings", "GET");
  return normalizeNotificationSetting(response);
};

export const useNotificationSettingsQuery = () => {
  return useQuery<NotificationSetting>({
    queryKey: notificationSettingsQueryKey,
    queryFn: getNotificationSettings,
  });
};
