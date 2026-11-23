import { CircleAlert, Info, OctagonAlert, TriangleAlert, CheckCircle2 } from "lucide-react";
import { STATUSES, type ManagedTicket, type Severity } from "../lib/ticket";
import { useI18n } from "../lib/i18n";

const icons = { Critical: OctagonAlert, High: TriangleAlert, Medium: CircleAlert, Low: Info };
export function SeverityBadge({severity}: {severity: Severity}) {
  const { t } = useI18n();
  const Icon = icons[severity];
  return <span className={"badge " + severity}><Icon size={14}/>{t(severity)}</span>;
}

export function Timestamp({ticket}: {ticket: ManagedTicket}) {
  const { language } = useI18n();
  const locale = language === "hi" ? "hi-IN" : language === "kn" ? "kn-IN" : "en-IN";
  return <time dateTime={ticket.createdAt}>{new Date(ticket.createdAt).toLocaleString(locale,{dateStyle:"medium",timeStyle:"short"})}</time>;
}

export function ResolutionEvidence({ticket}: {ticket: ManagedTicket}) {
  const { t, language } = useI18n();
  const resolution = ticket.resolution;
  if (!resolution) return null;
  const check = resolution.aiCheck;
  const Icon = check?.verdict === "Appears fixed" ? CheckCircle2 : check?.verdict === "Doesn't appear fixed" ? OctagonAlert : CircleAlert;
  return <section className="controls resolution-evidence"><h2>{t("Resolution evidence")}</h2>
    {ticket.photoDataUrl && <><label>{t("Before photo")}</label><img className="photo" src={ticket.photoDataUrl} alt={t("Before the fix")}/></>}
    <label>{t("After photo")}</label>{resolution.afterPhotoDataUrl ? <img className="photo" src={resolution.afterPhotoDataUrl} alt={t("After the fix")}/> : <p>{t("No photo in demo data or photo unavailable")}</p>}
    <p><strong>{t("Officer note:")}</strong> {resolution.note}</p>
    <p>{t("Location check:")} {resolution.locationCheck.result === "unavailable" ? t("No location evidence") : t(resolution.locationCheck.result)}{resolution.locationCheck.distanceM != null && ` · ${resolution.locationCheck.distanceM} ${language === "hi" ? "मी" : language === "kn" ? "ಮೀ" : "m"}`}</p>
    {check ? <p><span className={"badge " + (check.verdict === "Appears fixed" ? "Low" : check.verdict === "Unclear" ? "Medium" : "Critical")}><Icon size={14}/>{t("AI-suggested · ")}{t(check.verdict)}</span> {check.reason}</p> : <p>{t(ticket.photoDataUrl ? "AI check unavailable" : "No original photo to compare")}</p>}
  </section>;
}

export function TicketCard({ticket, receipt = false}: {ticket: ManagedTicket; receipt?: boolean}) {
  const { t, language } = useI18n();
  const locale = language === "hi" ? "hi-IN" : language === "kn" ? "kn-IN" : "en-IN";
  return <section className="details">
    <div className="detailhead"><div>{receipt && <h2>{t("Official Triage Receipt")}</h2>}<strong className="ticketid">{ticket.id}</strong><span className="detail-department">{t(ticket.department)}</span></div><Timestamp ticket={ticket}/></div>
    <div className="tags"><span>{t(ticket.isSeed ? "Demo" : ticket.source === "fallback" ? "Fallback" : "Live")}</span>
      <span>{ticket.detectedLanguage}</span>{ticket.officerAdjusted && <span>{t("Officer Adjusted")}</span>}
      {ticket.needsManualReview && <span>{t("Needs manual review")}</span>}</div>
    {receipt && <ol className="progress" aria-label={t("Ticket progress")}>{STATUSES.filter(status => status !== "Reopened").map((status,i) =>
      <li key={status} className={i <= STATUSES.indexOf(ticket.status === "Reopened" ? "In Progress" : ticket.status) ? "done" : ""} aria-current={status===ticket.status ? "step" : undefined}>{t(status)}</li>)}</ol>}
    <div className="triage-readout tactile-well"><label>{t("Assigned department")}</label><p>{t(ticket.department)}</p>
    <label>{t("Severity")}</label><SeverityBadge severity={ticket.severity}/>
    {ticket.source === "fallback" && <p className="notice">{t("AI unavailable. Basic keyword triage used. Please review.")}</p>}
    <div className="reason"><strong>{t(ticket.source === "fallback" ? "Keyword rationale" : "Original AI rationale")}</strong><p>{ticket.severityReason}</p></div></div>
    <label>{t(ticket.source === "fallback" ? "Complaint excerpt" : "English summary")}</label><h3 className="case-heading">{ticket.englishSummary}</h3>
    <label>{t("Original complaint · ")}{ticket.detectedLanguage}</label><p className="original">{ticket.originalText}</p>
    {ticket.photoDataUrl && <img className="photo" src={ticket.photoDataUrl} alt={t("Submitted complaint evidence")}/>}
    {ticket.photoObservation && <p>{ticket.photoObservation}</p>}
    {!receipt && <ResolutionEvidence ticket={ticket}/>}
    {!!ticket.history?.length && <section className="controls"><h2>{t("Ticket history")}</h2>
      {ticket.history.map((event,index) => <div key={index} className="reason">
        <strong>{t(event.status) + " · " + t(event.by)}</strong>
        <p><time dateTime={event.at}>{new Date(event.at).toLocaleString(locale, {dateStyle:"medium", timeStyle:"short"})}</time></p>
        {event.note && <p className="original">{event.note}</p>}
      </div>)}</section>}
  </section>;
}
