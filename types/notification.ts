export type BackendNotificationType =
  | "ANSWER"
  | "ADOPT"
  | "SUBJECT_NEW_QUESTION"
  | "SUBJECT_NEW_MATERIAL"
  | "BENEFIT"
  | "EVENING_STUDY_REMINDER"
  | "SYSTEM";

export type LegacyNotificationType = "QUESTION" | "MATERIAL";

export type NotificationType = BackendNotificationType | LegacyNotificationType;

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationSetting {
  notificationEnabled: boolean;
  nightNotificationEnabled: boolean;
  answerNotificationEnabled: boolean;
  adoptNotificationEnabled: boolean;
  subjectQuestionEnabled: boolean;
  subjectMaterialEnabled: boolean;
  benefitNotificationEnabled: boolean;
}

export type NotificationSettingUpdateRequest = Partial<NotificationSetting>;

export interface NotificationConsentStatus {
  agreed: boolean;
  surveyCompleted: boolean;
}

export type ExpectedFeature =
  | "AI_FLASHCARD"
  | "QUESTION_BANK";

export interface ExpectedFeatureSurveyRequest {
  expectedFeature: ExpectedFeature;
  additionalOpinion?: string | null;
}

export const DEFAULT_NOTIFICATION_SETTING: NotificationSetting = {
  notificationEnabled: true,
  nightNotificationEnabled: false,
  answerNotificationEnabled: true,
  adoptNotificationEnabled: true,
  subjectQuestionEnabled: true,
  subjectMaterialEnabled: true,
  benefitNotificationEnabled: true,
};

export type AdminPushNotificationType = Extract<
  BackendNotificationType,
  "BENEFIT" | "SYSTEM"
>;

export type PushSendType = "all" | "personal" | "topic";

export interface PushHistory {
  id: string;
  sendType: PushSendType;
  notificationType?: AdminPushNotificationType;
  title: string;
  content: string;
  linkURL?: string;
  targetUserIds?: string[];
  topicName?: string;
  sentAt: string;
}
