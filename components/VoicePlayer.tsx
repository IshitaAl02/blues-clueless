"use client";

import { useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/voice";

const SPEEDS = [1, 1.5, 2] as const;
type Speed = (typeof SPEEDS)[number];

export default function VoicePlayer({
  src,
  durationMs,
  peaks,
  mine,
  compact,
}: {
  src: string;
  durationMs?: number;
  peaks?: number[];
  mine?: boolean;
  compact?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [knownDuration, setKnownDuration] = useState<number>(durationMs ?? 0);
  const [speed, setSpeed] = useState<Speed>(1);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrentMs(a.currentTime * 1000);
    const onEnded = () => { setPlaying(false); setCurrentMs(0); a.currentTime = 0; };
    const onMeta = () => {
      if (isFinite(a.duration) && a.duration > 0) setKnownDuration(a.duration * 1000);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnded);
    a.addEventListener("loadedmetadata", onMeta);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  }

  function cycleSpeed() {
    setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length]);
  }

  function seekAt(clientX: number) {
    const bar = barRef.current; const a = audioRef.current;
    if (!bar || !a || !knownDuration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    a.currentTime = (knownDuration / 1000) * ratio;
    setCurrentMs(a.currentTime * 1000);
  }

  const total = knownDuration || durationMs || 0;
  const progress = total > 0 ? Math.min(1, currentMs / total) : 0;
  const bars = peaks && peaks.length > 0 ? peaks : Array(40).fill(0.25);
  const inkColor = mine ? "var(--bubble-me-text, #ECFCFB)" : "var(--chrome-text, #093C5D)";
  const dim = mine ? "rgba(255,255,255,0.35)" : "rgba(9,60,93,0.30)";

  return (
    <div className={`flex items-center gap-2 ${compact ? "py-0" : "py-1"} min-w-[220px]`}>
      <button
        type="button"
        onClick={toggle}
        className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-base shrink-0 transition hover:scale-105"
        style={{ borderColor: inkColor, color: inkColor, background: "rgba(255,255,255,0.12)" }}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "⏸" : "▶"}
      </button>

      <div
        ref={barRef}
        onClick={(e) => seekAt(e.clientX)}
        className="flex-1 h-8 flex items-center gap-[2px] cursor-pointer select-none"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={Math.round(total)}
        aria-valuenow={Math.round(currentMs)}
      >
        {bars.map((p, i) => {
          const filled = (i + 1) / bars.length <= progress;
          // 6px floor so every bar is visible, scale rest to 28px peak.
          const h = Math.max(6, Math.round(6 + p * 22));
          return (
            <span
              key={i}
              style={{
                background: filled ? inkColor : dim,
                width: 3,
                height: `${h}px`,
                borderRadius: 2,
              }}
            />
          );
        })}
      </div>

      <div className="text-[11px] font-mono opacity-80 shrink-0 tabular-nums" style={{ color: inkColor }}>
        {formatTime(currentMs)} / {formatTime(total)}
      </div>

      <button
        type="button"
        onClick={cycleSpeed}
        className="text-[10px] font-bold border-2 rounded-full px-1.5 py-0.5 shrink-0 hover:scale-105 transition"
        style={{ borderColor: inkColor, color: inkColor }}
        title="Playback speed"
      >
        {speed}×
      </button>

      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}
