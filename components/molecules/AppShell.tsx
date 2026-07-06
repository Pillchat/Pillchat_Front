"use client";

import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { BottomNavbar } from "./BottomNavbar";

type BottomSpacing = "none" | "nav" | "cta" | "input";

const bottomSpacingClass: Record<BottomSpacing, string> = {
  none: "",
  nav: "pb-[calc(5.5rem+env(safe-area-inset-bottom))]",
  cta: "pb-[calc(10rem+env(safe-area-inset-bottom))]",
  input: "pb-[calc(9.5rem+env(safe-area-inset-bottom))]",
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
