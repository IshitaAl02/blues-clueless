"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { avatarUrlForUser, colorForUser } from "@/lib/avatar";
import { SEED_OPTIONS, getSavedSeed, saveSeed } from "@/lib/profile";
import { fileToCompressedDataUrl } from "@/lib/image";
import AvatarCropper from "./AvatarCropper";

export default function ProfileModal({
  open,
  onClose,
  username,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  username: string;
  userId: string;
}) {
  const [picked, setPicked] = useState<string>(username);
  const [customUploaded, setCustomUploaded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // When this is a data: URL we're editing/cropping it before applying.
  const [cropSource, setCropSource] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const saved = getSavedSeed() ?? username;
    setPicked(saved);
    setCustomUploaded(saved.startsWith("data:") ? saved : null);
    setCropSource(null);
  }, [open, username]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Please pick an image file.");
      return;
    }
    setBusy(true);
    try {
      // Compress to a generous-but-bounded size first; the cropper trims further.
      const dataUrl = await fileToCompressedDataUrl(f, 1024, 400_000);
      setCropSource(dataUrl);
    } catch {
      alert("Couldn't read that image.");
    } finally {
      setBusy(false);
    }
  }

  function applyCrop(croppedDataUrl: string) {
    setCustomUploaded(croppedDataUrl);
    setPicked(croppedDataUrl);
    setCropSource(null);
  }

  async function commit() {
    setBusy(true);
    try {
      await saveSeed(userId, picked);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const presets = [username, ...SEED_OPTIONS.map((s) => `${username}-${s}`)];
  const isCustom = picked.startsWith("data:");

  return (
    <Modal open={open} onClose={onClose} title={cropSource ? "Adjust your photo ✂️" : "Your profile 🐾"}>
      {cropSource ? (
        <AvatarCropper
          src={cropSource}
          onCancel={() => setCropSource(null)}
          onApply={applyCrop}
        />
      ) : (
        <>
          <div className="flex items-center gap-4 mb-5">
            <div
              className="avatar-ring"
              style={{ width: 72, height: 72, borderColor: colorForUser(userId) }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrlForUser(picked)} alt="" width={72} height={72} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider opacity-60 font-bold">Username</div>
              <div className="text-2xl font-display">{username}</div>
              <div className="text-[11px] opacity-60 italic">Username can't be changed.</div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold">Pick your avatar</div>
            {customUploaded && (
              <button
                onClick={() => setCropSource(customUploaded)}
                className="text-xs underline opacity-70 hover:opacity-100"
                title="Re-position or zoom your photo"
              >
                ✏️ Adjust photo
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            {/* Custom upload tile — first slot */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className={`p-1.5 rounded-xl border-2 transition flex flex-col items-center justify-center aspect-square ${isCustom ? "border-ink bg-mint on-accent" : "border-dashed border-ink/50 hover:border-ink"}`}
              title="Upload your own image"
            >
              {customUploaded ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={customUploaded} alt="custom" className="w-full h-full object-cover rounded-md" />
              ) : (
                <div className="text-center">
                  <div className="text-2xl">📷</div>
                  <div className="text-[10px] font-bold mt-0.5">{busy ? "..." : "Upload"}</div>
                </div>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />

            {presets.map((seed) => {
              const active = seed === picked;
              return (
                <button
                  key={seed}
                  onClick={() => setPicked(seed)}
                  className={`p-1.5 rounded-xl border-2 transition aspect-square ${active ? "border-ink bg-mint on-accent" : "border-ink/30 hover:border-ink"}`}
                  title={`Avatar ${seed}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrlForUser(seed)} alt="" className="w-full h-full rounded-md" />
                </button>
              );
            })}
          </div>

          {customUploaded && !isCustom && (
            <button
              onClick={() => setPicked(customUploaded)}
              className="text-xs underline opacity-70 hover:opacity-100 mb-3"
            >
              Use uploaded image
            </button>
          )}

          <div className="flex justify-end gap-2 mt-2">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={commit} disabled={busy}>Save</button>
          </div>
        </>
      )}
    </Modal>
  );
}
