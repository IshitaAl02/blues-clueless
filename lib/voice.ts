import { supabase } from "./supabase";

const BUCKET = "voice-notes";
const PEAK_BUCKETS = 50;
const SAMPLE_MS = 40;

export function pickMimeType(): { mime: string; ext: string } {
  if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.("audio/webm;codecs=opus")) {
    return { mime: "audio/webm;codecs=opus", ext: "webm" };
  }
  if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.("audio/mp4")) {
    return { mime: "audio/mp4", ext: "m4a" };
  }
  return { mime: "", ext: "webm" };
}

export interface RecordResult {
  blob: Blob;
  durationMs: number;
  peaks: number[];
  mime: string;
  ext: string;
}

export interface RecordingHandle {
  stop: () => Promise<RecordResult>;
  cancel: () => void;
  // Live peaks buffer the recorder pushes into; UI re-reads for live waveform.
  peaksLive: number[];
  startedAt: number;
}

// Start a recording. Caller awaits this to get the handle.
export async function startRecording(): Promise<RecordingHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const { mime, ext } = pickMimeType();
  const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  const buf = new Uint8Array(analyser.fftSize);
  const peaksLive: number[] = [];
  let sampling = true;
  const sampler = setInterval(() => {
    if (!sampling) return;
    analyser.getByteTimeDomainData(buf);
    let max = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = Math.abs(buf[i] - 128) / 128;
      if (v > max) max = v;
    }
    peaksLive.push(max);
  }, SAMPLE_MS);

  rec.start();
  const startedAt = Date.now();

  function cleanup() {
    sampling = false;
    clearInterval(sampler);
    try { source.disconnect(); } catch {}
    try { audioCtx.close(); } catch {}
    stream.getTracks().forEach((t) => t.stop());
  }

  function downsample(arr: number[], n: number): number[] {
    if (arr.length <= n) return arr.map((v) => clamp01(v));
    const step = arr.length / n;
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      const start = Math.floor(i * step);
      const end = Math.floor((i + 1) * step);
      let max = 0;
      for (let k = start; k < end; k++) if (arr[k] > max) max = arr[k];
      out.push(clamp01(max));
    }
    return out;
  }

  const stop = (): Promise<RecordResult> =>
    new Promise((resolve, reject) => {
      rec.onerror = (e) => { cleanup(); reject(e); };
      rec.onstop = () => {
        const durationMs = Date.now() - startedAt;
        const blob = new Blob(chunks, { type: mime || rec.mimeType || "audio/webm" });
        const peaks = downsample(peaksLive, PEAK_BUCKETS);
        cleanup();
        resolve({ blob, durationMs, peaks, mime: blob.type, ext });
      };
      try { rec.stop(); } catch (e) { cleanup(); reject(e); }
    });

  const cancel = () => {
    try { rec.stop(); } catch {}
    cleanup();
  };

  return { stop, cancel, peaksLive, startedAt };
}

function clamp01(v: number) { return v < 0 ? 0 : v > 1 ? 1 : v; }

export async function uploadVoice(
  blob: Blob,
  userId: string,
  messageId: string,
  ext: string,
): Promise<string> {
  const path = `${userId}/${messageId}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || "audio/webm",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function formatTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}
