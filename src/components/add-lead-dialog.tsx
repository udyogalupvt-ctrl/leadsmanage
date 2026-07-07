import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { extractIndianMobiles } from "@/lib/phone";
import { createLead } from "@/lib/leads";

export function AddLeadDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { valid } = extractIndianMobiles(phone);
    if (valid.length === 0) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    if (!note.trim()) {
      toast.error("Initial note is required");
      return;
    }
    setSaving(true);
    try {
      await createLead({ name: name.trim(), phone: valid[0], note: note.trim(), userId });
      toast.success("Lead added");
      setName("");
      setPhone("");
      setNote("");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to add lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary shadow-[var(--shadow-glow)]">
          <Plus className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Add lead</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a new lead</DialogTitle>
          <DialogDescription>Capture a single lead in seconds.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ananya Sharma"
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              inputMode="tel"
            />
            <p className="text-xs text-muted-foreground">
              Any format — we'll auto-extract the 10-digit number.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="initial-note">Initial note / Conversation detail</Label>
            <Textarea
              id="initial-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Interested in 3BHK, scheduled visit"
              className="min-h-[80px]"
              maxLength={1000}
              required
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving} className="gradient-primary">
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Save lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
