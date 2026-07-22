"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ChevronLeft,
  FolderOpen,
  Home,
  NotebookTabs,
  PenLine,
} from "lucide-react";
import type { ReactNode } from "react";

import { AppShell } from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type ImageMakerTab = "home" | "descriptive" | "materials" | "wrongNotes";
type EmptyStateIcon = "pen" | "folder" | "notebook";

interface EmptyStateConfig {
  activeTab: ImageMakerTab;
  icon: EmptyStateIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

const navItems: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  tab: ImageMakerTab;
}> = [
  {
    href: "/learn/image-maker",
    label: "홈",
    icon: Home,
    tab: "home",
  },
  {
    href: "/learn/image-maker/descriptive",
    label: "서술형",
    icon: PenLine,
    tab: "descriptive",
  },
  {
    href: "/learn/image-maker/materials",
    label: "내 자료",
    icon: FolderOpen,
    tab: "materials",
  },
  {
    href: "/learn/image-maker/wrong-notes",
    label: "오답노트",
    icon: NotebookTabs,
    tab: "wrongNotes",
  },
];

const emptyStateIcons: Record<EmptyStateIcon, LucideIcon> = {
  pen: PenLine,
  folder: FolderOpen,
  notebook: NotebookTabs,
};

export function ImageMakerEmptyState({
  activeTab,
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
}: EmptyStateConfig) {
  const Icon = emptyStateIcons[icon];

  return (
    <AppShell
      bottomNav={false}
      bottomSpacing="none"
      className="min-h-dvh bg-background"
    >
      <main className="mx-auto flex min-h-dvh w-full max-w-app flex-col items-center px-6 pb-[calc(8.25rem+env(safe-area-inset-bottom))] pt-[7.375rem] text-center">
        <div className="flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full bg-brandSecondary text-brand">
          <Icon aria-hidden="true" className="h-10 w-10" strokeWidth={2.25} />
        </div>

        <h1 className="mt-9 text-[1.625rem] font-extrabold leading-9 text-foreground">
          {title}
        </h1>
        <p className="mt-4 max-w-[34rem] text-lg font-medium leading-7 text-muted-foreground">
          {description}
        </p>

        {ctaLabel && ctaHref && (
          <Button
            asChild
            className="mt-8 h-16 rounded-full bg-brand px-8 text-lg font-bold shadow-[0_0.375rem_0.75rem_rgba(255,65,46,0.22)] hover:bg-primary-800 active:bg-primary-800"
          >
            <Link href={ctaHref} className="gap-3">
              {ctaLabel}
              <ArrowRight aria-hidden="true" className="!h-6 !w-6" />
            </Link>
          </Button>
        )}
      </main>

      <ImageMakerBottomNav activeTab={activeTab} />
    </AppShell>
  );
}

export function ImageMakerUploadShell({
  children,
  activeTab = "home",
}: {
  children: ReactNode;
  activeTab?: ImageMakerTab;
}) {
  return (
    <AppShell
      bottomNav={false}
      bottomSpacing="none"
      className="min-h-dvh bg-background"
    >
      {children}
      <ImageMakerBottomNav activeTab={activeTab} />
    </AppShell>
  );
}

function ImageMakerBottomNav({ activeTab }: { activeTab: ImageMakerTab }) {
  const router = useRouter();

  return (
    <nav
      aria-label="이미지 메이커 전용 네비게이션"
      className="fixed bottom-0 left-1/2 z-40 grid h-[calc(6.5rem+env(safe-area-inset-bottom))] w-full max-w-app -translate-x-1/2 grid-cols-5 border-t border-gray-100 bg-card px-3 pb-[env(safe-area-inset-bottom)] shadow-[0_-0.75rem_1.5rem_rgba(17,17,17,0.06)]"
    >
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="뒤로가기"
        className="flex min-w-0 flex-col items-center justify-center gap-1 text-muted-foreground transition-colors active:text-brand"
      >
        <ChevronLeft aria-hidden="true" className="h-7 w-7" />
      </button>

      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.tab;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors active:text-brand",
              isActive ? "text-brand" : "text-muted-foreground",
            )}
          >
            <Icon aria-hidden="true" className="h-6 w-6" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
