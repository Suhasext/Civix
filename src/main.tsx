import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, Landmark } from "lucide-react";
import { ArchiveDesk } from "./components/ArchiveDesk";
import { CursorTrail } from "./components/CursorTrail";
import { Dashboard } from "./components/Dashboard";
import { IntakeForm } from "./components/IntakeForm";
import { TrackTicket } from "./components/TrackTicket";
import { editTicket, loadTickets, resetTickets, resolveTicket, respondToTicket } from "./lib/storage";
import { DEMO_CITIZEN_ID } from "./lib/ticket";
import { I18nContext, translate, type Language } from "./lib/i18n";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "./style.css";

function App() {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem("civix.language");
    return stored === "hi" || stored === "kn" ? stored : "en";
  });
  const t = (text: string) => translate(language, text);
  const [role,setRole]=useState<"citizen"|"officer"|null>(()=> {
    const stored=localStorage.getItem("civix.role"); return stored==="citizen" || stored==="officer" ? stored : null;
  });
  const [view,setView]=useState("Report an issue");
  const [tickets,setTickets]=useState(loadTickets);
  const [notice,setNotice]=useState("");
  useEffect(() => {
    document.documentElement.lang = language === "hi" ? "hi" : language === "kn" ? "kn" : "en";
    localStorage.setItem("civix.language", language);
  }, [language]);
  useEffect(()=>{
    function refresh(e:StorageEvent){if(!e.key || e.key==="civix.tickets.v3")setTickets(loadTickets());}
    window.addEventListener("storage",refresh);return ()=>window.removeEventListener("storage",refresh);
  },[]);
  function choose(value:"citizen"|"officer") {localStorage.setItem("civix.role",value);setRole(value);setView(value==="citizen"?"Report an issue":"Priority queue");}
  return <I18nContext.Provider value={{ language, t }}><CursorTrail/><div className="drafting-backdrop" aria-hidden="true"/><div className="drafting-frame" aria-hidden="true"><i className="registration registration--tl"/><i className="registration registration--tr"/><i className="registration registration--bl"/><i className="registration registration--br"/></div><header className="app-header"><div className="bar"><div className="brand"><Landmark/><div>Civix<small>{t("Municipal AI Triage")}</small></div></div>
    <nav className="app-nav" aria-label={language === "hi" ? "मुख्य नेविगेशन" : language === "kn" ? "ಮುಖ್ಯ ನ್ಯಾವಿಗೇಶನ್" : "Main navigation"}>
      {role && <button className="tactile-key switch-desk" onClick={()=>{localStorage.removeItem("civix.role");setRole(null);}}><ArrowLeft size={14} aria-hidden="true"/>{t("Switch Desk")}</button>}
      <div className="language-rocker" role="group" aria-label={language === "hi" ? "भाषा" : language === "kn" ? "ಭಾಷೆ" : "Language"}>
        {(["en", "hi", "kn"] as const).map(code => <button key={code} type="button" aria-label={code === "en" ? "English" : code === "hi" ? "हिन्दी" : "ಕನ್ನಡ"} aria-pressed={language === code} onClick={() => setLanguage(code)}>{code.toUpperCase()}</button>)}
      </div>
      {role==="citizen" && <div className="nav-switch">{["Report an issue","My reports"].map(name=><button key={name} aria-current={view===name?"page":undefined} onClick={()=>setView(name)}>{t(name)}</button>)}</div>}</nav></div></header>
    <main className={!role ? "landing-workspace" : undefined}>{!role ? <ArchiveDesk onChoose={choose}/> :
      role==="citizen" ? <><div hidden={view!=="Report an issue"}><IntakeForm active={view==="Report an issue"} onSave={(rows,_ticket,message)=>{setTickets(rows);setNotice(message);setView("My reports");}}/></div>
      {view==="My reports" && <>{notice && <p className="notice" role="status">{notice}</p>}<TrackTicket tickets={tickets.filter(t=>t.reporterId===DEMO_CITIZEN_ID)} onRespond={(id,choice,reason)=>setTickets(respondToTicket(id,choice,reason))}/></>}</> :
      <Dashboard tickets={tickets} onEdit={(id,edit)=>setTickets(editTicket(id,edit))} onResolve={(id,resolution)=>{const result=resolveTicket(id,resolution);setTickets(result.rows);if(!result.photoSaved)alert(language === "hi" ? "स्टोरेज भर गया है। समाधान बाद की फ़ोटो के बिना सहेजा गया।" : language === "kn" ? "ಸಂಗ್ರಹಣೆ ತುಂಬಿದೆ. ನಂತರದ ಫೋಟೋ ಇಲ್ಲದೆ ಪರಿಹಾರವನ್ನು ಉಳಿಸಲಾಗಿದೆ." : "Storage is full. Resolution was saved without the after photo.");}} onReset={()=>setTickets(resetTickets())}/>}</main></I18nContext.Provider>;
}
createRoot(document.getElementById("root")!).render(<App/>);
