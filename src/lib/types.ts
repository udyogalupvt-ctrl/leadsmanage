export const PROGRESS_OPTIONS = [
  "New",
  "Contacted",
  "Follow Up",
  "Interested",
  "Negotiating",
  "Deal Won",
  "Deal Lost",
  "Not Interested",
] as const;

export type Progress = string;

export type UseCase = "education" | "realestate";

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  useCase: UseCase;
  createdAt: number;
  customProgressOptions?: string[];
};

export type TimelineEntry = {
  ts: number;
  note: string;
  action: string;
};

export type Attachment = {
  url: string;
  publicId: string;
  resourceType: string;
  format?: string;
  bytes: number;
  originalName: string;
  uploadedAt: number;
};

export type Visit = {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  timeSlot: string; // e.g. "10:00 AM"
  note: string;
  createdAt: number;
};

export type Lead = {
  id: string;
  userId: string;
  name: string;
  phone: string;
  progress: Progress;
  lastNote?: string;
  createdAt: number;
  updatedAt: number;
  timeline: TimelineEntry[];
  attachments: Attachment[];
  visits: Visit[];
};

export const PROGRESS_TONE: Record<string, string> = {
  New: "badge-new",
  Contacted: "badge-contacted",
  "Follow Up": "badge-followup",
  Interested: "badge-interested",
  Negotiating: "badge-negotiating",
  "Deal Won": "badge-won",
  "Deal Lost": "badge-lost",
  "Not Interested": "badge-neutral",
};
