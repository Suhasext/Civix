import { useState } from "react";
import { TicketCard, ResolutionEvidence } from "./TicketCard";
import type { ManagedTicket } from "../lib/ticket";
import { useI18n } from "../lib/i18n";

export function TrackTicket({ tickets, onRespond }: { tickets: ManagedTicket[]; onRespond: (id:string, choice:"confirmed"|"disputed", reason:string)=>void }) {
  const { t } = useI18n();
  const [reason,setReason] = useState("");
  const [error,setError] = useState("");
  return <section><div className="intro"><h1>{t("My reports")}</h1><p>{t("Review your reports and confirm whether the issue is fixed.")}</p></div>
    <div className="citizen-reports">{tickets.length === 0 && <p>{t("No reports yet.")}</p>}
    {[...tickets].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)).map(ticket=><article className="panel form" key={ticket.id}>
      <TicketCard ticket={ticket} receipt/>
      <p><strong>{t("Status:")}</strong> {t(ticket.status)}</p>
      <ResolutionEvidence ticket={ticket}/>
      {ticket.citizenResponse?.choice === "confirmed" && <p className="notice">{t("Citizen confirmed")}</p>}
      {ticket.status === "Resolved" && !ticket.citizenResponse && <section className="controls">
        <button className="primary" onClick={()=>{try{onRespond(ticket.id,"confirmed","");setError("");}catch(e){setError((e as Error).message)}}}>{t("Confirm fixed")}</button>
        <label htmlFor={`dispute-${ticket.id}`}>{t("Why is this not fixed?")}</label>
        <textarea id={`dispute-${ticket.id}`} value={reason} onChange={e=>setReason(e.target.value)}/>
        {error && <p role="alert" className="notice">{error}</p>}
        <button className="secondary" onClick={()=>{try{onRespond(ticket.id,"disputed",reason);setReason("");setError("");}catch(e){setError((e as Error).message)}}}>{t("This isn't fixed")}</button>
      </section>}
      {(ticket.reopenCount ?? 0) > 0 && <p className="notice">{t("Severity raised from")} {t(ticket.originalSeverity ?? ticket.severity)} {t("to")} {t(ticket.severity)} {t("because the citizen reported it is not fixed.")} {(ticket.reopenCount ?? 0) >= 2 && t("Escalated")}</p>}
    </article>)}</div></section>;
}
