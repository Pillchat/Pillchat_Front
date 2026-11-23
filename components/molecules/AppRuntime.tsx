"use client";

import { useEffect } from "react";
import { onlineManager, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { getValidAccessToken } from "@/lib/client/fetch";
import { isPublicPage, loginHrefForPage } from "@/lib/shared/pageAccess";
import {
  APP_KEYBOARD,
  APP_RESUME,
  connectNativeEvents,
  initializeNativeApp,
} from "@/lib/client/nativeApp";

function editable(element: Element | null): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    element.matches(
      'textarea:not([readonly]):not([disabled]), input:not([readonly]):not([disabled]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="button"]):not([type="submit"]):not([type="range"]), [contenteditable="true"]',
    )
  );
}

export function AppRuntime() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || isPublicPage(pathname)) return;

    let active = true;
    const checkSession = async () => {
      try {
        const token = await getValidAccessToken();
        if (active && !token && window.location.pathname === pathname) {
          window.location.replace(
            loginHrefForPage(`${pathname}${window.location.search}`),
          );
        }
      } catch {
        // A temporary refresh failure does not end a session.
      }
    };
    void checkSession();
    window.addEventListener("pillchat:auth", checkSession);
    window.addEventListener("storage", checkSession);
    return () => {
      active = false;
      window.removeEventListener("pillchat:auth", checkSession);
      window.removeEventListener("storage", checkSession);
    };
  }, [pathname]);

  useEffect(() => {
    let disposed = false;
    let attempts = 0;
    let connecting = false;
    let retry: ReturnType<typeof setTimeout>;
    const connect = async () => {
      if (connecting || disposed) return;
      connecting = true;
      clearTimeout(retry);
      const sdk = await initializeNativeApp();
      connecting = false;
      if (disposed) return;
      if (sdk) connectNativeEvents(sdk);
      else if (++attempts < 40) retry = setTimeout(connect, 250);
    };
    void connect();
    const resume = () => {
      void queryClient.refetchQueries({ type: "active", stale: true });
    };
    const network = (event: Event) => {
      onlineManager.setOnline((event as CustomEvent<boolean>).detail);
      if ((event as CustomEvent<boolean>).detail)
        window.dispatchEvent(new Event(APP_RESUME));
    };
    window.addEventListener(APP_RESUME, resume);
    window.addEventListener("pillchat:network", network);
    window.addEventListener("focus", connect);
    return () => {
      disposed = true;
      clearTimeout(retry);
      window.removeEventListener(APP_RESUME, resume);
      window.removeEventListener("pillchat:network", network);
      window.removeEventListener("focus", connect);
    };
  }, [queryClient]);

  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    let nativeKeyboard = false;
    let frame = 0;
    let focusTimer: ReturnType<typeof setTimeout>;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Pinch zoom belongs to the user; do not reposition the page during it.
        if (viewport && Math.abs(viewport.scale - 1) > 0.01) return;
        const height = viewport?.height ?? window.innerHeight;
        const top = viewport?.offsetTop ?? 0;
        const inset = Math.max(0, window.innerHeight - height - top);
        const input = document.activeElement;
        const keyboard = nativeKeyboard || (editable(input) && inset > 100);
        root.style.setProperty("--app-viewport-height", `${height}px`);
        root.style.setProperty("--app-viewport-top", `${top}px`);
        root.style.setProperty(
          "--app-keyboard-inset",
          `${keyboard ? inset : 0}px`,
        );
        root.dataset.keyboardOpen = String(keyboard);
        if (!keyboard || !editable(input)) return;
        let bottom = top + height - 16;
        document
          .querySelectorAll<HTMLElement>("[data-keyboard-footer]")
          .forEach((footer) => {
            const rect = footer.getBoundingClientRect();
            if (
              rect.height &&
              rect.top > top &&
              rect.top < bottom &&
              !footer.contains(input)
            )
              bottom = rect.top - 12;
          });
        const visibleTop = top + 16;
        const delta = () => {
          const rect = input.getBoundingClientRect();
          if (rect.top < visibleTop) return rect.top - visibleTop;
          if (rect.bottom > bottom)
            return Math.min(rect.bottom - bottom, rect.top - visibleTop);
          return 0;
        };
        // Scroll the actual form/modal container before falling back to the page.
        let parent = input.parentElement;
        while (parent && parent !== document.body) {
          if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY))
            parent.scrollTop += delta();
          parent = parent.parentElement;
        }
        const distance = delta();
        if (distance) window.scrollBy({ top: distance, behavior: "instant" });
      });
    };
    const focus = () => {
      update();
      clearTimeout(focusTimer);
      focusTimer = setTimeout(update, 300);
    };
    const keyboard = (event: Event) => {
      nativeKeyboard = (event as CustomEvent<boolean>).detail;
      focus();
    };
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener(APP_KEYBOARD, keyboard);
    document.addEventListener("focusin", focus);
    document.addEventListener("focusout", focus);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(focusTimer);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener(APP_KEYBOARD, keyboard);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("focusout", focus);
      [
        "--app-viewport-height",
        "--app-viewport-top",
        "--app-keyboard-inset",
      ].forEach((name) => root.style.removeProperty(name));
      delete root.dataset.keyboardOpen;
    };
  }, []);
  return null;
}
