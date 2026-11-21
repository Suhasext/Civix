import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Landmark } from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { IntakeForm } from "./components/IntakeForm";
import { TrackTicket } from "./components/TrackTicket";
import { editTicket, loadTickets, resetTickets, resolveTicket, respondToTicket } from "./lib/storage";
import { DEMO_CITIZEN_ID } from "./lib/ticket";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "./style.css";

function App() {
  const [role,setRole]=useState<"citizen"|"officer"|null>(()=> {
    const stored=localStorage.getItem("civix.role"); return stored==="citizen" || stored==="officer" ? stored : null;
  });
  const [view,setView]=useState("Report an issue");
  const [tickets,setTickets]=useState(loadTickets);
  const [notice,setNotice]=useState("");
  useEffect(()=>{
    function refresh(e:StorageEvent){if(!e.key || e.key==="civix.tickets.v3")setTickets(loadTickets());}
    window.addEventListener("storage",refresh);return ()=>window.removeEventListener("storage",refresh);
  },[]);
  function choose(value:"citizen"|"officer") {localStorage.setItem("civix.role",value);setRole(value);setView(value==="citizen"?"Report an issue":"Priority queue");}
  return <><header><div className="bar"><div className="brand"><Landmark/><div>Civix<small>Municipal AI Triage</small></div></div>
    {role && <nav aria-label="Main navigation"><span>{role==="citizen"?"Citizen":"Officer"} · Demo mode</span>
      {role==="citizen" && ["Report an issue","My reports"].map(name=><button key={name} aria-current={view===name?"page":undefined} onClick={()=>setView(name)}>{name}</button>)}
      <button onClick={()=>{localStorage.removeItem("civix.role");setRole(null);}}>Switch role</button></nav>}</div></header>
    <main>{!role ? <section className="panel form role-select"><h1>Welcome to Civix</h1><p>Demo mode</p>
      <div className="pills"><button onClick={()=>choose("citizen")}>Continue as Citizen</button><button onClick={()=>choose("officer")}>Continue as Officer</button></div></section> :
      role==="citizen" ? <><div hidden={view!=="Report an issue"}><IntakeForm active={view==="Report an issue"} onSave={(rows,_ticket,message)=>{setTickets(rows);setNotice(message);setView("My reports");}}/></div>
      {view==="My reports" && <>{notice && <p className="notice" role="status">{notice}</p>}<TrackTicket tickets={tickets.filter(t=>t.reporterId===DEMO_CITIZEN_ID)} onRespond={(id,choice,reason)=>setTickets(respondToTicket(id,choice,reason))}/></>}</> :
      <Dashboard tickets={tickets} onEdit={(id,edit)=>setTickets(editTicket(id,edit))} onResolve={(id,resolution)=>{const result=resolveTicket(id,resolution);setTickets(result.rows);if(!result.photoSaved)alert("Storage is full. Resolution was saved without the after photo.");}} onReset={()=>setTickets(resetTickets())}/>}</main></>;
}
createRoot(document.getElementById("root")!).render(<App/>);
