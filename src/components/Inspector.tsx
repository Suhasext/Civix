import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { DEPARTMENT_BY_CATEGORY, SEVERITY_RANK, STATUSES, type ManagedTicket, type OfficerEdit, type Department, type Severity } from "../lib/ticket";
import { TicketCard } from "./TicketCard";

export function Inspector({ticket,onEdit,onClose}: {ticket: ManagedTicket; onEdit:(edit:OfficerEdit)=>void; onClose:()=>void}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(()=>{ const dialog=ref.current!; dialog.showModal(); return ()=>dialog.close(); },[]);
  return <dialog ref={ref} className="drawer" aria-label={"Ticket inspector " + ticket.id} onCancel={onClose} onClick={e=>{
    if(e.target===ref.current && e.clientX < ref.current!.getBoundingClientRect().left) onClose();
  }}><div className="drawerhead"><h2>Ticket inspector</h2><button className="iconbtn" aria-label="Close inspector" onClick={onClose}><X size={20}/></button></div>
    <TicketCard ticket={ticket}/>
    <section className="controls"><h2>Officer controls</h2><label>Workflow status</label><div className="pills">
      {STATUSES.map(status=><button key={status} aria-pressed={ticket.status===status} onClick={()=>onEdit({status})}>{status}</button>)}</div>
      <label htmlFor="assign">Reassign department</label><select id="assign" value={ticket.department} onChange={e=>onEdit({department:e.target.value as Department})}>
      {Object.values(DEPARTMENT_BY_CATEGORY).map(dept=><option key={dept}>{dept}</option>)}</select>
      <label htmlFor="override">Override severity</label><select id="override" value={ticket.severity} onChange={e=>onEdit({severity:e.target.value as Severity})}>
      {Object.keys(SEVERITY_RANK).map(level=><option key={level}>{level}</option>)}</select></section></dialog>;
}
