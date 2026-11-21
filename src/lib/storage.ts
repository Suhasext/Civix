import { seedTickets } from "../data/seed";
import { DEPARTMENT_BY_CATEGORY, SEVERITY_RANK, STATUSES, type ManagedTicket, type OfficerEdit, type Ticket } from "./ticket";

const key = "civiclens.tickets.v1";

function normalize(rows: (Ticket & Partial<ManagedTicket>)[]): ManagedTicket[] {
  const used = new Set<string>();
  let next = rows.reduce((max, row) => /^CL-\d{4,}$/.test(row.id) ? Math.max(max, Number(row.id.slice(3))) : max, 1000) + 1;
  return rows.map(row => {
    let id = row.id;
    if (!/^CL-\d{4,}$/.test(id) || used.has(id)) id = `CL-${next++}`;
    used.add(id);
    const officerAdjusted = row.officerAdjusted === true;
    const department = officerAdjusted && Object.values(DEPARTMENT_BY_CATEGORY).includes(row.department)
      ? row.department : DEPARTMENT_BY_CATEGORY[row.category];
    return { ...row, id, department, officerAdjusted,
      status: row.status && STATUSES.includes(row.status) ? row.status : "New" };
  });
}

function save(tickets: Ticket[]) {
  localStorage.setItem(key, JSON.stringify(tickets));
}

export function resetTickets() {
  const tickets = normalize(seedTickets());
  save(tickets);
  return tickets;
}

function validStoredTicket(item: Ticket) {
  return item && [item.originalText, item.englishSummary, item.detectedLanguage, item.severityReason].every(
    value => typeof value === "string" && value.trim()
  ) && Number.isFinite(Date.parse(item.createdAt)) && Object.hasOwn(DEPARTMENT_BY_CATEGORY, item.category)
    && Object.hasOwn(SEVERITY_RANK, item.severity) && ["ai", "fallback"].includes(item.source)
    && typeof item.needsManualReview === "boolean"
    && (item.photoDataUrl == null || typeof item.photoDataUrl === "string")
    && (item.photoObservation == null || typeof item.photoObservation === "string");
}

export function loadTickets(): ManagedTicket[] {
  const raw = localStorage.getItem(key);
  if (raw !== null) {
    let rows;
    try {
      rows = JSON.parse(raw);
    } catch { return resetTickets(); }
    if (Array.isArray(rows) && rows.every(validStoredTicket)) {
      const tickets = normalize(rows);
      if (JSON.stringify(tickets) !== raw) save(tickets);
      return tickets;
    }
  }
  return resetTickets();
}

export function addTicket(input: Ticket) {
  const rows = loadTickets();
  let ticket = normalize([...rows, input]).at(-1)!;
  try {
    save([...rows, ticket]);
  } catch (error) {
    if (!(error instanceof DOMException && error.name === "QuotaExceededError" && ticket.photoDataUrl)) throw error;
    ticket = { ...ticket, photoDataUrl: undefined };
    save([...rows, ticket]);
  }
  return { ticket, rows: [...rows, ticket] };
}

export function editTicket(id: string, edit: OfficerEdit) {
  const rows = loadTickets().map(ticket => ticket.id !== id ? ticket : {
    ...ticket, ...edit,
    history: edit.status === "Resolved" && ticket.status !== "Resolved"
      ? [...(ticket.history ?? []), { type: "resolved" as const, at: new Date().toISOString() }]
      : ticket.history,
    officerAdjusted: ticket.officerAdjusted || edit.severity !== undefined || edit.department !== undefined,
  });
  save(rows);
  return rows;
}


export function reopenTicket(id: string, explanation: string) {
  const message = explanation.trim();
  if (!message) throw new Error("Explain why the issue is still unresolved.");
  const rows = loadTickets();
  const ticket = rows.find(row => row.id === id);
  if (!ticket || ticket.status !== "Resolved") throw new Error("This ticket is no longer resolved. Refresh its status and try again.");
  ticket.history = [...(ticket.history ?? []), { type: "reopened", at: new Date().toISOString(), explanation: message }];
  ticket.status = "In Progress";
  save(rows);
  return rows;
}
export function resolveTickets(ids: string[]) {
  const selected = new Set(ids);
  const rows = loadTickets().map(ticket => {
    if (!selected.has(ticket.id) || ticket.status === "Resolved") return ticket;
    return {
      ...ticket,
      status: "Resolved" as const,
      history: [...(ticket.history ?? []), { type: "resolved" as const, at: new Date().toISOString() }],
    };
  });
  save(rows);
  return rows;
}