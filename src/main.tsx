import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Landmark, LayoutList, Search, SquarePen } from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { IntakeForm } from "./components/IntakeForm";
import { TrackTicket } from "./components/TrackTicket";
import { editTicket, loadTickets, resetTickets } from "./lib/storage";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "./style.css";

const tabs = [["Report Issue",SquarePen],["Track Ticket",Search],["Officer Command Center",LayoutList]] as const;
function App() {
  const [view,setView]=useState<string>("Report Issue");
  const [tickets,setTickets]=useState(loadTickets);
  const [selected,setSelected]=useState("");
  const [notice,setNotice]=useState("");
  useEffect(()=>{
    function refresh(e:StorageEvent){if(!e.key || e.key==="civiclens.tickets.v1") setTickets(loadTickets());}
    window.addEventListener("storage",refresh);return ()=>window.removeEventListener("storage",refresh);
  },[]);
  return <><header><div className="bar"><div className="brand"><Landmark/><div>Civix<small>Municipal AI Triage</small></div></div>
    <nav aria-label="Main navigation">{tabs.map(([name,Icon])=><button key={name} aria-current={view===name?"page":undefined} onClick={()=>setView(name)}>
      <Icon size={16}/>{name}{name==="Officer Command Center" && <b>{tickets.filter(t=>t.status!=="Resolved").length}</b>}</button>)}</nav></div></header>
    <main><div hidden={view!=="Report Issue"}><IntakeForm onSave={(rows,ticket,message)=>{
      setTickets(rows);setSelected(ticket.id);setNotice(message);setView("Track Ticket");
    }}/></div>
    {view==="Track Ticket" && <TrackTicket tickets={tickets} selected={selected} notice={notice} onSelect={id=>{setSelected(id);setNotice("");}}/>}
    {view==="Officer Command Center" && <Dashboard tickets={tickets} onEdit={(id,edit)=>setTickets(editTicket(id,edit))}
      onReset={()=>{setTickets(resetTickets());setSelected("");setNotice("");}}/>}</main></>;
}
createRoot(document.getElementById("root")!).render(<App/>);
