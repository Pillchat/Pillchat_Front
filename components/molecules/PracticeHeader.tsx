"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface PracticeHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backHref?: string;
  rightSlot?: ReactNode;
  separator?: boolean;
}

export function PracticeHeader({
  title,
  subtitle,
  onBack,
  backHref,
  rightSlot,
  separator = true,
}: PracticeHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (backHref) {
      router.push(backHref);
      return;
    }

    router.back();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between bg-white px-4 md:px-8",
        separator && "border-b border-gray-200",
      )}
    >
      <button
        type="button"
        onClick={handleBack}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-gray-100"
        aria-label="이전 화면"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="text-center">
        <p className="text-sm font-bold text-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex h-10 w-10 items-center justify-center">
        {rightSlot}
      </div>
    </header>
  );
}
