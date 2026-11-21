export async function transcribeAudio(audio: Blob, signal: AbortSignal): Promise<string> {
  if (audio.size === 0) throw new Error("Recorded audio was empty — check your microphone input device.");
  const response = await fetch("/api/transcribe", {
    method: "POST",
    headers: { "Content-Type": audio.type },
    body: audio,
    signal,
  });
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error(response.ok ? "Could not read the transcript." : `Speech transcription failed (HTTP ${response.status}).`);
  }
  if (result && typeof result === "object" && "error" in result && typeof result.error === "string" && result.error.trim()) {
    throw new Error(result.error);
  }
  if (!response.ok) throw new Error(`Speech transcription failed (HTTP ${response.status}).`);
  if (!result || typeof result !== "object" || !("text" in result) || typeof result.text !== "string") {
    throw new Error("Could not read the transcript.");
  }
  const transcript = result.text.trim();
  if (!transcript) throw new Error("No speech detected in recording — check that your mic is unmuted.");
  return transcript;
}
