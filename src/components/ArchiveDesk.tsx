import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useI18n } from "../lib/i18n";

const stages = [
  { label: "01. Multilingual intake", detail: "Describe an issue in English, Hindi, Kannada or Tamil. Type or record your complaint, and optionally attach a photo and your current location." },
  { label: "02. Gemini AI triage", detail: "When configured, Gemini suggests a summary, category and severity with a reason. If AI is unavailable, keyword triage keeps reporting available and flags the ticket for review." },
  { label: "03. Dept routing", detail: "Each ticket has a responsible department. Officers can search and filter the priority queue, inspect reports, and adjust assignments and severity." },
  { label: "04. Evidence gate", detail: "An officer must attach an after photo and a note of at least 10 characters to resolve a ticket. Citizens can then confirm the fix or dispute it." },
];

export function ArchiveDesk({ onChoose }: { onChoose: (role: "citizen" | "officer") => void }) {
  const { t } = useI18n();
  const [stage, setStage] = useState(0);
  return <section className="archive-desk" aria-labelledby="desk-heading">
    <div className="desk-hero">
      <p className="archive-label">{t("Municipal AI Triage")} // {t("Archival Desk")}</p>
      <h1 id="desk-heading">{t("Welcome to Civix")}</h1>
      <p>{t("Multilingual citizen reports. Clear triage. Evidence-led resolutions.")}</p>
    </div>
    <div className="role-grid">
      <article className="panel role-card role-card--citizen">
        <div className="index-tab"><span className="desk-led" aria-hidden="true"/>{t("Citizen")}</div>
        <p className="archive-label">{t("Report an issue")}</p>
        <h2>{t("Citizen Filing Desk")}</h2>
        <p>{t("Describe a municipal issue to receive a trackable triage receipt.")}</p>
        <p className="desk-features">{t("4 languages")} <span aria-hidden="true">•</span> {t("Voice + photo")}</p>
        <button className="primary tactile-key" onClick={() => onChoose("citizen")}>{t("Continue as Citizen")}<ArrowRight size={16} aria-hidden="true"/></button>
      </article>
      <article className="panel role-card role-card--officer">
        <div className="index-tab"><span className="desk-led" aria-hidden="true"/>{t("Officer")}</div>
        <p className="archive-label">{t("Priority queue")}</p>
        <h2>{t("Officer Dispatch Log")}</h2>
        <p>{t("Review complaints and record resolution evidence.")}</p>
        <p className="desk-features">{t("Priority queue")} <span aria-hidden="true">•</span> {t("Resolution evidence")}</p>
        <button className="primary tactile-key" onClick={() => onChoose("officer")}>{t("Continue as Officer")}<ArrowRight size={16} aria-hidden="true"/></button>
      </article>
    </div>
    <section className="panel pipeline" aria-labelledby="pipeline-heading">
      <div className="pipeline-heading"><h2 id="pipeline-heading">{t("System pipeline")}</h2><span>{t("Interactive field guide")}</span></div>
      <div className="pipeline-keys" role="group" aria-label={t("System pipeline")}>
        {stages.map((item, index) => <button key={item.label} className="tactile-key pipeline-key" aria-pressed={stage === index} aria-controls="pipeline-readout"
          onPointerEnter={event => { if (event.pointerType !== "touch") setStage(index); }} onFocus={() => setStage(index)} onClick={() => setStage(index)}>
          <span className="pipeline-led" aria-hidden="true"/>{t(item.label)}
        </button>)}
      </div>
      <div className="tactile-well pipeline-readout" id="pipeline-readout" role="status" aria-live="polite" aria-atomic="true">
        <strong>{t(stages[stage].label)}</strong><p>{t(stages[stage].detail)}</p>
      </div>
    </section>
  </section>;
}

export function DraftingBackdrop() {
  const background = useRef<HTMLDivElement>(null);
  const stamp = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(any-pointer: fine)");
    let frame = 0;
    let x = 0;
    let y = 0;
    function update() {
      frame = 0;
      background.current?.style.setProperty("--mouse-x", `${x}px`);
      background.current?.style.setProperty("--mouse-y", `${y}px`);
      if (stamp.current) stamp.current.textContent = `GRID // X ${String(x).padStart(4, "0")} Y ${String(y).padStart(4, "0")} PX`;
    }
    function move(event: PointerEvent) {
      if (motion.matches || !finePointer.matches || event.pointerType === "touch") return;
      x = Math.round(event.clientX);
      y = Math.round(event.clientY);
      if (!frame) frame = requestAnimationFrame(update);
    }
    function configure() {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
      frame = 0;
      background.current?.style.removeProperty("--mouse-x");
      background.current?.style.removeProperty("--mouse-y");
      if (stamp.current) stamp.current.textContent = "GRID // CIVIX ARCHIVE";
      if (!motion.matches && finePointer.matches) window.addEventListener("pointermove", move, { passive: true });
    }
    configure();
    motion.addEventListener("change", configure);
    finePointer.addEventListener("change", configure);
    return () => {
      window.removeEventListener("pointermove", move);
      motion.removeEventListener("change", configure);
      finePointer.removeEventListener("change", configure);
      cancelAnimationFrame(frame);
    };
  }, []);
  return <><div className="drafting-backdrop" ref={background} aria-hidden="true"/><div className="drafting-frame" aria-hidden="true">
    <i className="registration registration--tl"/><i className="registration registration--tr"/>
    <i className="registration registration--bl"/><i className="registration registration--br"/>
    <span className="grid-stamp" ref={stamp}>GRID // CIVIX ARCHIVE</span>
  </div></>;
}
