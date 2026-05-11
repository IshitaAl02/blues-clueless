"use client";

import { PALETTE } from "@/lib/library";

export default function ColorPalette({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-bold">{label}</label>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-6 h-6 rounded-full border-2 border-ink"
            style={{ background: value }}
            aria-label="current color"
          />
          <input
            type="color"
            value={isHex(value) ? value : "#ffffff"}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded border-2 border-ink cursor-pointer"
            title="Custom color"
          />
        </div>
      </div>
      <div className="grid grid-cols-10 gap-1.5">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`w-7 h-7 rounded-full border-2 transition ${
              value.toLowerCase() === c.toLowerCase()
                ? "border-ink scale-110 shadow-popSm"
                : "border-ink/40 hover:scale-105"
            }`}
            style={{ background: c }}
            aria-label={c}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}

function isHex(s: string) {
  return /^#[0-9a-f]{6}$/i.test(s);
}
