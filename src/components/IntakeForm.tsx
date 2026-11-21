import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, Camera, ShieldCheck, ArrowUpRight, X } from "lucide-react";
import { preparePhoto } from "../lib/photo";
import { triage } from "../lib/triage";
import { addTicket } from "../lib/storage";
import { captureLocation } from "../lib/location";
import type { LocationEvidence } from "../lib/ticket";
import { VoiceInput } from "./VoiceInput";

import type { ManagedTicket } from "../lib/ticket";
import { useI18n } from "../lib/i18n";

export function IntakeForm({onSave, active}: {active: boolean; onSave: (rows: ManagedTicket[], ticket: ManagedTicket, notice: string) => void}) {
  const { t } = useI18n();
  const [text,setText] = useState("");
  const [location,setLocation] = useState<LocationEvidence>();
  const [locationMessage,setLocationMessage] = useState("");
  const [photo,setPhoto] = useState<string>();
  const [loading,setLoading] = useState(false);
  const [processing,setProcessing] = useState(false);
  const [voiceBusy,setVoiceBusy] = useState(false);
  const [error,setError] = useState("");
  const upload = useRef<HTMLInputElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (loading || processing || voiceBusy) return;
    setError("");
    if (text.trim().length < 5) { setError(t("Enter at least 5 characters.")); input.current?.focus(); return; }
    setLoading(true);
    try {
      const {ticket, rows} = addTicket(await triage(text, photo), location);
      const notice = photo && !ticket.photoDataUrl ? t("Browser storage is full. Your ticket was saved without its photo.") : "";
      onSave(rows, ticket, notice); setPhoto(undefined); setLocation(undefined); setLocationMessage(""); setText("");
    } catch { setError(t("Your ticket could not be saved. Check browser storage and try again.")); }
    finally { setLoading(false); }
  }
  return <section><div className="intro"><h1>{t("Report an issue")}</h1><p>{t("Describe a municipal issue to receive a trackable triage receipt.")}</p></div>
    <div className="layout"><form className="panel form" onSubmit={submit}>
      <h2>{t("Complaint details")}</h2><fieldset disabled={loading || processing}>
      <label htmlFor="complaint">{t("Describe the issue")}</label>
      <p id="languages" className="hint">{t("Write in English, Hindi, Kannada or Tamil.")}</p>
      <textarea ref={input} id="complaint" aria-describedby="languages privacy" value={text} onChange={e => setText(e.target.value)} placeholder={t("What happened, and where did you notice it?")}/>
      <VoiceInput active={active} onBusy={setVoiceBusy} onTranscript={transcript => {
        setText(previous => previous.trim() ? previous.trimEnd() + " " + transcript : transcript);
        input.current?.focus();
      }}/>
      <div className="fieldhead"><button type="button" className="secondary" onClick={async () => {
        setLocationMessage(t("Capturing location…"));
        try { setLocation(await captureLocation()); setLocationMessage(t("Location attached.")); }
        catch (err) { setLocationMessage(t((err as Error).message)); }
      }}>{t("Attach my current location (optional)")}</button></div><p className="hint">{t("Used only to help the officer verify the fix. Not shown publicly.")}</p><p role="status" className="hint">{locationMessage}</p>
      <div className="fieldhead"><label htmlFor="photo">{t("Supporting photo")}</label><span>{t("Optional")}</span></div>
      <div className="upload"><Camera aria-hidden="true"/><span>{photo ? t("Replace photo") : t("Choose a photo")}</span>
      <input ref={upload} id="photo" type="file" accept="image/*" onChange={async e => {
        const file = e.target.files?.[0]; if (!file) return;
        setProcessing(true); setError("");
        try { setPhoto(await preparePhoto(file)); } catch (err) { setPhoto(undefined); setError((err as Error).message); }
        finally { setProcessing(false); if(upload.current) upload.current.value = ""; }
      }}/></div>
      {photo && <div className="preview"><img className="photo" src={photo} alt={t("Selected complaint photo")}/><button type="button" className="secondary" onClick={() => setPhoto(undefined)}><X size={15}/>{t("Remove photo")}</button></div>}
      </fieldset>
      <p id="privacy" className="privacy"><ShieldCheck size={17}/>{t("Do not include personal details. Text and photos are sent to Gemini for triage.")}</p>
      {error && <p role="alert" className="notice">{error}</p>}
      <button className="primary" disabled={loading || processing || voiceBusy}>{loading ? t("Analyzing & Routing...") : processing ? t("Preparing photo…") : t("Submit complaint")}<ArrowRight size={18}/></button>
    </form><aside className="panel samples"><h2>{t("Quick Demo Samples")}</h2><p>{t("Choose a sample to fill the report in one click.")}</p>
      {samples.map(([language, title, complaint]) => <button key={language} disabled={loading || processing} onClick={() => {
        setText(complaint); setError(""); input.current?.focus();
      }}><span><small>{language}</small><strong>{t(title)}</strong></span><ArrowUpRight size={17}/></button>)}
    </aside></div></section>;
}

const samples = [
  ["Kannada", "Live Wire", "ಬಸ್ ನಿಲ್ದಾಣದ ಬಳಿ ವಿದ್ಯುತ್ ತಂತಿ ಕಂಬದಿಂದ ಕೆಳಗೆ ನೇತಾಡುತ್ತಿದೆ."],
  ["Hindi", "Burst Water Pipe", "सुबह से पानी का पाइप फटा हुआ है और गली में पानी भर रहा है।"],
  ["Tamil", "Missing Drain Cover", "பள்ளி வாசல் அருகே சாக்கடை மூடி காணவில்லை. குழந்தைகள் அந்த வழியாக நடந்து செல்கிறார்கள்."],
  ["English", "Deep Pothole", "A deep pothole near the market forces cyclists into traffic."],
];
