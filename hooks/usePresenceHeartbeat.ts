"use client";

import { useEffect, useRef } from "react";
import { useSetAtom } from "jotai";

import { fetchAPI, getValidAccessToken } from "@/lib/client/fetch";
import { onlineCountAtom } from "@/store/presence";

const PRESENCE_INTERVAL_MS = 30_000;

const getOnlineCount = (response: unknown) => {
  if (!response || typeof response !== "object") return null;

  const payload = response as {
    onlineCount?: unknown;
    data?: { onlineCount?: unknown };
  };
  const value = payload.onlineCount ?? payload.data?.onlineCount;
  const count = Number(value);

  return Number.isFinite(count) && count >= 0 ? Math.floor(count) : null;
};

export const usePresenceHeartbeat = () => {
  const setOnlineCount = useSetAtom(onlineCountAtom);
  const isPingingRef = useRef(false);
  const hasLoggedFailureRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let intervalId: number | null = null;

    const ping = async () => {
      if (
        document.visibilityState !== "visible" ||
        !navigator.onLine ||
        isPingingRef.current
      ) {
        return;
      }

      isPingingRef.current = true;

      try {
        const token = await getValidAccessToken();
        if (!token) {
          if (isMounted) setOnlineCount(null);
          return;
        }

        const response = await fetchAPI("/api/presence/ping", "POST");
        const count = getOnlineCount(response);

        if (count === null) {
          throw new Error("Presence heartbeat response has no onlineCount.");
        }

        if (isMounted) setOnlineCount(count);
        hasLoggedFailureRef.current = false;
      } catch (error) {
        if (!hasLoggedFailureRef.current) {
          console.warn("Presence heartbeat failed:", error);
          hasLoggedFailureRef.current = true;
        }
      } finally {
        isPingingRef.current = false;
      }
    };

    const stop = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const start = () => {
      stop();
      if (document.visibilityState !== "visible" || !navigator.onLine) return;

      void ping();
      intervalId = window.setInterval(() => void ping(), PRESENCE_INTERVAL_MS);
    };

    const syncWithAppState = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        start();
      } else {
        stop();
      }
    };

    syncWithAppState();
    document.addEventListener("visibilitychange", syncWithAppState);
    window.addEventListener("focus", start);
    window.addEventListener("online", start);
    window.addEventListener("offline", stop);

    return () => {
      isMounted = false;
      stop();
      document.removeEventListener("visibilitychange", syncWithAppState);
      window.removeEventListener("focus", start);
      window.removeEventListener("online", start);
      window.removeEventListener("offline", stop);
    };
  }, [setOnlineCount]);
};
