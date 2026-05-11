"use client";

import { useEffect, useState } from "react";
import Modal from "../Modal";

export default function AddEditSectionModal({
  open,
  initialName,
  onClose,
  onSave,
}: {
  open: boolean;
  initialName?: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setName(initialName ?? "");
  }, [open, initialName]);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSave(name.trim());
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initialName ? "Rename section" : "New section"}>
      <label className="block text-sm font-bold mb-1">Section name</label>
      <input
        className="field mb-3"
        placeholder="Endpoints, Reports, My APIs..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        autoFocus
      />
      <div className="flex justify-end gap-2 mt-2">
        <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={busy || !name.trim()}>
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}
