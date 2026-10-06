"use client";

import { PUBLIC_ASSETS } from "@/constants/assets";
import { FC, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { CustomHeader } from "@/components/molecules";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDiffDate } from "@/lib/shared/date";
import { Notification, NotificationType } from "@/types/notification";

const NOTIFICATION_ICON: Record<NotificationType, string> = {
  ANSWER: PUBLIC_ASSETS.icons.questionBubble,
  ADOPT: PUBLIC_ASSETS.icons.like,
  SUBJECT_NEW_QUESTION: PUBLIC_ASSETS.icons.questionBubble,
  SUBJECT_NEW_MATERIAL: PUBLIC_ASSETS.icons.questionBubble,
  BENEFIT: PUBLIC_ASSETS.icons.bellColored,
  EVENING_STUDY_REMINDER: PUBLIC_ASSETS.icons.bellColored,
  QUESTION: PUBLIC_ASSETS.icons.questionBubble,
  MATERIAL: PUBLIC_ASSETS.icons.questionBubble,
  NEW_FOLLOWER: PUBLIC_ASSETS.icons.bellColored,
  SYSTEM: PUBLIC_ASSETS.icons.bellColored,
};

const NotificationItem: FC<{
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (link?: string) => void;
}> = ({ notification, onRead, onDelete, onNavigate }) => {
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
      <button
        aria-label={`${notification.title} 알림 삭제`}
        className="self-start text-xs text-muted-foreground"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
      >
        삭제
      </button>
      {!notification.isRead && (
        <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-brand" />
      )}
    </div>
  );
};

const NotificationsPage: FC = () => {
  const router = useRouter();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
    isLoading,
    error,
    hasNextPage,
    loadMore,
    isFetchingNextPage,
  } = useNotifications();

  const handleNavigate = (link?: string) => {
    if (link?.startsWith("/") && !link.startsWith("//")) {
      router.push(link);
    }
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="flex min-h-dvh flex-col bg-white">
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
        {error ? (
          <p role="alert" className="p-6 text-destructive">
            {error}
          </p>
        ) : isLoading ? (
          <p className="p-6">알림을 불러오는 중입니다.</p>
        ) : notifications.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-20">
            <img
              src={PUBLIC_ASSETS.icons.bell}
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
                onDelete={removeNotification}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}
        {hasNextPage && (
          <button
            className="w-full p-4 text-brand"
            disabled={isFetchingNextPage}
            onClick={() => void loadMore()}
          >
            더 보기
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
