"use client";

import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomHeader } from "@/components/molecules";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDiffDate } from "@/lib/functions";
import { Notification, NotificationType } from "@/types/notification";

const NOTIFICATION_ICON: Record<NotificationType, string> = {
  ANSWER: "/QuestionWithBubble.svg",
  ADOPT: "/Like.svg",
  QUESTION: "/QuestionWithBubble.svg",
  MATERIAL: "/QuestionWithBubble.svg",
  SYSTEM: "/BellColor.svg",
};

const NotificationItem: FC<{
  notification: Notification;
  onRead: (id: string) => void;
  onNavigate: (link?: string) => void;
}> = ({ notification, onRead, onNavigate }) => {
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    onRead(notification.id);

    if (expanded && notification.link) {
      onNavigate(notification.link);
      return;
    }

    setExpanded((prev) => !prev);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex cursor-pointer gap-3 px-6 py-4 transition-colors ${
        notification.isRead ? "bg-white" : "bg-blue-50/50"
      }`}
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
        <img
          src={NOTIFICATION_ICON[notification.type]}
          alt={notification.type}
          className="h-5 w-5"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm ${notification.isRead ? "text-muted-foreground" : "font-semibold text-foreground"}`}
        >
          {notification.title}
        </p>
        <p
          className={`mt-1 text-xs text-muted-foreground ${expanded ? "whitespace-pre-wrap" : "truncate"}`}
        >
          {notification.content}
        </p>
        {expanded && notification.link && (
          <p className="mt-1 text-xs text-brand">자세히 보기</p>
        )}
        <p className="mt-1 text-xs text-border">
          {formatDiffDate(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-brand" />
      )}
    </div>
  );
};

const NotificationsPage: FC = () => {
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead, clearAll } =
    useNotifications();

  const handleNavigate = (link?: string) => {
    if (link) {
      router.push(link);
    }
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CustomHeader title="알림" />

      {notifications.length > 0 && (
        <div className="flex items-center justify-end gap-3 px-6 py-2">
          {hasUnread && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              모두 읽음
            </button>
          )}
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            전체 삭제
          </button>
        </div>
      )}

      <div className="flex-1">
        {notifications.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-20">
            <img
              src="/Bell.svg"
              alt="no notifications"
              className="mb-4 h-12 w-12 opacity-30"
            />
            <p className="text-sm text-border">알림이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
