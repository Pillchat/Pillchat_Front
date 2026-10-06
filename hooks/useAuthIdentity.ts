"use client";
import { useSyncExternalStore } from "react";
import { getCurrentUserId } from "@/lib/client/auth";
const subscribe = (listener: () => void) => {
  window.addEventListener("storage", listener);
  window.addEventListener("pillchat:auth", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("pillchat:auth", listener);
  };
};
export const useAuthIdentity = () =>
  useSyncExternalStore(subscribe, getCurrentUserId, () => null);
