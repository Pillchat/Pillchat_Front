export type NotificationType =
  | "ANSWER"
  | "ADOPT"
  | "QUESTION"
  | "MATERIAL"
  | "SYSTEM";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export type PushSendType = "all" | "personal" | "topic";

export interface PushHistory {
  id: string;
  sendType: PushSendType;
  title: string;
  content: string;
  linkURL?: string;
  targetUserIds?: string[];
  topicName?: string;
  sentAt: string;
}
