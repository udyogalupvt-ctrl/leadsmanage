import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Sparkles, Inbox, Zap, LogOut, ChevronDown, ChevronUp } from "lucide-react";
import { useLeads } from "@/hooks/use-leads";
import { useAuth } from "@/hooks/use-auth";
import { SummaryCards } from "@/components/summary-cards";
import { LeadCard } from "@/components/lead-card";
import { AddLeadDialog } from "@/components/add-lead-dialog";
import { BulkImportDialog } from "@/components/bulk-import-dialog";
import { FiltersBar, filterLeads, type FiltersState } from "@/components/filters-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Lead Pilot" },
      {
        name: "description",
        content: "Your live pipeline: today's leads, statuses and quick actions in one place.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [authLoading, user, navigate]);

  const { leads, loading: leadsLoading, error } = useLeads(user?.uid);
  const [filters, setFilters] = useState<FiltersState>({
    query: "",
    progress: "all",
    dateFilter: "today",
  });
  const [overviewOpen, setOverviewOpen] = useState(false);

  const all = leads ?? [];
  const filtered = useMemo(() => filterLeads(all, filters), [all, filters]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <Zap className="h-8 w-8 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary">
              <Zap className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight">Lead Pilot</h1>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                Your pipeline, at a glance
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <BulkImportDialog userId={user.uid} />
            <AddLeadDialog userId={user.uid} />
            <ThemeToggle />
            
            <div className="flex items-center gap-1.5 border-l border-border/60 pl-2">
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-xs font-semibold text-foreground">
                  {profile?.displayName || user.displayName || "User"}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {profile?.useCase === "education" ? "Education" : "Real Estate"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/login" });
                }}
                title="Sign out"
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6">
        {error && (
          <div className="card-surface border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <Collapsible open={overviewOpen} onOpenChange={setOverviewOpen} className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight sm:text-xl">Overview</h2>
              <p className="text-xs text-muted-foreground">Live snapshot across your pipeline</p>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                {overviewOpen ? (
                  <>Hide Overview <ChevronUp className="h-3.5 w-3.5" /></>
                ) : (
                  <>Show Overview <ChevronDown className="h-3.5 w-3.5" /></>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
            <div className="pt-1">
              {leadsLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : (
                <SummaryCards leads={all} />
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-[76px] lg:h-fit">
            <FiltersBar filters={filters} onChange={setFilters} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                {filters.dateFilter === "today" ? "Today's leads" : "Leads"}
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                  {filtered.length}
                </span>
              </h2>
            </div>

            {leadsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState hasAny={all.length > 0} userId={user.uid} />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {filtered.map((l) => (
                  <LeadCard key={l.id} lead={l} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function EmptyState({ hasAny, userId }: { hasAny: boolean; userId: string }) {
  return (
    <div className="card-surface flex flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-primary">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold">
        {hasAny ? "No leads match these filters" : "Start capturing leads"}
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {hasAny
          ? "Try widening the date range or clearing your search."
          : "Add a lead or bulk import phone numbers to build your pipeline."}
      </p>
      {!hasAny && (
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <AddLeadDialog userId={userId} />
          <BulkImportDialog userId={userId} />
        </div>
      )}
    </div>
  );
}
