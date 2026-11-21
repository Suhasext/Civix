import { CircleAlert, Info, OctagonAlert, TriangleAlert } from "lucide-react";
import { STATUSES, type ManagedTicket, type Severity } from "../lib/ticket";

const icons = { Critical: OctagonAlert, High: TriangleAlert, Medium: CircleAlert, Low: Info };
export function SeverityBadge({severity}: {severity: Severity}) {
  const Icon = icons[severity];
  return <span className={"badge " + severity}><Icon size={14}/>{severity}</span>;
}

export function Timestamp({ticket}: {ticket: ManagedTicket}) {
  return <time dateTime={ticket.createdAt}>{new Date(ticket.createdAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</time>;
}

export function TicketCard({ticket, receipt = false}: {ticket: ManagedTicket; receipt?: boolean}) {
  return <section className="details">
    <div className="detailhead"><div>{receipt && <h2>Official Triage Receipt</h2>}<strong className="ticketid">{ticket.id}</strong></div><Timestamp ticket={ticket}/></div>
    <div className="tags"><span>{ticket.isSeed ? "Demo" : ticket.source === "fallback" ? "Fallback" : "Live"}</span>
      <span>{ticket.detectedLanguage}</span>{ticket.officerAdjusted && <span>Officer Adjusted</span>}
      {ticket.needsManualReview && <span>Needs manual review</span>}</div>
    {receipt && <ol className="progress" aria-label="Ticket progress">{STATUSES.map((status,i) =>
      <li key={status} className={i <= STATUSES.indexOf(ticket.status) ? "done" : ""} aria-current={status===ticket.status ? "step" : undefined}>{status}</li>)}</ol>}
    <label>Assigned department</label><p>{ticket.department}</p>
    <label>Severity</label><SeverityBadge severity={ticket.severity}/>
    {ticket.source === "fallback" && <p className="notice">AI unavailable. Basic keyword triage used. Please review.</p>}
    <div className="reason"><strong>{ticket.source === "fallback" ? "Keyword rationale" : "Original AI rationale"}</strong><p>{ticket.severityReason}</p></div>
    <label>{ticket.source === "fallback" ? "Complaint excerpt" : "English summary"}</label><p>{ticket.englishSummary}</p>
    <label>Original complaint · {ticket.detectedLanguage}</label><p className="original">{ticket.originalText}</p>
    {ticket.photoDataUrl && <img className="photo" src={ticket.photoDataUrl} alt="Submitted complaint evidence"/>}
    {ticket.photoObservation && <p>{ticket.photoObservation}</p>}
  </section>;
}
