"use client";

import { useEffect, useRef, useState } from "react";
import { formatTime, RecordingHandle, RecordResult, startRecording, uploadVoice } from "@/lib/voice";
import VoicePlayer from "./VoicePlayer";

const MAX_MS = 60_000;

export default function VoiceRecorder({
  userId,
  onCancel,
  onSend,
}: {
  userId: string;
  onCancel: () => void;
  onSend: (data: { audioUrl: string; audioDurationMs: number; audioPeaks: number[]; messageId: string }) => Promise<void> | void;
}) {
  const [phase, setPhase] = useState<"prep" | "recording" | "preview" | "uploading">("prep");
  const [err, setErr] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [liveBars, setLiveBars] = useState<number[]>([]);
  const [result, setResult] = useState<RecordResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const handleRef = useRef<RecordingHandle | null>(null);
  const tickRef = useRef<number | null>(null);

  // Auto-start: prompt for mic immediately on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const h = await startRecording();
        if (cancelled) { h.cancel(); return; }
        handleRef.current = h;
        setPhase("recording");
        tickRef.current = window.setInterval(() => {
          const ms = Date.now() - h.startedAt;
          setElapsedMs(ms);
          // grab tail of peaksLive for live waveform, then normalize so the
          // loudest bar in the window fills the strip.
          const tail = h.peaksLive.slice(-50);
          const peak = tail.reduce((m, v) => (v > m ? v : m), 0);
          const norm = peak > 0.02 ? tail.map((v) => Math.min(1, v / peak)) : tail.map(() => 0.05);
          setLiveBars(norm);
          if (ms >= MAX_MS) stopRecording();
        }, 80);
      } catch (e: any) {
        setErr(e?.message ?? "Mic permission denied.");
      }
    })();
    return () => {
      cancelled = true;
      if (tickRef.current) clearInterval(tickRef.current);
      handleRef.current?.cancel();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function stopRecording() {
    const h = handleRef.current;
    if (!h) return;
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    try {
      const r = await h.stop();
      handleRef.current = null;
      setResult(r);
      setPreviewUrl(URL.createObjectURL(r.blob));
      setPhase("preview");
    } catch (e: any) {
      setErr(e?.message ?? "Recording failed.");
    }
  }

  function discard() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    onCancel();
  }

  async function send() {
    if (!result) return;
    setPhase("uploading");
    setErr(null);
    const messageId = crypto.randomUUID();
    try {
      const url = await uploadVoice(result.blob, userId, messageId, result.ext);
      await onSend({
        audioUrl: url,
        audioDurationMs: result.durationMs,
        audioPeaks: result.peaks,
        messageId,
      });
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed.");
      setPhase("preview");
    }
  }

  return (
    <div className="rounded-xl border-2 border-ink bg-white p-3 flex items-center gap-2">
      {err && (
        <div className="text-xs text-red-600 flex-1">
          {err}
          <button onClick={onCancel} className="ml-2 underline">close</button>
        </div>
      )}

      {!err && phase === "prep" && (
        <div className="text-sm italic opacity-70 flex-1">Waiting for mic permission…</div>
      )}

      {!err && phase === "recording" && (
        <>
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shrink-0" aria-label="recording" />
          <div className="flex-1 h-8 flex items-center gap-[2px] overflow-hidden">
            {(liveBars.length ? liveBars : Array(50).fill(0.05)).map((p, i) => {
              const h = Math.max(6, Math.round(6 + p * 22));
              return (
                <span
                  key={i}
                  style={{ background: "#dc2626", width: 3, height: `${h}px`, borderRadius: 2 }}
                />
              );
            })}
          </div>
          <div className="text-xs font-mono opacity-80 tabular-nums shrink-0">
            {formatTime(elapsedMs)} / 01:00
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="btn-primary !py-1 !px-3 text-xs shrink-0"
            aria-label="Stop recording"
          >■ Stop</button>
          <button
            type="button"
            onClick={discard}
            className="btn-ghost !py-1 !px-2 text-xs shrink-0"
            aria-label="Cancel"
          >✕</button>
        </>
      )}

      {!err && (phase === "preview" || phase === "uploading") && previewUrl && result && (
        <>
          <div className="flex-1 min-w-0">
            <VoicePlayer
              src={previewUrl}
              durationMs={result.durationMs}
              peaks={result.peaks}
              compact
            />
          </div>
          <button
            type="button"
            onClick={discard}
            className="btn-ghost !py-1 !px-3 text-xs shrink-0"
            disabled={phase === "uploading"}
          >🗑 Discard</button>
          <button
            type="button"
            onClick={send}
            className="btn-primary !py-1 !px-3 text-xs shrink-0"
            disabled={phase === "uploading"}
          >{phase === "uploading" ? "Uploading…" : "Send"}</button>
        </>
      )}
    </div>
  );
}
