export async function transcribeAudio(audio: Blob, signal: AbortSignal): Promise<string> {
  const response = await fetch("/api/transcribe", {
    method: "POST",
    headers: { "Content-Type": audio.type },
    body: audio,
    signal,
  });
  if (!response.ok) throw new Error("Speech transcription is unavailable.");
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("text" in result) || typeof result.text !== "string") {
    throw new Error("Could not read the transcript.");
  }
  const transcript = result.text.trim();
  if (!transcript) throw new Error("No speech was recognized.");
  return transcript;
}
