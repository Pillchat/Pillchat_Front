"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "./getQueryClient";
import type * as React from "react";
import { AppRuntime } from "@/components/molecules/AppRuntime";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AppRuntime />
      {children}
    </QueryClientProvider>
  );
}
