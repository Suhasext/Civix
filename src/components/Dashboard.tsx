import { useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import { DEPARTMENT_BY_CATEGORY, SEVERITY_RANK, type ManagedTicket, type OfficerEdit } from "../lib/ticket";
import { SeverityBadge, Timestamp } from "./TicketCard";
import { Inspector } from "./Inspector";

export function Dashboard({tickets,onEdit,onReset,onResolveGroup}: {tickets:ManagedTicket[]; onEdit:(id:string,edit:OfficerEdit)=>void; onReset:()=>void; onResolveGroup:(ids:string[])=>void}) {
  const [department,setDepartment]=useState("");
  const [severity,setSeverity]=useState("All");
  const [archive,setArchive]=useState(false);
  const [query,setQuery]=useState("");
  const [selected,setSelected]=useState("");
  const active=tickets.filter(ticket=>ticket.status!=="Resolved");
  const metrics=[
    ["Total Active",active.length], ["Critical",active.filter(t=>t.severity==="Critical").length],
    ["High Priority",active.filter(t=>t.severity==="High").length], ["Resolved",tickets.length-active.length],
  ] as const;
  const needle=query.trim().toLowerCase();
  const rows=tickets.filter(t=>(t.status==="Resolved")===archive && (!department || t.department===department)
    && (severity==="All" || t.severity===severity)
    && [t.id,t.originalText,t.englishSummary,t.department].some(value=>value.toLowerCase().includes(needle)))
    .sort((a,b)=>SEVERITY_RANK[a.severity]-SEVERITY_RANK[b.severity] || Date.parse(a.createdAt)-Date.parse(b.createdAt));
  // Only identical full reports are grouped automatically.
  const matching = new Map<string, ManagedTicket[]>();
  for (const ticket of tickets) {
    const text = ticket.originalText.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
    const group = matching.get(text) ?? [];
    group.push(ticket);
    matching.set(text, group);
  }
  const shown = new Set<string>();
  const groups = rows.flatMap(ticket => {
    if (shown.has(ticket.id)) return [];
    const text = ticket.originalText.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
    const all = matching.get(text) ?? [ticket];
    const visible = rows.filter(row => all.some(member => member.id === row.id));
    visible.forEach(row => shown.add(row.id));
    return [{ ticket, visible, all }];
  });
  const inspected=tickets.find(t=>t.id===selected);
  return <section><div className="intro"><h1>Officer Command Center</h1><p>Review the priority queue and manage municipal response.</p></div>
    <div className="metrics">{metrics.map(([label,value])=><div className="panel" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <section className="panel queuepanel"><div className="queuehead"><div className="pills">
      {["Active Queue","Resolved Archive"].map((label,i)=><button key={label} aria-pressed={archive===Boolean(i)} onClick={()=>setArchive(Boolean(i))}>{label}</button>)}</div>
      <button className="secondary" onClick={()=>{if(confirm("Restore the eight demo tickets and remove other complaints from this browser?")){
        onReset(); setArchive(false); setDepartment(""); setSeverity("All"); setQuery("");
      }}}><RotateCcw size={14}/>Reset Demo Data</button></div>
      <div className="filters"><input type="search" aria-label="Search tickets" placeholder="Search tickets…" value={query} onChange={e=>setQuery(e.target.value)}/>
      <select aria-label="Filter by department" value={department} onChange={e=>setDepartment(e.target.value)}><option value="">All Departments</option>
      {Object.values(DEPARTMENT_BY_CATEGORY).map(d=><option key={d}>{d}</option>)}</select>
      <div className="pills">{["All",...Object.keys(SEVERITY_RANK)].map(level=><button key={level} aria-pressed={severity===level} onClick={()=>setSeverity(level)}>{level}</button>)}</div></div>
      <div className="queue">{groups.map(({ticket, visible, all}) => {
        const renderRow = (t: ManagedTicket) => <button className="row" key={t.id} onClick={()=>setSelected(t.id)}>
          <SeverityBadge severity={t.severity}/><code>{t.id}</code><span className="rowmain"><strong title={t.englishSummary}>{t.englishSummary}</strong><span className="dept">{t.department}</span></span>
          <span className="rowstatus"><span className="status">{t.status}</span>{t.officerAdjusted && <small>Officer Adjusted</small>}</span><Timestamp ticket={t}/><ChevronRight size={17}/></button>;
        if (all.length < 2) return renderRow(ticket);
        const activeMembers = all.filter(member => member.status !== "Resolved");
        return <details key={ticket.id} className="duplicate-group">
          <summary><strong>Matching reports</strong> · {all.length} tickets · {ticket.englishSummary}</summary>
          <p>Identical complaint text. Review the location and each ticket before resolving them together.</p>
          {visible.map(renderRow)}
          {activeMembers.length > 0 && <button className="secondary group-action" onClick={() => {
            if (confirm(`Mark all ${activeMembers.length} active tickets in this group resolved?`))
              onResolveGroup(activeMembers.map(member => member.id));
          }}>Resolve all active tickets ({activeMembers.length})</button>}
        </details>;
      })}
        {!rows.length && <p className="empty">No tickets match this queue and its filters.</p>}</div></section>      {inspected && <Inspector ticket={inspected} onEdit={edit=>onEdit(inspected.id,edit)} onClose={()=>setSelected("")}/>}</section>;
}
