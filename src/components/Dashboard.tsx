import { useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import { DEPARTMENT_BY_CATEGORY, SEVERITY_RANK, type ManagedTicket, type OfficerEdit, type Resolution } from "../lib/ticket";
import { SeverityBadge, Timestamp } from "./TicketCard";
import { Inspector } from "./Inspector";

export function Dashboard({tickets,onEdit,onResolve,onReset}: {tickets:ManagedTicket[]; onEdit:(id:string,edit:OfficerEdit & {officerNote?:string})=>void; onResolve:(id:string,resolution:Resolution)=>void; onReset:()=>void}) {
  const [department,setDepartment]=useState("");
  const [status,setStatus]=useState("Active");
  const [severity,setSeverity]=useState("All");
  const [query,setQuery]=useState("");
  const [selected,setSelected]=useState("");
  const needle=query.trim().toLowerCase();
  const rows=tickets.filter(t=>(status==="All" || (status==="Active" ? t.status!=="Resolved" : t.status===status)) && (!department || t.department===department) && (severity==="All" || t.severity===severity)
    && [t.id,t.originalText,t.englishSummary,t.department].some(value=>value.toLowerCase().includes(needle)))
    .sort((a,b)=>SEVERITY_RANK[a.severity]-SEVERITY_RANK[b.severity] || Date.parse(a.createdAt)-Date.parse(b.createdAt));
  const matched = new Map<string, ManagedTicket[]>();
  for (const ticket of tickets) {
    const key = ticket.originalText.normalize("NFKC").trim().replace(/\s+/g," ").toLocaleLowerCase();
    matched.set(key, [...(matched.get(key) ?? []), ticket]);
  }
  const seen = new Set<string>();
  const groups = rows.flatMap(ticket => {
    if (seen.has(ticket.id)) return [];
    const key = ticket.originalText.normalize("NFKC").trim().replace(/\s+/g," ").toLocaleLowerCase();
    const all = matched.get(key) ?? [ticket];
    const visible = rows.filter(row => all.some(member => member.id === row.id));
    visible.forEach(member => seen.add(member.id));
    return [{ ticket, all, visible }];
  });
  const inspected=tickets.find(t=>t.id===selected);
  return <section><div className="intro"><h1>Priority queue</h1><p>Review complaints and record resolution evidence.</p></div>
    <section className="panel queuepanel"><div className="queuehead"><h2>{rows.length} tickets</h2><button className="secondary" onClick={()=>{if(confirm("Restore the demo tickets?"))onReset();}}><RotateCcw size={14}/>Reset Demo Data</button></div>
    <div className="filters"><input type="search" aria-label="Search tickets" placeholder="Search tickets…" value={query} onChange={e=>setQuery(e.target.value)}/>
      <select aria-label="Filter by department" value={department} onChange={e=>setDepartment(e.target.value)}><option value="">All Departments</option>{Object.values(DEPARTMENT_BY_CATEGORY).map(d=><option key={d}>{d}</option>)}</select>
      <select aria-label="Filter by severity" value={severity} onChange={e=>setSeverity(e.target.value)}>{["All","Critical","High","Medium","Low"].map(s=><option key={s}>{s}</option>)}</select>
      <select aria-label="Filter by status" value={status} onChange={e=>setStatus(e.target.value)}>{["Active","All","New","Acknowledged","In Progress","Resolved","Reopened"].map(s=><option key={s}>{s}</option>)}</select></div>
    <div className="queue">{groups.map(({ticket,all,visible})=>{
      const row=(t:ManagedTicket)=><button className="row" key={t.id} onClick={()=>setSelected(t.id)}>
        <SeverityBadge severity={t.severity}/><code>{t.id}</code><span className="rowmain"><strong>{t.englishSummary}</strong><span className="dept">{t.department}</span></span>
        <span className="rowstatus"><span className="status">{t.status}</span>{(t.reopenCount ?? 0)>=2 && <small>Escalated</small>}</span><Timestamp ticket={t}/><ChevronRight size={17}/></button>;
      return all.length<2 ? row(ticket) : <details className="duplicate-group" key={ticket.id}><summary><strong>Matching reports</strong> · {all.length} tickets · {ticket.englishSummary}</summary><p>Identical complaint text. Review each ticket and record resolution evidence.</p>{visible.map(row)}</details>;
    })}      {!rows.length && <p className="empty">No tickets match these filters.</p>}</div></section>
    {inspected && <Inspector key={inspected.id} ticket={inspected} onEdit={edit=>onEdit(inspected.id,edit)} onResolve={resolution=>onResolve(inspected.id,resolution)} onClose={()=>setSelected("")}/>}</section>;
}
