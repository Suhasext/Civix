import { defineConfig, loadEnv, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function speechToText(apiKey: string): Plugin {
  const middleware: Connect.NextHandleFunction = async (request, response, next) => {
    if (request.url?.split("?")[0] !== "/api/transcribe") return next();
    const send = (status: number, error: string) => {
      response.statusCode = status;
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ error }));
    };
    if (request.method !== "POST") return send(405, "Method not allowed.");
    const origin = request.headers.origin;
    if (origin && origin !== `http://${request.headers.host}` && origin !== `https://${request.headers.host}`) {
      return send(403, "Request origin is not allowed.");
    }
    if (!apiKey) return send(503, "Speech transcription is not configured.");
    const mime = (request.headers["content-type"] ?? "").split(";")[0];
    if (!["audio/webm", "audio/ogg", "audio/mp4", "audio/m4a"].includes(mime)) return send(415, "Unsupported recording format.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for await (const chunk of request) {
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
      if (!upstream.ok) return send(502, "Speech transcription service is unavailable.");
      const data: unknown = await upstream.json();
      if (!data || typeof data !== "object" || !("text" in data) || typeof data.text !== "string") {
        return send(502, "Speech transcription returned an invalid response.");
      }
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ text: data.text }));
    } catch {
      if (!response.headersSent) send(502, "Speech transcription service is unavailable.");
    }
  };
  return {
    name: "civix-speech-to-text",
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), speechToText(loadEnv(mode, process.cwd(), "").ELEVENLABS_API_KEY ?? "")],
}));
