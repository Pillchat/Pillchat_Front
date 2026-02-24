import { useCallback } from "react";
import { useNotifications } from "./useNotifications";
import { NotificationType } from "@/types/notification";

declare global {
  interface Window {
    Nachocode?: {
      initAsync: (apiKey: string) => Promise<void>;
      env: {
        isApp: () => boolean;
      };
      permission: {
        checkPermission: (
          options: { type: string; ask: boolean },
          callback: (granted: boolean) => void,
        ) => void;
      };
      push: {
        registerPushToken: (userId: string) => Promise<{ status: string }>;
        deletePushToken: () => Promise<{ status: string }>;
        sendLocalPush: (
          options: {
            title: string;
            content: string;
            link?: string;
            scheduledTime?: Date;
            id?: number;
          },
          callback: (result: {
            status: string;
            id?: number;
            message?: string;
          }) => void,
        ) => void;
        cancelLocalPush: (id: number) => void;
      };
    };
  }
}

const NACHOCODE_API_KEY = process.env.NEXT_PUBLIC_NACHOCODE_API_KEY || "";

export const useNachocodePush = () => {
  const { addNotification } = useNotifications();

  const isAvailable = useCallback(() => {
    return typeof window !== "undefined" && !!window.Nachocode;
  }, []);

  const registerPushToken = useCallback(
    async (userId: string) => {
      if (!isAvailable()) return;

      try {
        await window.Nachocode!.initAsync(NACHOCODE_API_KEY);

        if (!window.Nachocode!.env.isApp()) return;

        window.Nachocode!.permission.checkPermission(
          { type: "push", ask: true },
          async (granted) => {
            if (granted) {
              await window.Nachocode!.push.registerPushToken(userId);
            }
          },
        );
      } catch (error) {
        console.error("푸시 토큰 등록 실패:", error);
      }
    },
    [isAvailable],
  );

  const deletePushToken = useCallback(async () => {
    if (!isAvailable()) return;

    try {
      await window.Nachocode!.push.deletePushToken();
    } catch (error) {
      console.error("푸시 토큰 삭제 실패:", error);
    }
  }, [isAvailable]);

  const handlePushReceived = useCallback(
    (params: {
      type: NotificationType;
      title: string;
      content: string;
      link?: string;
    }) => {
      addNotification(params);
    },
    [addNotification],
  );

  const sendLocalPush = useCallback(
    (params: {
      title: string;
      content: string;
      link?: string;
      scheduledTime?: Date;
    }) => {
      if (!isAvailable() || !window.Nachocode!.env.isApp()) return;

      window.Nachocode!.push.sendLocalPush(
        {
          title: params.title,
          content: params.content,
          link: params.link,
          scheduledTime: params.scheduledTime,
        },
        (result) => {
          if (result.status === "success") {
            console.log("로컬 푸시 전송 성공");
          }
        },
      );
    },
    [isAvailable],
  );

  return {
    isAvailable,
    registerPushToken,
    deletePushToken,
    handlePushReceived,
    sendLocalPush,
  };
};
