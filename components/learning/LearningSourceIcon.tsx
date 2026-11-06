import { BadgeCheck, Monitor, Sparkles } from "lucide-react";
import type { ReviewSource } from "@/types/review";

const icons = { HANDCRAFTED: BadgeCheck, AI: Sparkles, CBT: Monitor };

export default function LearningSourceIcon({
  source,
  className = "h-6 w-6 text-primary",
}: {
  source: ReviewSource;
  className?: string;
}) {
  const Icon = icons[source];
  return <Icon aria-hidden="true" className={className} strokeWidth={1.5} />;
}
