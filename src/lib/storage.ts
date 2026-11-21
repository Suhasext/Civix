import { seedTickets } from "../data/seed";
import { DEPARTMENT_BY_CATEGORY, DEMO_CITIZEN_ID, type ManagedTicket, type OfficerEdit, type Resolution, type Ticket, type Severity, type LocationEvidence } from "./ticket";

const key = "civix.tickets.v3";

function save(tickets: ManagedTicket[]) { localStorage.setItem(key, JSON.stringify(tickets)); }

export function resetTickets() {
  const tickets: ManagedTicket[] = seedTickets().map((ticket, index) => {
    const status = index === 1 ? "In Progress" : index === 2 ? "Acknowledged" : index === 5 ? "Resolved" : "New";
    const resolution: Resolution | undefined = index === 5 ? {
      afterPhotoDataUrl: "", note: "Pothole filled and levelled.", resolvedAt: ticket.createdAt,
      locationCheck: { result: "same", distanceM: 40 },
      aiCheck: { verdict: "Appears fixed", reason: "Demo data: no photos were compared.", samePlaceLikely: true },
    } : undefined;
    return { ...ticket, id: `CL-${1001 + index}`, status, officerAdjusted: false,
      reporterId: [2,4,5,6].includes(index) ? DEMO_CITIZEN_ID : "demo-other-citizen",
      reopenCount: 0, updatedAt: ticket.createdAt, resolution,
      history: [{ at: ticket.createdAt, status: "New", by: "system" }] };
  });
  save(tickets);
  return tickets;
}

export function loadTickets(): ManagedTicket[] {
  const raw = localStorage.getItem(key);
  if (raw !== null) {
    try {
      const tickets = JSON.parse(raw);
      if (Array.isArray(tickets) && tickets.every(t => t && typeof t.id === "string" && t.category in DEPARTMENT_BY_CATEGORY)) return tickets;
    } catch { /* Restore the demo if the data cannot be read. */ }
  }
  return resetTickets();
}

export function addTicket(input: Ticket, reportLocation?: LocationEvidence) {
  const rows = loadTickets();
  const next = Math.max(1000, ...rows.map(t => Number(t.id.slice(3)) || 0)) + 1;
  let ticket: ManagedTicket = { ...input, id: `CL-${next}`, status: "New", officerAdjusted: false,
    reporterId: DEMO_CITIZEN_ID, reportLocation, reopenCount: 0, updatedAt: input.createdAt,
    history: [{ at: input.createdAt, status: "New", by: "citizen" }] };
  try { save([...rows, ticket]); }
  catch (error) {
    if (!(error instanceof DOMException && error.name === "QuotaExceededError" && ticket.photoDataUrl)) throw error;
    ticket = { ...ticket, photoDataUrl: undefined }; save([...rows, ticket]);
  }
  return { ticket, rows: [...rows, ticket] };
}

export function editTicket(id: string, edit: OfficerEdit & { officerNote?: string }) {
  const rows = loadTickets().map(ticket => {
    if (ticket.id !== id) return ticket;
    const now = new Date().toISOString();
    const status = edit.status ?? ticket.status;
    const noteChanged = edit.officerNote !== undefined && edit.officerNote !== ticket.officerNote;
    const event = status !== ticket.status || noteChanged;
    return { ...ticket, ...edit, updatedAt: now,
      officerAdjusted: ticket.officerAdjusted || edit.severity !== undefined || edit.department !== undefined,
      history: event ? [...(ticket.history ?? []), { at: now, status, by: "officer" as const, note: noteChanged ? edit.officerNote : undefined }] : ticket.history };
  });
  save(rows); return rows;
}

export function resolveTicket(id: string, resolution: Resolution) {
  const rows = loadTickets();
  const ticket = rows.find(row => row.id === id);
  if (!ticket || !resolution.afterPhotoDataUrl || resolution.note.trim().length < 10) throw new Error("An after photo and a note of at least 10 characters are required.");
  const now = new Date().toISOString();
  ticket.status = "Resolved"; ticket.resolution = resolution; ticket.citizenResponse = undefined; ticket.updatedAt = now;
  ticket.history = [...(ticket.history ?? []), { at: now, status: "Resolved", by: "officer", note: resolution.note }];
  try { save(rows); return { rows, photoSaved: true }; }
  catch (error) {
    if (!(error instanceof DOMException && error.name === "QuotaExceededError")) throw error;
    ticket.resolution = { ...resolution, afterPhotoDataUrl: "" }; save(rows);
    return { rows, photoSaved: false };
  }
}

export function respondToTicket(id: string, choice: "confirmed" | "disputed", reason = "") {
  const rows = loadTickets();
  const ticket = rows.find(row => row.id === id && row.reporterId === DEMO_CITIZEN_ID);
  if (!ticket || ticket.status !== "Resolved" || ticket.citizenResponse) throw new Error("This ticket is no longer awaiting your response.");
  if (choice === "disputed" && reason.trim().length < 5) throw new Error("Enter at least 5 characters.");
  const now = new Date().toISOString();
  ticket.citizenResponse = { choice, reason: reason.trim() || undefined, respondedAt: now };
  ticket.updatedAt = now;
  if (choice === "disputed") {
    const levels: Severity[] = ["Low", "Medium", "High", "Critical"];
    ticket.originalSeverity ??= ticket.severity;
    ticket.severity = levels[Math.min(levels.indexOf(ticket.severity) + 1, levels.length - 1)];
    ticket.reopenCount = (ticket.reopenCount ?? 0) + 1; ticket.status = "Reopened";
  }
  ticket.history = [...(ticket.history ?? []), { at: now, status: ticket.status, by: "citizen", note: choice === "confirmed" ? "Citizen confirmed" : reason.trim() }];
  save(rows); return rows;
}
