"use client";

import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";

const OUTPUT = 256; // exported image size (px)

async function getCroppedDataUrl(src: string, area: Area): Promise<string> {
  // Load source into an off-screen Image
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Image failed to load"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT;
  canvas.height = OUTPUT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    OUTPUT,
    OUTPUT,
  );
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function AvatarCropper({
  src,
  onCancel,
  onApply,
}: {
  src: string;
  onCancel: () => void;
  onApply: (dataUrl: string) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  async function apply() {
    if (!croppedArea) return;
    setBusy(true);
    try {
      const data = await getCroppedDataUrl(src, croppedArea);
      onApply(data);
    } catch (e) {
      alert("Couldn't crop the image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div
        className="relative mx-auto rounded-full overflow-hidden border-2 border-ink"
        style={{ width: 280, height: 280, background: "#000" }}
      >
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          minZoom={1}
          maxZoom={4}
          zoomSpeed={0.5}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          objectFit="cover"
        />
      </div>

      <div className="mt-4">
        <label className="text-xs font-bold opacity-70 block mb-1">Zoom</label>
        <input
          type="range"
          min="1"
          max="4"
          step="0.02"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-full accent-mint"
        />
      </div>

      <p className="text-[11px] opacity-60 italic mt-2 text-center">
        Drag to position, slide or pinch to zoom.
      </p>

      <div className="flex justify-end gap-2 mt-3">
        <button className="btn-ghost" onClick={onCancel} disabled={busy}>Back</button>
        <button className="btn-primary" onClick={apply} disabled={busy || !croppedArea}>
          {busy ? "..." : "Apply"}
        </button>
      </div>
    </div>
  );
}
