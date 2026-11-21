import { useState } from "react";
import type { ManagedTicket } from "../lib/ticket";
import { TicketCard } from "./TicketCard";

export function TrackTicket({tickets, selected, onSelect, notice, onReopen}: {
  tickets: ManagedTicket[]; selected: string; onSelect: (id: string) => void; notice: string; onReopen: (id: string, explanation: string) => void;
}) {
  const [query,setQuery] = useState(selected);
  const [explanation,setExplanation] = useState("");
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");
  const recent = [...tickets].sort((a,b) => Date.parse(b.createdAt)-Date.parse(a.createdAt)).slice(0,5);
  const ticket = tickets.find(row => row.id === selected);
  function select(id: string) { setQuery(id); setExplanation(""); setMessage(""); setError(""); onSelect(id); }
  return <section><div className="intro"><h1>Track ticket</h1><p>Look up your receipt and current workflow status.</p></div>
    <div className="layout"><div className="panel form"><h2>Ticket lookup</h2>
    <form onSubmit={e => {e.preventDefault(); select(query.trim().toUpperCase());}}>
      <label htmlFor="lookup">Ticket ID</label><div className="searchline"><input required id="lookup" placeholder="CL-1001" value={query} onChange={e=>setQuery(e.target.value)}/><button className="primary">Look up</button></div>
    </form><label>Recent tickets</label><div className="pills">{recent.map(row=><button key={row.id} onClick={()=>select(row.id)} aria-pressed={selected===row.id}>{row.id}</button>)}</div></div>
    <div className="panel form">{notice && <div role="status" className="notice">{notice}</div>}{ticket ? <><TicketCard ticket={ticket} receipt/>
    {message && <p role="status" className="notice">{message}</p>}
    {ticket.status === "Resolved" && <form className="controls" onSubmit={e => {
      e.preventDefault();
      try { onReopen(ticket.id, explanation); setExplanation(""); setError(""); setMessage("Your update was saved and the ticket returned to the active queue."); }
      catch (err) { setError(err instanceof Error ? err.message : "Could not save your update."); }
    }}><h2>Issue still unresolved?</h2><label htmlFor="explanation">Tell the officer what remains unresolved</label>
    <textarea id="explanation" value={explanation} onChange={e=>setExplanation(e.target.value)} required maxLength={2000}/>
    {error && <p role="alert" className="notice">{error}</p>}
    <button className="primary" type="submit">Reopen ticket</button></form>}</> : <p role="status">{selected ? "No ticket found for " + selected + "." : "Enter a ticket ID or choose a recent ticket."}</p>}</div></div></section>;
}
