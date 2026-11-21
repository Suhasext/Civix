import { useState } from "react";
import { TicketCard, ResolutionEvidence } from "./TicketCard";
import type { ManagedTicket } from "../lib/ticket";

export function TrackTicket({ tickets, onRespond }: { tickets: ManagedTicket[]; onRespond: (id:string, choice:"confirmed"|"disputed", reason:string)=>void }) {
  const [reason,setReason] = useState("");
  const [error,setError] = useState("");
  return <section><div className="intro"><h1>My reports</h1><p>Review your reports and confirm whether the issue is fixed.</p></div>
    <div className="citizen-reports">{tickets.length === 0 && <p>No reports yet.</p>}
    {[...tickets].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)).map(ticket=><article className="panel form" key={ticket.id}>
      <TicketCard ticket={ticket} receipt/>
      <p><strong>Status:</strong> {ticket.status}</p>
      <ResolutionEvidence ticket={ticket}/>
      {ticket.citizenResponse?.choice === "confirmed" && <p className="notice">Citizen confirmed</p>}
      {ticket.status === "Resolved" && !ticket.citizenResponse && <section className="controls">
        <button className="primary" onClick={()=>{try{onRespond(ticket.id,"confirmed","");setError("");}catch(e){setError((e as Error).message)}}}>Confirm fixed</button>
        <label htmlFor={`dispute-${ticket.id}`}>Why is this not fixed?</label>
        <textarea id={`dispute-${ticket.id}`} value={reason} onChange={e=>setReason(e.target.value)}/>
        {error && <p role="alert" className="notice">{error}</p>}
        <button className="secondary" onClick={()=>{try{onRespond(ticket.id,"disputed",reason);setReason("");setError("");}catch(e){setError((e as Error).message)}}}>This isn't fixed</button>
      </section>}
      {(ticket.reopenCount ?? 0) > 0 && <p className="notice">Severity raised from {ticket.originalSeverity} to {ticket.severity} because the citizen reported it is not fixed. {(ticket.reopenCount ?? 0) >= 2 && "Escalated"}</p>}
    </article>)}</div></section>;
}
