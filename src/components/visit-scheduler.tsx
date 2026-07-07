import { useState } from "react";
import { Calendar, Clock, Plus, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import type { Lead, Visit, UseCase } from "@/lib/types";
import { addVisit, cancelVisit } from "@/lib/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const TIME_SLOTS = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 01:00 PM",
  "01:00 PM - 02:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM",
  "05:00 PM - 06:00 PM",
];

export function VisitScheduler({
  lead,
  useCase,
}: {
  lead: Lead;
  useCase: UseCase;
}) {
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const label = useCase === "education" ? "Campus Visit" : "Site Visit";

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Please select a date");
      return;
    }
    if (!timeSlot) {
      toast.error("Please select a time slot");
      return;
    }
    if (!note.trim()) {
      toast.error("Please provide a note/reason for the visit");
      return;
    }

    setSaving(true);
    try {
      await addVisit(lead.id, { date, timeSlot, note: note.trim() }, useCase);
      toast.success(`${label} scheduled`);
      setDate("");
      setTimeSlot("");
      setNote("");
    } catch (err: any) {
      toast.error(err?.message ?? `Failed to schedule ${label}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (visitId: string) => {
    try {
      await cancelVisit(lead.id, visitId, useCase);
      toast.success(`${label} cancelled`);
    } catch (err: any) {
      toast.error(err?.message ?? `Failed to cancel ${label}`);
    }
  };

  const activeVisits = lead.visits ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <CalendarDays className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Schedule {label}</h3>
      </div>

      <form onSubmit={handleSchedule} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Date Picker */}
          <div className="space-y-1.5">
            <Label htmlFor="visit-date">Date</Label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="visit-date"
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 pl-9"
                required
              />
            </div>
          </div>

          {/* Time Slot Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="visit-time">Time Slot</Label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                id="visit-time"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select a time slot</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Note Requirement */}
        <div className="space-y-1.5">
          <Label htmlFor="visit-note">Visit Note / Requirement Detail (Required)</Label>
          <Textarea
            id="visit-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`e.g. Interested in campus tour for engineering / Wants to view block C 4th floor`}
            className="min-h-[80px]"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={saving || !date || !timeSlot || !note.trim()}
          className="w-full gradient-primary"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Schedule {label}
        </Button>
      </form>

      {/* Scheduled Visits List */}
      {activeVisits.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Scheduled Visits ({activeVisits.length})
          </h4>
          <div className="space-y-2">
            {activeVisits.map((v) => (
              <div
                key={v.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border/80 bg-muted/30 p-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-xs font-bold text-foreground">
                      {v.date}
                    </span>
                    <span className="text-[11px] text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{v.timeSlot}</span>
                  </div>
                  <p className="text-xs text-foreground/80">{v.note}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
                  onClick={() => handleCancel(v.id)}
                  title={`Cancel ${label}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
