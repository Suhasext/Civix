import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { type ManagedTicket, type OfficerEdit, type Resolution, type LocationEvidence, DEPARTMENT_BY_CATEGORY, SEVERITY_RANK, type Department, type Severity } from "../lib/ticket";
import { captureLocation, checkLocations } from "../lib/location";
import { preparePhoto } from "../lib/photo";
import { verifyResolution } from "../lib/verifyResolution";
import { TicketCard } from "./TicketCard";
import { useI18n } from "../lib/i18n";

export function Inspector({ticket,onEdit,onResolve,onClose}: {ticket: ManagedTicket; onEdit:(edit:OfficerEdit & {officerNote?:string})=>void; onResolve:(resolution:Resolution)=>void; onClose:()=>void}) {
  const { t } = useI18n();
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
  return <dialog ref={ref} className="drawer" aria-label={t("Ticket inspector ") + ticket.id} onCancel={onClose} onClick={e=>{if(e.target===ref.current && e.clientX<ref.current!.getBoundingClientRect().left)onClose();}}>
    <div className="drawerhead"><h2>{t("Ticket inspector")}</h2><button className="iconbtn" aria-label={t("Close inspector")} onClick={onClose}><X size={20}/></button></div>
    <TicketCard ticket={ticket}/>
    {ticket.status === "Reopened" && <p className="notice">{t("Reopened")} · {ticket.citizenResponse?.reason} {(ticket.reopenCount ?? 0) >= 2 && `· ${t("Escalated")}`}</p>}
    <section className="controls"><h2>{t("Officer controls")}</h2><label>{t("Workflow status")}</label><div className="pills">
      {(["New","Acknowledged","In Progress"] as const).map(status=><button key={status} aria-pressed={ticket.status===status} onClick={()=>onEdit({status})}>{t(status)}</button>)}</div>
      <label htmlFor="assign">{t("Reassign department")}</label><select id="assign" value={ticket.department} onChange={e=>onEdit({department:e.target.value as Department})}>{Object.values(DEPARTMENT_BY_CATEGORY).map(d=><option key={d} value={d}>{t(d)}</option>)}</select>
      <label htmlFor="override">{t("Override severity")}</label><select id="override" value={ticket.severity} onChange={e=>onEdit({severity:e.target.value as Severity})}>{Object.keys(SEVERITY_RANK).map(s=><option key={s} value={s}>{t(s)}</option>)}</select>
      <label htmlFor="officer-note">{t("Officer note")}</label><textarea id="officer-note" maxLength={200} value={note} onChange={e=>setNote(e.target.value)}/>
      <button className="secondary" onClick={()=>onEdit({officerNote:note})}>{t("Save note")}</button>
      <label htmlFor="after-photo">{t("After photo")}</label>
      <p className="hint">{t("Upload a photo showing the completed work. It will be sent when you resolve the ticket.")}</p>
      <div className="upload after-upload"><Camera aria-hidden="true" size={20}/><span>{preparingPhoto ? t("Preparing photo…") : after ? t("Replace after photo") : t("Choose after photo")}</span>
        <input ref={photoInput} id="after-photo" aria-label="Choose after photo" type="file" accept="image/*" disabled={busy || preparingPhoto} onChange={async e=>{
          const file=e.target.files?.[0]; if(!file)return;
          setPreparingPhoto(true); setError("");
          try { setAfter(await preparePhoto(file,640)); }
          catch { setAfter(""); setError(t("Could not read the photo. Choose another image.")); }
          finally { setPreparingPhoto(false); if(photoInput.current)photoInput.current.value=""; }
        }}/>
      </div>
      {after && <div className="after-preview"><img className="photo" src={after} alt={t("After photo preview")}/><button type="button" className="secondary" onClick={()=>setAfter("")}>{t("Remove photo")}</button></div>}
      <button className="secondary" onClick={async()=>{setLocationMessage(t("Capturing location…"));try{setLocation(await captureLocation());setLocationMessage(t("Location captured."));}catch(e){setLocationMessage(t((e as Error).message));}}}>{t("Capture my current location")}</button>
      <p role="status">{locationMessage || t("Location is optional.")}</p>
      {missing && <p className="hint">{t("To resolve, attach an after photo and enter a note of at least 10 characters.")}</p>}
      {error && <p role="alert" className="notice">{error}</p>}
      <button className="primary" disabled={missing || busy || preparingPhoto} onClick={async()=>{
        setBusy(true);setError("");
        try {
          const aiCheck = ticket.photoDataUrl ? await verifyResolution(ticket.photoDataUrl,after,ticket.englishSummary) : undefined;
          onResolve({afterPhotoDataUrl:after,note:note.trim(),resolvedAt:new Date().toISOString(),location,locationCheck:checkLocations(ticket.reportLocation,location),aiCheck});
        } catch(e) {setError((e as Error).message);} finally {setBusy(false);}
      }}>{busy ? t("Checking photos…") : t("Resolve ticket")}</button>
    </section></dialog>;
}
