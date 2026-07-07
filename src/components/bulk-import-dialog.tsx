import { useMemo, useState } from "react";
import { Import, Loader2, CheckCircle2, AlertCircle, Copy, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { extractIndianMobiles } from "@/lib/phone";
import { bulkCreateLeads } from "@/lib/leads";

const NUMBER_RE = /(?:\+?9\s*1[\s\-]?|0)?[6-9](?:[\s\-()]*\d){9}/g;

export function BulkImportDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [collected, setCollected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<null | {
    valid: number;
    created: number;
    duplicates: number;
  }>(null);

  const invalidCount = useMemo(() => {
    // number-like chunks left in the textarea that aren't valid
    return extractIndianMobiles(text).invalid.length;
  }, [text]);

  const handleChange = (raw: string) => {
    const matches = raw.match(NUMBER_RE) ?? [];
    if (matches.length === 0) {
      setText(raw);
      return;
    }
    // Extract valid numbers from matches
    const newNumbers: string[] = [];
    for (const m of matches) {
      const d = m.replace(/\D+/g, "");
      let num: string | null = null;
      if (d.length === 10 && /^[6-9]/.test(d)) num = d;
      else if (d.length === 12 && d.startsWith("91") && /^[6-9]/.test(d[2])) num = d.slice(2);
      else if (d.length === 11 && d.startsWith("0") && /^[6-9]/.test(d[1])) num = d.slice(1);
      else if (d.length === 13 && d.startsWith("091") && /^[6-9]/.test(d[3])) num = d.slice(3);
      if (num) newNumbers.push(num);
    }
    // Remove matched substrings from text
    const stripped = raw.replace(NUMBER_RE, " ").replace(/[\s,;]+/g, " ").trim();
    setText(stripped);
    if (newNumbers.length > 0) {
      setCollected((prev) => {
        const set = new Set(prev);
        for (const n of newNumbers) set.add(n);
        return Array.from(set);
      });
    }
  };

  const removeOne = (n: string) => {
    setCollected((prev) => prev.filter((x) => x !== n));
  };

  const submit = async () => {
    if (collected.length === 0) {
      toast.error("No valid numbers to import");
      return;
    }
    setSaving(true);
    try {
      const { created, duplicates } = await bulkCreateLeads(collected, userId);
      setResult({ valid: collected.length, created, duplicates });
      toast.success(`Imported ${created} lead${created === 1 ? "" : "s"}`);
      setText("");
      setCollected([]);
    } catch (err: any) {
      toast.error(err?.message ?? "Import failed");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setResult(null);
    setText("");
    setCollected([]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Import className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Bulk import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk import leads</DialogTitle>
          <DialogDescription>
            Type or paste numbers in any format. Valid numbers are extracted instantly.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <div className="card-surface p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Import complete</span>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <Stat label="Extracted" value={result.valid} />
                <Stat label="Created" value={result.created} />
                <Stat label="Duplicates" value={result.duplicates} />
              </dl>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={reset}>
                Import more
              </Button>
              <DialogClose asChild>
                <Button className="gradient-primary">Done</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <>
            <Textarea
              value={text}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={`Type or paste a number — it moves to the preview automatically.\nExample: 9876543210, +91 98765 43210`}
              className="min-h-24 font-mono text-sm"
            />

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Chip icon={CheckCircle2} label="Collected" value={collected.length} />
              <Chip icon={AlertCircle} label="Invalid in box" value={invalidCount} />
            </div>

            {collected.length > 0 && (
              <div className="card-surface max-h-44 overflow-y-auto p-2">
                <div className="flex items-center justify-between px-1 pb-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Preview ({collected.length})
                  </span>
                  <button
                    onClick={() => setCollected([])}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </button>
                </div>
                <ul className="flex flex-wrap gap-1.5">
                  {collected.map((n) => (
                    <li
                      key={n}
                      className="group inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 py-1 pl-2 pr-1 font-mono text-xs tabular-nums"
                    >
                      <span>+91 {n.slice(0, 5)} {n.slice(5)}</span>
                      <button
                        onClick={() => removeOne(n)}
                        aria-label={`Remove ${n}`}
                        className="grid h-4 w-4 place-items-center rounded hover:bg-background"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={submit}
                disabled={saving || collected.length === 0}
                className="gradient-primary"
              >
                {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Import {collected.length > 0 ? `${collected.length} ` : ""}lead
                {collected.length === 1 ? "" : "s"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Chip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-semibold tabular-nums">{value}</span>
    </div>
  );
}
