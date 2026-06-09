"use client";

import { useMemo } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { startRouteProgress } from "./routeProgress";

type AppRouter = ReturnType<typeof useNextRouter>;
type RouterHref = Parameters<AppRouter["push"]>[0];
type PushOptions = Parameters<AppRouter["push"]>[1];
type ReplaceOptions = Parameters<AppRouter["replace"]>[1];

export const useRouter = () => {
  const router = useNextRouter();

  return useMemo(
    () => ({
      ...router,
      push: (href: RouterHref, options?: PushOptions) => {
        startRouteProgress(href);
        router.push(href, options);
      },
      replace: (href: RouterHref, options?: ReplaceOptions) => {
        startRouteProgress(href);
        router.replace(href, options);
      },
    }),
    [router],
  );
};
