import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  writeBatch,
  where,
  getDocs,
  serverTimestamp,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Lead, Progress, TimelineEntry, Attachment, Visit, UseCase } from "./types";

const COLLECTION = "leads";

function fromDoc(id: string, data: any): Lead {
  return {
    id,
    userId: data.userId ?? "",
    name: data.name ?? "Unnamed Lead",
    phone: data.phone ?? "",
    progress: (data.progress ?? "New") as Progress,
    lastNote: data.lastNote ?? "",
    createdAt: data.createdAt ?? Date.now(),
    updatedAt: data.updatedAt ?? Date.now(),
    timeline: Array.isArray(data.timeline) ? data.timeline : [],
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
    visits: Array.isArray(data.visits) ? data.visits : [],
  };
}

export function subscribeLeads(userId: string, cb: (leads: Lead[]) => void): () => void {
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => fromDoc(d.id, d.data()));
    cb(items);
  });
}

export function subscribeLead(
  id: string,
  userId: string,
  cb: (lead: Lead | null) => void,
): () => void {
  return onSnapshot(doc(db, COLLECTION, id), (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }
    const lead = fromDoc(snap.id, snap.data());
    if (lead.userId !== userId) {
      cb(null);
    } else {
      cb(lead);
    }
  });
}

export async function createLead(input: {
  name: string;
  phone: string;
  note: string;
  userId: string;
}): Promise<string> {
  // Duplicate check scoped to the user
  const dupQ = query(
    collection(db, COLLECTION),
    where("userId", "==", input.userId),
    where("phone", "==", input.phone),
  );
  const dupSnap = await getDocs(dupQ);
  if (!dupSnap.empty) {
    // If it already exists, just ignore and return existing ID
    return dupSnap.docs[0].id;
  }

  let finalName = input.name.trim();
  if (!finalName) {
    const countSnap = await getCountFromServer(
      query(collection(db, COLLECTION), where("userId", "==", input.userId))
    );
    finalName = `C${countSnap.data().count + 1}`;
  }

  const now = Date.now();
  const entry: TimelineEntry = { ts: now, note: input.note.trim() || "Lead created", action: "created" };
  const ref = await addDoc(collection(db, COLLECTION), {
    userId: input.userId,
    name: finalName,
    phone: input.phone,
    progress: "New",
    lastNote: input.note.trim(),
    createdAt: now,
    updatedAt: now,
    timeline: [entry],
    attachments: [],
    visits: [],
    _serverCreatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function bulkCreateLeads(
  phones: string[],
  userId: string,
): Promise<{ created: number; duplicates: number }> {
  const existingSnap = await getDocs(
    query(collection(db, COLLECTION), where("userId", "==", userId)),
  );
  const existing = new Set(existingSnap.docs.map((d) => d.data().phone));

  const unique = Array.from(new Set(phones));
  const toCreate = unique.filter((p) => !existing.has(p));
  const duplicates = unique.length - toCreate.length;

  const countSnap = await getCountFromServer(
    query(collection(db, COLLECTION), where("userId", "==", userId))
  );
  let currentCount = countSnap.data().count;

  // Firestore batch limit 500
  for (let i = 0; i < toCreate.length; i += 400) {
    const batch = writeBatch(db);
    const slice = toCreate.slice(i, i + 400);
    for (const phone of slice) {
      const now = Date.now();
      const ref = doc(collection(db, COLLECTION));
      currentCount++;
      batch.set(ref, {
        userId,
        name: `C${currentCount}`,
        phone,
        progress: "New",
        lastNote: "Imported via bulk paste",
        createdAt: now,
        updatedAt: now,
        timeline: [{ ts: now, note: "Imported via bulk paste", action: "imported" }],
        attachments: [],
        visits: [],
      });
    }
    await batch.commit();
  }

  return { created: toCreate.length, duplicates };
}

export async function updateLead(
  id: string,
  patch: Partial<Pick<Lead, "name" | "progress" | "lastNote">>,
  timelineEntry?: TimelineEntry,
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  const existing = snap.data() ?? {};
  const timeline = Array.isArray(existing.timeline) ? existing.timeline : [];
  await updateDoc(ref, {
    ...patch,
    updatedAt: Date.now(),
    ...(timelineEntry ? { timeline: [...timeline, timelineEntry] } : {}),
  });
}

export async function addNote(id: string, note: string): Promise<void> {
  if (!note.trim()) return;
  const entry: TimelineEntry = { ts: Date.now(), note: note.trim(), action: "note" };
  await updateLead(id, { lastNote: note.trim() }, entry);
}

export async function addAttachment(id: string, attachment: Attachment): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  const existing = snap.data() ?? {};
  const attachments = Array.isArray(existing.attachments) ? existing.attachments : [];
  const timeline = Array.isArray(existing.timeline) ? existing.timeline : [];
  await updateDoc(ref, {
    attachments: [...attachments, attachment],
    updatedAt: Date.now(),
    timeline: [
      ...timeline,
      { ts: Date.now(), note: `Uploaded ${attachment.originalName}`, action: "attachment" },
    ],
  });
}

export async function removeAttachment(id: string, publicId: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  const existing = snap.data() ?? {};
  const attachments = Array.isArray(existing.attachments) ? existing.attachments : [];
  await updateDoc(ref, {
    attachments: attachments.filter((a: Attachment) => a.publicId !== publicId),
    updatedAt: Date.now(),
  });
}

export async function deleteLead(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function addVisit(
  leadId: string,
  visit: Omit<Visit, "id" | "createdAt">,
  useCase: UseCase,
): Promise<void> {
  const ref = doc(db, COLLECTION, leadId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Lead not found");

  const existing = snap.data();
  const visits = Array.isArray(existing.visits) ? existing.visits : [];
  const timeline = Array.isArray(existing.timeline) ? existing.timeline : [];

  const visitId = Math.random().toString(36).substring(2, 9);
  const newVisit: Visit = {
    ...visit,
    id: visitId,
    createdAt: Date.now(),
  };

  const label = useCase === "education" ? "Campus Visit" : "Site Visit";
  const noteText = `Scheduled ${label} on ${visit.date} at ${visit.timeSlot}. Note: ${visit.note}`;

  const timelineEntry: TimelineEntry = {
    ts: Date.now(),
    note: noteText,
    action: "visit",
  };

  await updateDoc(ref, {
    visits: [...visits, newVisit],
    updatedAt: Date.now(),
    timeline: [...timeline, timelineEntry],
  });
}

export async function cancelVisit(
  leadId: string,
  visitId: string,
  useCase: UseCase,
): Promise<void> {
  const ref = doc(db, COLLECTION, leadId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Lead not found");

  const existing = snap.data();
  const visits = Array.isArray(existing.visits) ? existing.visits : [];
  const timeline = Array.isArray(existing.timeline) ? existing.timeline : [];

  const visitToCancel = visits.find((v: Visit) => v.id === visitId);
  if (!visitToCancel) return;

  const label = useCase === "education" ? "Campus Visit" : "Site Visit";
  const noteText = `Cancelled ${label} scheduled for ${visitToCancel.date} at ${visitToCancel.timeSlot}`;

  const timelineEntry: TimelineEntry = {
    ts: Date.now(),
    note: noteText,
    action: "visit_cancelled",
  };

  await updateDoc(ref, {
    visits: visits.filter((v: Visit) => v.id !== visitId),
    updatedAt: Date.now(),
    timeline: [...timeline, timelineEntry],
  });
}

export async function migrateLeadProgress(userId: string, oldProgress: string, newProgress: string): Promise<void> {
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
    where("progress", "==", oldProgress)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;

  const now = Date.now();
  const entry: TimelineEntry = { ts: now, note: `Status updated from "${oldProgress}" to "${newProgress}"`, action: "progress" };

  // Firestore batch limit is 500 operations
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = writeBatch(db);
    const slice = snap.docs.slice(i, i + 400);
    for (const docSnap of slice) {
      const data = docSnap.data();
      const timeline = Array.isArray(data.timeline) ? data.timeline : [];
      batch.update(docSnap.ref, {
        progress: newProgress,
        updatedAt: now,
        timeline: [...timeline, entry]
      });
    }
    await batch.commit();
  }
}
