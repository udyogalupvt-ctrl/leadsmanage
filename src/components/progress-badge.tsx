import type { Progress } from "@/lib/types";
import { PROGRESS_TONE } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProgressBadge({ progress, className }: { progress: Progress; className?: string }) {
  return <span className={cn("badge-base", PROGRESS_TONE[progress], className)}>{progress}</span>;
}
