import { atomWithStorage } from "jotai/utils";
import {
  DEFAULT_NOTIFICATION_SETTING,
  NotificationSetting,
} from "@/types/notification";

export const notificationSettingAtom = atomWithStorage<NotificationSetting>(
  "notificationSetting",
  DEFAULT_NOTIFICATION_SETTING,
);

export const answerNotificationAtom = atomWithStorage(
  "answerNotification",
  DEFAULT_NOTIFICATION_SETTING.answerNotificationEnabled,
);
export const adoptNotificationAtom = atomWithStorage(
  "adoptNotification",
  DEFAULT_NOTIFICATION_SETTING.adoptNotificationEnabled,
);
export const subjectQuestionAtom = atomWithStorage(
  "subjectQuestion",
  DEFAULT_NOTIFICATION_SETTING.subjectQuestionEnabled,
);
export const subjectMaterialAtom = atomWithStorage(
  "subjectMaterial",
  DEFAULT_NOTIFICATION_SETTING.subjectMaterialEnabled,
);
export const adNotificationAtom = atomWithStorage(
  "adNotification",
  DEFAULT_NOTIFICATION_SETTING.benefitNotificationEnabled,
);
export const nightAdNotificationAtom = atomWithStorage(
  "nightAdNotification",
  DEFAULT_NOTIFICATION_SETTING.nightNotificationEnabled,
);
