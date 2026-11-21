import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { type ManagedTicket, type OfficerEdit, type Resolution, type LocationEvidence, DEPARTMENT_BY_CATEGORY, SEVERITY_RANK, type Department, type Severity } from "../lib/ticket";
import { captureLocation, checkLocations } from "../lib/location";
import { preparePhoto } from "../lib/photo";
import { verifyResolution } from "../lib/verifyResolution";
import { TicketCard } from "./TicketCard";

export function Inspector({ticket,onEdit,onResolve,onClose}: {ticket: ManagedTicket; onEdit:(edit:OfficerEdit & {officerNote?:string})=>void; onResolve:(resolution:Resolution)=>void; onClose:()=>void}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [note,setNote]=useState(ticket.officerNote ?? "");
  const [after,setAfter]=useState("");
  const [preparingPhoto,setPreparingPhoto]=useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const [location,setLocation]=useState<LocationEvidence>();
  const [locationMessage,setLocationMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>{const dialog=ref.current!;dialog.showModal();return ()=>dialog.close();},[]);
  const missing = !after || note.trim().length < 10;
  return <dialog ref={ref} className="drawer" aria-label={"Ticket inspector " + ticket.id} onCancel={onClose} onClick={e=>{if(e.target===ref.current && e.clientX<ref.current!.getBoundingClientRect().left)onClose();}}>
    <div className="drawerhead"><h2>Ticket inspector</h2><button className="iconbtn" aria-label="Close inspector" onClick={onClose}><X size={20}/></button></div>
    <TicketCard ticket={ticket}/>
    {ticket.status === "Reopened" && <p className="notice">Reopened · {ticket.citizenResponse?.reason} {(ticket.reopenCount ?? 0) >= 2 && "· Escalated"}</p>}
    <section className="controls"><h2>Officer controls</h2><label>Workflow status</label><div className="pills">
      {(["New","Acknowledged","In Progress"] as const).map(status=><button key={status} aria-pressed={ticket.status===status} onClick={()=>onEdit({status})}>{status}</button>)}</div>
      <label htmlFor="assign">Reassign department</label><select id="assign" value={ticket.department} onChange={e=>onEdit({department:e.target.value as Department})}>{Object.values(DEPARTMENT_BY_CATEGORY).map(d=><option key={d}>{d}</option>)}</select>
      <label htmlFor="override">Override severity</label><select id="override" value={ticket.severity} onChange={e=>onEdit({severity:e.target.value as Severity})}>{Object.keys(SEVERITY_RANK).map(s=><option key={s}>{s}</option>)}</select>
      <label htmlFor="officer-note">Officer note</label><textarea id="officer-note" maxLength={200} value={note} onChange={e=>setNote(e.target.value)}/>
      <button className="secondary" onClick={()=>onEdit({officerNote:note})}>Save note</button>
      <label htmlFor="after-photo">After photo</label>
      <p className="hint">Upload a photo showing the completed work. It will be sent when you resolve the ticket.</p>
      <div className="upload after-upload"><Camera aria-hidden="true" size={20}/><span>{preparingPhoto ? "Preparing photo…" : after ? "Replace after photo" : "Choose after photo"}</span>
        <input ref={photoInput} id="after-photo" aria-label="Choose after photo" type="file" accept="image/*" disabled={busy || preparingPhoto} onChange={async e=>{
          const file=e.target.files?.[0]; if(!file)return;
          setPreparingPhoto(true); setError("");
          try { setAfter(await preparePhoto(file,640)); }
          catch { setAfter(""); setError("Could not read the photo. Choose another image."); }
          finally { setPreparingPhoto(false); if(photoInput.current)photoInput.current.value=""; }
        }}/>
      </div>
      {after && <div className="after-preview"><img className="photo" src={after} alt="After photo preview"/><button type="button" className="secondary" onClick={()=>setAfter("")}>Remove photo</button></div>}
      <button className="secondary" onClick={async()=>{setLocationMessage("Capturing location…");try{setLocation(await captureLocation());setLocationMessage("Location captured.");}catch(e){setLocationMessage((e as Error).message);}}}>Capture my current location</button>
      <p role="status">{locationMessage || "Location is optional."}</p>
      {missing && <p className="hint">To resolve, attach an after photo and enter a note of at least 10 characters.</p>}
      {error && <p role="alert" className="notice">{error}</p>}
      <button className="primary" disabled={missing || busy || preparingPhoto} onClick={async()=>{
        setBusy(true);setError("");
        try {
          const aiCheck = ticket.photoDataUrl ? await verifyResolution(ticket.photoDataUrl,after,ticket.englishSummary) : undefined;
          onResolve({afterPhotoDataUrl:after,note:note.trim(),resolvedAt:new Date().toISOString(),location,locationCheck:checkLocations(ticket.reportLocation,location),aiCheck});
        } catch(e) {setError((e as Error).message);} finally {setBusy(false);}
      }}>{busy ? "Checking photos…" : "Resolve ticket"}</button>
    </section></dialog>;
}
