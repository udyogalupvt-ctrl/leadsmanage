import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Trash2,
  Save,
  Loader2,
  Pencil,
  Check,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useLead } from "@/hooks/use-leads";
import { useAuth } from "@/hooks/use-auth";
import { addNote, deleteLead, updateLead } from "@/lib/leads";
import { PROGRESS_OPTIONS, type Progress } from "@/lib/types";
import { formatIndianMobile } from "@/lib/phone";
import { ProgressBadge } from "@/components/progress-badge";
import { Timeline } from "@/components/timeline";
import { Attachments } from "@/components/attachments";
import { ThemeToggle } from "@/components/theme-toggle";
import { VisitScheduler } from "@/components/visit-scheduler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/leads/$id")({
  head: () => ({
    meta: [
      { title: "Lead · Lead Pilot" },
      { name: "description", content: "Lead details, conversation timeline and attachments." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LeadDetail,
});

function LeadDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [authLoading, user, navigate]);

  const { lead, loading, error } = useLead(id, user?.uid);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);

  useEffect(() => {
    if (lead) setNameDraft(lead.name);
  }, [lead?.id]);

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

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <h2 className="text-xl font-semibold">Lead not found</h2>
        <p className="text-sm text-muted-foreground">{error ?? "This lead may have been removed."}</p>
        <Link
          to="/"
          className="inline-flex items-center rounded-lg gradient-primary px-4 py-2 text-sm font-medium"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const saveName = async () => {
    const next = nameDraft.trim();
    if (!next || next === lead.name) {
      setEditingName(false);
      return;
    }
    try {
      await updateLead(
        lead.id,
        { name: next },
        { ts: Date.now(), note: `Renamed to "${next}"`, action: "update" },
      );
      toast.success("Name updated");
      setEditingName(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update name");
    }
  };

  const changeProgress = async (next: Progress) => {
    if (next === lead.progress) return;
    setUpdatingProgress(true);
    try {
      await updateLead(
        lead.id,
        { progress: next },
        { ts: Date.now(), note: `Progress: ${lead.progress} → ${next}`, action: "progress" },
      );
      toast.success(`Marked as ${next}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update");
    } finally {
      setUpdatingProgress(false);
    }
  };

  const submitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await addNote(lead.id, note);
      setNote("");
      toast.success("Note added");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add note");
    } finally {
      setSavingNote(false);
    }
  };

  const onDelete = async () => {
    try {
      await deleteLead(lead.id);
      toast.success("Lead deleted");
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete");
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto grid max-w-4xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="truncate text-sm font-semibold">Lead details</h1>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Delete lead">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All notes, timeline entries and attachments will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete lead
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-4 py-5 sm:px-6">
        {/* Header card */}
        <section className="card-surface animate-in-up overflow-hidden">
          <div className="gradient-primary h-24" />
          <div className="-mt-10 px-4 pb-4 sm:px-6">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-card text-lg font-bold text-primary ring-4 ring-card">
              {(lead.name || "?")
                .split(" ")
                .map((s) => s[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      className="h-9 max-w-xs"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveName();
                        if (e.key === "Escape") setEditingName(false);
                      }}
                    />
                    <Button size="icon" onClick={saveName} aria-label="Save name">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingName(false)}
                      aria-label="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    className="group inline-flex items-center gap-2 text-left"
                    onClick={() => setEditingName(true)}
                  >
                    <h2 className="truncate text-xl font-bold tracking-tight">{lead.name}</h2>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </button>
                )}
                <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                  {formatIndianMobile(lead.phone)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Created {format(lead.createdAt, "MMM d, yyyy")}</span>
                  <span aria-hidden>·</span>
                  <span>Updated {formatDistanceToNow(lead.updatedAt, { addSuffix: true })}</span>
                </div>
              </div>
              <ProgressBadge progress={lead.progress} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-muted px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Phone className="h-4 w-4" /> Call
              </a>
              <a
                href={`https://wa.me/91${lead.phone}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[oklch(0.85_0.14_155/0.2)] px-3 py-2.5 text-sm font-medium text-[oklch(0.5_0.15_155)] transition-colors hover:bg-[oklch(0.85_0.14_155/0.35)] dark:text-[oklch(0.8_0.14_155)]"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Progress selector */}
        <section className="card-surface p-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Progress
          </label>
          <div className="mt-2">
            <Select
              value={lead.progress}
              onValueChange={(v) => changeProgress(v as Progress)}
              disabled={updatingProgress}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROGRESS_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Visit Scheduler */}
        <section className="card-surface p-4">
          <VisitScheduler lead={lead} useCase={profile?.useCase ?? "realestate"} />
        </section>

        {/* Add note */}
        <section className="card-surface p-4">
          <form onSubmit={submitNote} className="space-y-2">
            <label htmlFor="note" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Add a note
            </label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Log a conversation, follow-up or reminder…"
              className="min-h-24"
              maxLength={2000}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!note.trim() || savingNote}
                className="gradient-primary"
              >
                {savingNote ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-4 w-4" />
                )}
                Save note
              </Button>
            </div>
          </form>
        </section>

        {/* Attachments */}
        <section className="card-surface p-4">
          <Attachments leadId={lead.id} attachments={lead.attachments} />
        </section>

        {/* Timeline */}
        <section className="card-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Conversation timeline</h3>
            <span className="text-xs text-muted-foreground tabular-nums">
              {lead.timeline.length} update{lead.timeline.length === 1 ? "" : "s"}
            </span>
          </div>
          <Timeline entries={lead.timeline} />
        </section>
      </main>
    </div>
  );
}
