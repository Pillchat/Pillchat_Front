"use client";

import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { BottomNavbar } from "./BottomNavbar";

type BottomSpacing = "none" | "nav" | "cta" | "input";

const bottomSpacingClass: Record<BottomSpacing, string> = {
  none: "",
  nav: "pb-[var(--bottom-nav-height)]",
  cta: "pb-[calc(var(--bottom-nav-height)+5rem)]",
  input: "pb-[calc(var(--bottom-nav-height)+5rem)]",
};

interface AppShellProps {
  children: ReactNode;
  bottomNav?: boolean;
  bottomSpacing?: BottomSpacing;
  className?: string;
}

export function AppShell({
  children,
  bottomNav = true,
  bottomSpacing = "nav",
  className,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "mx-auto min-h-dvh w-full max-w-app bg-card text-card-foreground",
        bottomSpacingClass[bottomSpacing],
        className,
      )}
    >
      {children}
      {bottomNav && <BottomNavbar />}
    </div>
  );
}
