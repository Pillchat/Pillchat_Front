import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Notification, PushHistory } from "@/types/notification";

export const notificationsAtom = atomWithStorage<Notification[]>(
  "notifications",
  [],
);

export const unreadCountAtom = atom((get) => {
  const notifications = get(notificationsAtom);
  return notifications.filter((n) => !n.isRead).length;
});

export const pushHistoryAtom = atomWithStorage<PushHistory[]>(
  "pushHistory",
  [],
);
