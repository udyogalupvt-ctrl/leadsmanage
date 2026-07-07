import type { Progress } from "@/lib/types";
import { PROGRESS_TONE } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProgressBadge({ progress, className }: { progress: Progress; className?: string }) {
  const tone = PROGRESS_TONE[progress] || "badge-neutral";
  return <span className={cn("badge-base", tone, className)}>{progress}</span>;
}
