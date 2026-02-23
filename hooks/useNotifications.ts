import { useAtom } from "jotai";
import { useCallback } from "react";
import { notificationsAtom } from "@/store/notification";
import { Notification, NotificationType } from "@/types/notification";

export const useNotifications = () => {
  const [notifications, setNotifications] = useAtom(notificationsAtom);

  const addNotification = useCallback(
    (params: {
      type: NotificationType;
      title: string;
      content: string;
      link?: string;
    }) => {
      const newNotification: Notification = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: params.type,
        title: params.title,
        content: params.content,
        link: params.link,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    [setNotifications],
  );

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    },
    [setNotifications],
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, [setNotifications]);

  const removeNotification = useCallback(
    (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [setNotifications],
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  };
};
