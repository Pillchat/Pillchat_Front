"use client";

const ROUTE_PROGRESS_START_EVENT = "yakchat:route-progress-start";

const resolveUrl = (value: string | URL, baseHref: string) => {
  try {
    return new URL(value.toString(), baseHref);
  } catch {
    return null;
  }
};

export const dispatchRouteProgressStart = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ROUTE_PROGRESS_START_EVENT));
};

export const startRouteProgress = (href: string | URL) => {
  if (typeof window === "undefined") return;

  const current = new URL(window.location.href);
  const next = resolveUrl(href, current.href);

  if (!next) return;
  if (next.origin !== current.origin) return;
  if (next.pathname === current.pathname) return;

  dispatchRouteProgressStart();
};

export { ROUTE_PROGRESS_START_EVENT };
