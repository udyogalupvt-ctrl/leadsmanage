import { Link } from "@tanstack/react-router";
import { Phone, MessageCircle, ChevronRight, Clock, Pencil, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Lead } from "@/lib/types";
import { ProgressBadge } from "./progress-badge";
import { formatIndianMobile } from "@/lib/phone";
import { formatDistanceToNow } from "date-fns";
import { updateLead } from "@/lib/leads";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export function LeadCard({ lead }: { lead: Lead }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(lead.name);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftName(lead.name);
  }, [lead.name]);

  const initials = (lead.name || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const stop = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSave = async () => {
    if (draftName.trim() === lead.name) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await updateLead(lead.id, { name: draftName.trim() });
      toast.success("Name updated");
      setIsEditing(false);
    } catch (err: any) {
      toast.error("Failed to update name");
      setDraftName(lead.name);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      stop(e);
      handleSave();
    } else if (e.key === "Escape") {
      stop(e);
      setDraftName(lead.name);
      setIsEditing(false);
    }
  };

  return (
    <Link
      to="/leads/$id"
      params={{ id: lead.id }}
      className="card-surface card-hover animate-in-up group block p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full gradient-primary text-sm font-semibold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {isEditing ? (
                <div className="relative" onClick={stop}>
                  <Input
                    ref={inputRef}
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    disabled={saving}
                    className="h-7 px-2 py-1 text-sm font-semibold sm:w-[160px]"
                    autoFocus
                  />
                  {saving && (
                    <Loader2 className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
              ) : (
                <div
                  className="group/name flex cursor-pointer items-center gap-1 rounded-sm hover:bg-muted/50 px-1 -ml-1"
                  onClick={(e) => {
                    stop(e);
                    setIsEditing(true);
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }}
                  title="Click to edit name"
                >
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {lead.name}
                  </h3>
                  <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover/name:opacity-100 text-muted-foreground" />
                </div>
              )}
              <ProgressBadge progress={lead.progress} />
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">
              {formatIndianMobile(lead.phone)}
            </p>
            {lead.lastNote ? (
              <p className="mt-2 line-clamp-2 text-xs text-foreground/80">{lead.lastNote}</p>
            ) : (
              <p className="mt-2 text-xs italic text-muted-foreground">No notes yet</p>
            )}
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Updated {formatDistanceToNow(lead.updatedAt, { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>

      <div className="mt-3 flex gap-2 border-t border-border/60 pt-3">
        <a
          onClick={stop}
          href={`tel:${lead.phone}`}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-muted px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Phone className="h-3.5 w-3.5" /> Call
        </a>
        <a
          onClick={stop}
          href={`https://wa.me/91${lead.phone}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[oklch(0.85_0.14_155/0.2)] px-2 py-1.5 text-xs font-medium text-[oklch(0.5_0.15_155)] transition-colors hover:bg-[oklch(0.85_0.14_155/0.35)] dark:text-[oklch(0.8_0.14_155)]"
        >
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </a>
      </div>
    </Link>
  );
}
