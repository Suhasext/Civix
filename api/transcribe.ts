export default async function handler(req: any, res: any) {
  const send = (status: number, error: string) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error }));
  };
  if (req.method !== "POST") return send(405, "Method not allowed.");
  const origin = req.headers.origin;
  if (origin && origin !== `http://${req.headers.host}` && origin !== `https://${req.headers.host}`) {
    return send(403, "Request origin is not allowed.");
  }
  const apiKey = process.env.ELEVENLABS_API_KEY ?? "";
  if (!apiKey) {
      const error = "Missing ELEVENLABS_API_KEY in server environment";
      console.error(error);
      return send(500, error);
    }
  const mime = (req.headers["content-type"] ?? "").split(";")[0];
  if (!["audio/webm", "audio/ogg", "audio/mp4", "audio/m4a"].includes(mime)) return send(415, "Unsupported recording format.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 10 * 1024 * 1024) return send(413, "Recording is too large.");
      chunks.push(chunk);
    }
    if (!size) return send(400, "Recording is empty.");
    const form = new FormData();
    form.append("model_id", "scribe_v2");
    form.append("tag_audio_events", "false");
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    form.append("file", new Blob([bytes], { type: mime }), "complaint");
    const upstream = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST", headers: { "xi-api-key": apiKey }, body: form, signal: AbortSignal.timeout(30000),
    });
    if (!upstream.ok) {
          const body = await upstream.text();
          console.error("ElevenLabs speech-to-text failed:", upstream.status, body);
          return send(502, `ElevenLabs speech-to-text failed (HTTP ${upstream.status}): ${body || upstream.statusText || "Empty error response"}`);
        }
    const data: unknown = await upstream.json();
    if (!data || typeof data !== "object" || !("text" in data) || typeof data.text !== "string") {
      return send(502, "Speech transcription returned an invalid response.");
    }
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ text: data.text }));
  } catch (error) {
    const message = `Speech transcription failed: ${error instanceof Error ? error.message : "Unknown error"}`;
    console.error(message);
    if (!res.headersSent) send(502, message);
  }
}
