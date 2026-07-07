import { format } from "date-fns";
import { CheckCircle2, MessageSquare, Paperclip, Sparkles, Repeat } from "lucide-react";
import type { TimelineEntry } from "@/lib/types";

function iconFor(action: string) {
  switch (action) {
    case "note":
      return MessageSquare;
    case "attachment":
      return Paperclip;
    case "progress":
      return Repeat;
    case "created":
    case "imported":
      return Sparkles;
    default:
      return CheckCircle2;
  }
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const sorted = [...entries].sort((a, b) => b.ts - a.ts);

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No activity yet. Add a note to start the conversation.
      </div>
    );
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {sorted.map((e, i) => {
        const Icon = iconFor(e.action);
        return (
          <li key={`${e.ts}-${i}`} className="animate-in-up relative">
            <span className="absolute -left-[26px] top-0 grid h-6 w-6 place-items-center rounded-full bg-card ring-1 ring-border">
              <Icon className="h-3 w-3 text-primary" />
            </span>
            <div className="card-surface p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium capitalize text-primary">{e.action}</span>
                <time className="text-[11px] text-muted-foreground tabular-nums">
                  {format(e.ts, "MMM d, h:mm a")}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{e.note}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
