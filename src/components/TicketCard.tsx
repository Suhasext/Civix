import { CircleAlert, Info, OctagonAlert, TriangleAlert, CheckCircle2 } from "lucide-react";
import { STATUSES, type ManagedTicket, type Severity } from "../lib/ticket";

const icons = { Critical: OctagonAlert, High: TriangleAlert, Medium: CircleAlert, Low: Info };
export function SeverityBadge({severity}: {severity: Severity}) {
  const Icon = icons[severity];
  return <span className={"badge " + severity}><Icon size={14}/>{severity}</span>;
}

export function Timestamp({ticket}: {ticket: ManagedTicket}) {
  return <time dateTime={ticket.createdAt}>{new Date(ticket.createdAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</time>;
}

export function ResolutionEvidence({ticket}: {ticket: ManagedTicket}) {
  const resolution = ticket.resolution;
  if (!resolution) return null;
  const check = resolution.aiCheck;
  const Icon = check?.verdict === "Appears fixed" ? CheckCircle2 : check?.verdict === "Doesn't appear fixed" ? OctagonAlert : CircleAlert;
  return <section className="controls"><h2>Resolution evidence</h2>
    {ticket.photoDataUrl && <><label>Before photo</label><img className="photo" src={ticket.photoDataUrl} alt="Before the fix"/></>}
    <label>After photo</label>{resolution.afterPhotoDataUrl ? <img className="photo" src={resolution.afterPhotoDataUrl} alt="After the fix"/> : <p>No photo in demo data or photo unavailable</p>}
    <p><strong>Officer note:</strong> {resolution.note}</p>
    <p>Location check: {resolution.locationCheck.result === "unavailable" ? "No location evidence" : resolution.locationCheck.result}{resolution.locationCheck.distanceM != null && ` · ${resolution.locationCheck.distanceM} m`}</p>
    {check ? <p><span className={"badge " + (check.verdict === "Appears fixed" ? "Low" : check.verdict === "Unclear" ? "Medium" : "Critical")}><Icon size={14}/>AI-suggested · {check.verdict}</span> {check.reason}</p> : <p>{ticket.photoDataUrl ? "AI check unavailable" : "No original photo to compare"}</p>}
  </section>;
}

export function TicketCard({ticket, receipt = false}: {ticket: ManagedTicket; receipt?: boolean}) {
  return <section className="details">
    <div className="detailhead"><div>{receipt && <h2>Official Triage Receipt</h2>}<strong className="ticketid">{ticket.id}</strong></div><Timestamp ticket={ticket}/></div>
    <div className="tags"><span>{ticket.isSeed ? "Demo" : ticket.source === "fallback" ? "Fallback" : "Live"}</span>
      <span>{ticket.detectedLanguage}</span>{ticket.officerAdjusted && <span>Officer Adjusted</span>}
      {ticket.needsManualReview && <span>Needs manual review</span>}</div>
    {receipt && <ol className="progress" aria-label="Ticket progress">{STATUSES.filter(status => status !== "Reopened").map((status,i) =>
      <li key={status} className={i <= STATUSES.indexOf(ticket.status === "Reopened" ? "In Progress" : ticket.status) ? "done" : ""} aria-current={status===ticket.status ? "step" : undefined}>{status}</li>)}</ol>}
    <label>Assigned department</label><p>{ticket.department}</p>
    <label>Severity</label><SeverityBadge severity={ticket.severity}/>
    {ticket.source === "fallback" && <p className="notice">AI unavailable. Basic keyword triage used. Please review.</p>}
    <div className="reason"><strong>{ticket.source === "fallback" ? "Keyword rationale" : "Original AI rationale"}</strong><p>{ticket.severityReason}</p></div>
    <label>{ticket.source === "fallback" ? "Complaint excerpt" : "English summary"}</label><p>{ticket.englishSummary}</p>
    <label>Original complaint · {ticket.detectedLanguage}</label><p className="original">{ticket.originalText}</p>
    {ticket.photoDataUrl && <img className="photo" src={ticket.photoDataUrl} alt="Submitted complaint evidence"/>}
    {ticket.photoObservation && <p>{ticket.photoObservation}</p>}
    {!receipt && <ResolutionEvidence ticket={ticket}/>}
    {!!ticket.history?.length && <section className="controls"><h2>Ticket history</h2>
      {ticket.history.map((event,index) => <div key={index} className="reason">
        <strong>{event.status + " · " + event.by}</strong>
        <p><time dateTime={event.at}>{new Date(event.at).toLocaleString("en-IN", {dateStyle:"medium", timeStyle:"short"})}</time></p>
        {event.note && <p className="original">{event.note}</p>}
      </div>)}</section>}
  </section>;
}
