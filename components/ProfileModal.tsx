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
  const [menuOpen, setMenuOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

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
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="avatar-ring relative group block"
                style={{ width: 80, height: 80, borderColor: colorForUser(userId) }}
                title="Edit your profile picture"
                aria-label="Edit profile picture"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrlForUser(picked)} alt="" width={80} height={80} />
                <span className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xl">
                  ✏️
                </span>
                {/* small floating pencil chip in bottom-right for touch / discoverability */}
                <span
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-mint border-2 border-ink flex items-center justify-center text-sm shadow-popSm"
                  aria-hidden="true"
                >✏️</span>
              </button>

              {menuOpen && (
                <div className="absolute top-full mt-2 left-0 z-20 solid-card p-1 w-48">
                  <button
                    className="w-full text-left px-2 py-2 rounded-md hover:bg-cloud flex items-center gap-2 text-sm font-semibold"
                    onClick={() => { setMenuOpen(false); fileRef.current?.click(); }}
                  >
                    <span>📷</span> Upload new photo
                  </button>
                  {customUploaded && (
                    <button
                      className="w-full text-left px-2 py-2 rounded-md hover:bg-cloud flex items-center gap-2 text-sm font-semibold"
                      onClick={() => { setMenuOpen(false); setCropSource(customUploaded); }}
                    >
                      <span>✂️</span> Adjust crop
                    </button>
                  )}
                  {isCustom && (
                    <button
                      className="w-full text-left px-2 py-2 rounded-md hover:bg-cloud flex items-center gap-2 text-sm font-semibold"
                      onClick={() => {
                        setMenuOpen(false);
                        setPicked(username);
                        setCustomUploaded(null);
                      }}
                    >
                      <span>🗑️</span> Remove photo
                    </button>
                  )}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider opacity-60 font-bold">Username</div>
              <div className="text-2xl font-display">{username}</div>
              <div className="text-[11px] opacity-60 italic">Username can't be changed.</div>
            </div>
          </div>

          <div className="text-sm font-bold mb-2">Pick your avatar</div>

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
