import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROGRESS_OPTIONS, type Progress } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

export type DateFilter = "today" | "yesterday" | "last3" | "last4" | "last5" | "all" | "custom";

export type FiltersState = {
  query: string;
  progress: "all" | Progress;
  dateFilter: DateFilter;
  customFrom?: string;
  customTo?: string;
};

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last3", label: "Last 3 days" },
  { value: "last4", label: "Last 4 days" },
  { value: "last5", label: "Last 5 days" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom" },
];

export function FiltersBar({
  filters,
  onChange,
}: {
  filters: FiltersState;
  onChange: (next: FiltersState) => void;
}) {
  const { profile } = useAuth();
  const patch = (p: Partial<FiltersState>) => onChange({ ...filters, ...p });

  return (
    <div className="card-surface animate-in-up sticky top-2 z-20 space-y-3 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={(e) => patch({ query: e.target.value })}
          placeholder="Search by name, phone or notes…"
          className="h-11 pl-9 pr-9"
        />
        {filters.query && (
          <button
            onClick={() => patch({ query: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Select
          value={filters.progress}
          onValueChange={(v) => patch({ progress: v as FiltersState["progress"] })}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {[...PROGRESS_OPTIONS, ...(profile?.customProgressOptions || [])].map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.dateFilter}
          onValueChange={(v) => patch({ dateFilter: v as DateFilter })}
        >
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filters.dateFilter === "custom" && (
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={filters.customFrom ?? ""}
            onChange={(e) => patch({ customFrom: e.target.value })}
          />
          <Input
            type="date"
            value={filters.customTo ?? ""}
            onChange={(e) => patch({ customTo: e.target.value })}
          />
        </div>
      )}

      {(filters.query ||
        filters.progress !== "all" ||
        filters.dateFilter !== "today") && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({ query: "", progress: "all", dateFilter: "today" })
            }
          >
            Reset filters
          </Button>
        </div>
      )}
    </div>
  );
}

export function filterLeads<T extends { name: string; phone: string; lastNote?: string; progress: Progress; createdAt: number; updatedAt: number }>(
  leads: T[],
  filters: FiltersState,
): T[] {
  const q = filters.query.trim().toLowerCase();
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = startOfDay(now);
  const dayMs = 86400000;

  let from: number | null = null;
  let to: number | null = null;
  switch (filters.dateFilter) {
    case "today":
      from = today;
      to = today + dayMs;
      break;
    case "yesterday":
      from = today - dayMs;
      to = today;
      break;
    case "last3":
      from = today - 3 * dayMs;
      to = today + dayMs;
      break;
    case "last4":
      from = today - 4 * dayMs;
      to = today + dayMs;
      break;
    case "last5":
      from = today - 5 * dayMs;
      to = today + dayMs;
      break;
    case "custom":
      from = filters.customFrom ? new Date(filters.customFrom).getTime() : null;
      to = filters.customTo ? new Date(filters.customTo).getTime() + dayMs : null;
      break;
    case "all":
    default:
      break;
  }

  return leads.filter((l) => {
    if (filters.progress !== "all" && l.progress !== filters.progress) return false;
    if (from !== null && l.createdAt < from) return false;
    if (to !== null && l.createdAt >= to) return false;
    if (q) {
      const hay = `${l.name} ${l.phone} ${l.lastNote ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
