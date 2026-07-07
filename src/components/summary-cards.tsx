import type { Lead } from "@/lib/types";
import { Users, Sparkles, Loader2, CalendarClock, Trophy, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Summary = {
  total: number;
  new: number;
  inProgress: number;
  followUp: number;
  won: number;
  lost: number;
};

export function computeSummary(leads: Lead[]): Summary {
  const s: Summary = { total: leads.length, new: 0, inProgress: 0, followUp: 0, won: 0, lost: 0 };
  for (const l of leads) {
    if (l.progress === "New") s.new++;
    else if (l.progress === "Follow Up") s.followUp++;
    else if (l.progress === "Deal Won") s.won++;
    else if (l.progress === "Deal Lost" || l.progress === "Not Interested") s.lost++;
    else s.inProgress++; // Contacted, Interested, Negotiating
  }
  return s;
}

const cards = [
  { key: "total", label: "Total Leads", icon: Users, tone: "text-primary" },
  { key: "new", label: "New Leads", icon: Sparkles, tone: "text-info" },
  { key: "inProgress", label: "In Progress", icon: Loader2, tone: "text-primary" },
  { key: "followUp", label: "Follow Up", icon: CalendarClock, tone: "text-warning" },
  { key: "won", label: "Closed Won", icon: Trophy, tone: "text-success" },
  { key: "lost", label: "Closed Lost", icon: XCircle, tone: "text-destructive" },
] as const;

export function SummaryCards({ leads }: { leads: Lead[] }) {
  const s = computeSummary(leads);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        const value = s[c.key as keyof Summary];
        return (
          <div
            key={c.key}
            className="card-surface card-hover animate-in-up p-4"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{c.label}</span>
              <div
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full bg-muted",
                  c.tone,
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{value}</div>
          </div>
        );
      })}
    </div>
  );
}
