"use client";

import { useMemo } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { startRouteProgress } from "./routeProgress";

type AppRouter = ReturnType<typeof useNextRouter>;
type RouterHref = Parameters<AppRouter["push"]>[0];
type PushOptions = Parameters<AppRouter["push"]>[1];
type ReplaceOptions = Parameters<AppRouter["replace"]>[1];

const getFreshDocumentUrl = (href: RouterHref) => {
  if (typeof window === "undefined") return null;

  try {
    const url = new URL(href.toString(), window.location.href);
    return url.origin === window.location.origin && url.pathname === "/login"
      ? url
      : null;
  } catch {
    return null;
  }
};

export const useRouter = () => {
  const router = useNextRouter();

  return useMemo(
    () => ({
      ...router,
      push: (href: RouterHref, options?: PushOptions) => {
        startRouteProgress(href);

        const freshDocumentUrl = getFreshDocumentUrl(href);
        if (freshDocumentUrl) {
          window.location.assign(freshDocumentUrl);
          return;
        }

        router.push(href, options);
      },
      replace: (href: RouterHref, options?: ReplaceOptions) => {
        startRouteProgress(href);

        const freshDocumentUrl = getFreshDocumentUrl(href);
        if (freshDocumentUrl) {
          window.location.replace(freshDocumentUrl);
          return;
        }

        router.replace(href, options);
      },
    }),
    [router],
  );
};
