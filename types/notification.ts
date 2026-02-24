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
