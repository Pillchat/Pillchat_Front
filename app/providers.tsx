"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "./getQueryClient";
import type * as React from "react";
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  usePresenceHeartbeat();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
