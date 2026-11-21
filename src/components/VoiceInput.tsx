import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { transcribeAudio } from "../lib/transcribe";
import { useI18n } from "../lib/i18n";

type VoiceState = "idle" | "requesting" | "recording" | "transcribing";

export function VoiceInput({ active, onTranscript, onBusy }: {
  active: boolean;
  onTranscript: (text: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const { t } = useI18n();
  const [state, setState] = useState<VoiceState>("idle");
  const [message, setMessage] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const controller = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);

  function release() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
  }

  useEffect(() => {
    if (!active) {
      generation.current++;
      controller.current?.abort();
      if (recorder.current?.state === "recording") recorder.current.stop();
      release();
      setState("idle");
      onBusy(false);
    }
  }, [active]);

  useEffect(() => () => {
    generation.current++;
    controller.current?.abort();
    if (recorder.current?.state === "recording") recorder.current.stop();
    release();
  }, []);

  async function start() {
    setMessage("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMessage(t("Voice recording is unavailable in this browser. Please type your complaint."));
      return;
    }
    const mimeType = ["audio/webm", "audio/ogg", "audio/mp4"].find(type => MediaRecorder.isTypeSupported(type));
    if (!mimeType) {
      setMessage(t("This browser cannot record a supported audio format. Please type your complaint."));
      return;
    }
    const current = ++generation.current;
    setState("requesting");
    onBusy(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (current !== generation.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      const recording = new MediaRecorder(media, { mimeType });
      recorder.current = recording;
      const chunks: Blob[] = [];
      recording.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recording.onerror = () => {
        generation.current++;
        release();
        setState("idle");
        onBusy(false);
        setMessage(t("Recording failed. Please try again or type your complaint."));
      };
      recording.onstop = async () => {
        release();
        if (current !== generation.current) return;
        const audio = new Blob(chunks, { type: mimeType === "audio/mp4" ? "audio/m4a" : mimeType });
        if (!audio.size) { setState("idle"); onBusy(false); setMessage(t("No audio was recorded. Please try again.")); return; }
        setState("transcribing");
        const abort = new AbortController();
        controller.current = abort;
        const timeout = setTimeout(() => abort.abort(), 30000);
        try {
          const transcript = await transcribeAudio(audio, abort.signal);
          if (current !== generation.current) return;
          onTranscript(transcript);
          setMessage(t("Transcript added. Please review and edit it before submitting."));
        } catch {
          if (current === generation.current) setMessage(t("Transcription failed or no speech was recognized. Please try again or type your complaint."));
        } finally {
          clearTimeout(timeout);
          if (current === generation.current) { controller.current = null; setState("idle"); onBusy(false); }
        }
      };
      recording.start();
      setState("recording");
      timer.current = setTimeout(() => { if (recording.state === "recording") recording.stop(); }, 60000);
    } catch {
      release();
      if (current === generation.current) {
        setState("idle");
        onBusy(false);
        setMessage(t("Microphone access failed. Check browser permission and try again, or type your complaint."));
      }
    }
  }

  return <div className="voice">
    <button type="button" className="secondary voice-button" disabled={state === "requesting" || state === "transcribing"}
      onClick={() => state === "recording" ? recorder.current?.stop() : start()}>
      {state === "recording" ? <Square size={16}/> : <Mic size={16}/>}
      {state === "recording" ? t("Stop recording") : state === "requesting" ? t("Waiting for microphone…") : state === "transcribing" ? t("Transcribing…") : t("Speak your complaint")}
    </button>
    <span className="hint">{state === "recording" ? t("Recording… up to 60 seconds") : t("English, Hindi, Kannada or Tamil · up to 60 seconds")}</span>
    <p className="hint">{t("Your recording is sent to ElevenLabs for transcription.")}</p>
    {message && <p role="status" className="notice">{message}</p>}
  </div>;
}
