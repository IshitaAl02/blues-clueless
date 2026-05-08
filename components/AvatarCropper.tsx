"use client";

import { useEffect, useRef, useState } from "react";

const FRAME = 280; // visible circular preview size (px)
const OUTPUT = 256; // exported image size (px)

export default function AvatarCropper({
  src,
  onCancel,
  onApply,
}: {
  src: string;
  onCancel: () => void;
  onApply: (dataUrl: string) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Reset state when src changes
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [src]);

  function onLoad() {
    if (!imgRef.current) return;
    setImgSize({
      w: imgRef.current.naturalWidth,
      h: imgRef.current.naturalHeight,
    });
  }

  // "cover" scale to make the smaller dimension fill the frame
  const baseScale =
    imgSize.w && imgSize.h
      ? Math.max(FRAME / imgSize.w, FRAME / imgSize.h)
      : 1;
  const renderedW = imgSize.w * baseScale * zoom;
  const renderedH = imgSize.h * baseScale * zoom;

  function clampOffset(o: { x: number; y: number }, w: number, h: number) {
    // Don't let user drag past the edge — keep image covering the frame
    const maxX = Math.max(0, (w - FRAME) / 2);
    const maxY = Math.max(0, (h - FRAME) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, o.x)),
      y: Math.max(-maxY, Math.min(maxY, o.y)),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => clampOffset({ x: prev.x + dx, y: prev.y + dy }, renderedW, renderedH));
  }
  function onPointerUp(e: React.PointerEvent) {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    dragging.current = false;
  }

  function apply() {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Map the visible square back onto the source image
    const totalScale = baseScale * zoom;
    const displayLeft = FRAME / 2 - renderedW / 2 + offset.x;
    const displayTop = FRAME / 2 - renderedH / 2 + offset.y;
    const sx = -displayLeft / totalScale;
    const sy = -displayTop / totalScale;
    const sSize = FRAME / totalScale;

    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT, OUTPUT);
    onApply(canvas.toDataURL("image/jpeg", 0.85));
  }

  // Re-clamp whenever zoom changes
  useEffect(() => {
    setOffset((o) => clampOffset(o, renderedW, renderedH));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, imgSize.w, imgSize.h]);

  return (
    <div>
      <div
        className="mx-auto rounded-full overflow-hidden border-2 border-ink relative select-none touch-none"
        style={{ width: FRAME, height: FRAME, cursor: dragging.current ? "grabbing" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          onLoad={onLoad}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            width: renderedW,
            height: renderedH,
            left: FRAME / 2 - renderedW / 2 + offset.x,
            top: FRAME / 2 - renderedH / 2 + offset.y,
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
      </div>

      <div className="mt-4">
        <label className="text-xs font-bold opacity-70 block mb-1">Zoom</label>
        <input
          type="range"
          min="1"
          max="3"
          step="0.02"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-full accent-mint"
        />
      </div>

      <p className="text-[11px] opacity-60 italic mt-2 text-center">
        Drag the image to position it, slide to zoom.
      </p>

      <div className="flex justify-end gap-2 mt-3">
        <button className="btn-ghost" onClick={onCancel}>Back</button>
        <button className="btn-primary" onClick={apply}>Apply</button>
      </div>
    </div>
  );
}
