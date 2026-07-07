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
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { useLead } from "@/hooks/use-leads";
import { useAuth } from "@/hooks/use-auth";
import { addNote, deleteLead, updateLead, migrateLeadProgress } from "@/lib/leads";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, formatDistanceToNow } from "date-fns";
import { addCustomProgressOption, removeCustomProgressOption, renameCustomProgressOption } from "@/lib/auth";

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
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [addingStatus, setAddingStatus] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const handleAddStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus.trim() || !user) return;
    setAddingStatus(true);
    try {
      await addCustomProgressOption(user.uid, newStatus.trim());
      toast.success("Status added");
      setNewStatus("");
    } catch (err: any) {
      toast.error("Failed to add status");
    } finally {
      setAddingStatus(false);
    }
  };

  const handleDeleteStatus = async (status: string) => {
    if (!user) return;
    try {
      await removeCustomProgressOption(user.uid, status);
      toast.success("Status deleted");
    } catch (err: any) {
      toast.error("Failed to delete status");
    }
  };

  const handleRenameStatus = async (oldStatus: string) => {
    if (!user || !editingValue.trim() || editingValue.trim() === oldStatus) {
      setEditingStatus(null);
      return;
    }
    setAddingStatus(true);
    try {
      const next = editingValue.trim();
      await renameCustomProgressOption(user.uid, oldStatus, next);
      await migrateLeadProgress(user.uid, oldStatus, next);
      toast.success("Status renamed and leads migrated");
      setEditingStatus(null);
    } catch (err: any) {
      toast.error("Failed to rename status");
    } finally {
      setAddingStatus(false);
    }
  };

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

  const submitNote = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Progress
            </label>
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary">
                  <Settings className="h-3 w-3" /> Manage Statuses
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="text-base">Manage custom statuses</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  {profile?.customProgressOptions && profile.customProgressOptions.length > 0 && (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {profile.customProgressOptions.map((status) => (
                        <div key={status} className="flex items-center justify-between rounded-md border border-border p-2">
                          {editingStatus === status ? (
                            <div className="flex flex-1 items-center gap-2">
                              <Input
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="h-8"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleRenameStatus(status);
                                  if (e.key === "Escape") setEditingStatus(null);
                                }}
                              />
                              <Button size="icon" variant="ghost" onClick={() => handleRenameStatus(status)} className="h-8 w-8 shrink-0">
                                <Check className="h-4 w-4 text-primary" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => setEditingStatus(null)} className="h-8 w-8 shrink-0">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm truncate mr-2">{status}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingStatus(status); setEditingValue(status); }}>
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDeleteStatus(status)}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="border-t border-border/50 pt-4">
                    <form onSubmit={handleAddStatus} className="flex items-center gap-2">
                      <Input
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        placeholder="Add new custom status..."
                        className="h-9"
                      />
                      <Button type="submit" disabled={!newStatus.trim() || addingStatus} className="h-9 shrink-0 gradient-primary">
                        {addingStatus && !editingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add"}
                      </Button>
                    </form>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
                {[...PROGRESS_OPTIONS, ...(profile?.customProgressOptions || [])].map((p) => (
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="note" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Add a note
              </label>
              {savingNote && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                </span>
              )}
            </div>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => {
                if (note.trim()) submitNote();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (note.trim()) submitNote();
                }
              }}
              placeholder="Log a conversation, follow-up or reminder… (Press Enter to save)"
              className="min-h-24"
              maxLength={2000}
              disabled={savingNote}
            />
          </div>
        </section>

        {/* Attachments */}
        <section className="card-surface p-4">
          <Attachments leadId={lead.id} attachments={lead.attachments} />
        </section>

        {/* Timeline */}
        <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen} className="card-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Conversation timeline</h3>
              <p className="text-xs text-muted-foreground tabular-nums">
                {lead.timeline.length} update{lead.timeline.length === 1 ? "" : "s"}
              </p>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                {timelineOpen ? (
                  <>Hide <ChevronUp className="h-3.5 w-3.5" /></>
                ) : (
                  <>View History <ChevronDown className="h-3.5 w-3.5" /></>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
            <div className="pt-2">
              <Timeline entries={lead.timeline} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </main>
    </div>
  );
}
