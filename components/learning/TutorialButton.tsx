"use client";

import Link from "next/link";
import { CircleHelp } from "lucide-react";

type Props = {
  label?: string;
  disabled?: boolean;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

export function TutorialButton({
  label = "튜토리얼",
  disabled = false,
  href,
  onClick,
}: Props) {
  const className =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-primary transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40";
  const icon = <CircleHelp className="h-5 w-5" aria-hidden="true" />;
  return href ? (
    <Link href={href} aria-label={label} title={label} className={className}>
      {icon}
    </Link>
  ) : (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={className}
    >
      {icon}
    </button>
  );
}
