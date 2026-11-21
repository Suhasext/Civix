import { useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import { DEPARTMENT_BY_CATEGORY, SEVERITY_RANK, type ManagedTicket, type OfficerEdit, type Resolution } from "../lib/ticket";
import { SeverityBadge, Timestamp } from "./TicketCard";
import { Inspector } from "./Inspector";
import { useI18n } from "../lib/i18n";

export function Dashboard({tickets,onEdit,onResolve,onReset}: {tickets:ManagedTicket[]; onEdit:(id:string,edit:OfficerEdit & {officerNote?:string})=>void; onResolve:(id:string,resolution:Resolution)=>void; onReset:()=>void}) {
  const { t, language } = useI18n();
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
  const urgent=tickets.filter(ticket=>ticket.status!=="Resolved" && (ticket.severity==="Critical" || ticket.severity==="High")).length;
  const needsReview=tickets.filter(ticket=>ticket.status!=="Resolved" && ticket.needsManualReview).length;
  const resolved=tickets.filter(ticket=>ticket.status==="Resolved").length;
  return <section className="dashboard-screen"><div className="intro"><div><h1>{t("Priority queue")}</h1><p>{t("Review complaints and record resolution evidence.")}</p></div><div className="live-indicator"><span className="led-dot led-dot--resolved" aria-hidden="true"/>{t("Local queue ready")}</div></div>
    <div className="metrics" aria-label={t("Queue overview")}>
      <article className="bento-card metric-card metric-card--hero"><span className="metric-label">{t("Active reports")}</span><strong>{tickets.length-resolved}</strong><span className="metric-foot">{t("Across all departments")}</span></article>
      <article className="bento-card metric-card metric-card--urgent"><span className="metric-label"><span className="led-dot led-dot--critical" aria-hidden="true"/>{t("Urgent attention")}</span><strong>{urgent}</strong><span className="metric-foot">{t("Critical and high priority")}</span></article>
      <article className="bento-card metric-card metric-card--review"><span className="metric-label">{t("Manual review")}</span><strong>{needsReview}</strong><span className="metric-foot">{t("AI flagged for officer review")}</span></article>
    </div>
    <section className="panel queuepanel"><div className="queuehead"><h2>{rows.length} {t("tickets")}</h2><button className="secondary" onClick={()=>{if(confirm(t("Restore the demo tickets?")))onReset();}}><RotateCcw size={14}/>{t("Reset Demo Data")}</button></div>
    <div className="filters"><input type="search" aria-label={t("Search tickets")} placeholder={t("Search tickets…")} value={query} onChange={e=>setQuery(e.target.value)}/>
      <select aria-label={language === "hi" ? "विभाग से फ़िल्टर करें" : language === "kn" ? "ಇಲಾಖೆಯ ಪ್ರಕಾರ ಫಿಲ್ಟರ್ ಮಾಡಿ" : "Filter by department"} value={department} onChange={e=>setDepartment(e.target.value)}><option value="">{t("All Departments")}</option>{Object.values(DEPARTMENT_BY_CATEGORY).map(d=><option key={d} value={d}>{t(d)}</option>)}</select>
      <select aria-label={language === "hi" ? "गंभीरता से फ़िल्टर करें" : language === "kn" ? "ತೀವ್ರತೆಯ ಪ್ರಕಾರ ಫಿಲ್ಟರ್ ಮಾಡಿ" : "Filter by severity"} value={severity} onChange={e=>setSeverity(e.target.value)}>{["All","Critical","High","Medium","Low"].map(s=><option key={s} value={s}>{t(s)}</option>)}</select>
      <select aria-label={language === "hi" ? "स्थिति से फ़िल्टर करें" : language === "kn" ? "ಸ್ಥಿತಿಯ ಪ್ರಕಾರ ಫಿಲ್ಟರ್ ಮಾಡಿ" : "Filter by status"} value={status} onChange={e=>setStatus(e.target.value)}>{["Active","All","New","Acknowledged","In Progress","Resolved","Reopened"].map(s=><option key={s} value={s}>{t(s)}</option>)}</select></div>
    <div className="queue masonry-list">{groups.map(({ticket,all,visible})=>{
      const row=(item:ManagedTicket)=><button className="row" key={item.id} onClick={()=>setSelected(item.id)}>
        <span className="case-tab"><code>{item.id}</code><span className="dept">{t(item.department)}</span></span>
        <span className="case-heading">{item.englishSummary}</span><span className="original case-excerpt">{item.originalText}</span>
        <span className="case-footer"><SeverityBadge severity={item.severity}/><span className="rowstatus"><span className="status" data-status={item.status}>{t(item.status)}</span>{(item.reopenCount ?? 0)>=2 && <small>{t("Escalated")}</small>}</span><ChevronRight size={17} aria-hidden="true"/></span><Timestamp ticket={item}/></button>;
      return all.length<2 ? row(ticket) : <details className="duplicate-group" key={ticket.id}><summary><strong>{t("Matching reports")}</strong> · {all.length} {t("tickets")} · {ticket.englishSummary}</summary><p>{t("Identical complaint text. Review each ticket and record resolution evidence.")}</p>{visible.map(row)}</details>;
    })}      {!rows.length && <p className="empty">{t("No tickets match these filters.")}</p>}</div></section>
    {inspected && <Inspector key={inspected.id} ticket={inspected} onEdit={edit=>onEdit(inspected.id,edit)} onResolve={resolution=>onResolve(inspected.id,resolution)} onClose={()=>setSelected("")}/>}</section>;
}
