"use client";

import { useEffect, useState } from "react";
import Modal from "../Modal";
import ColorPalette from "./ColorPalette";
import { CardKind, LibraryCard, LibrarySection } from "@/lib/library";

const KIND_LABELS: Record<CardKind, string> = {
  endpoint: "Endpoint",
  form_key: "Form key",
  report: "Report",
  guide: "Guide",
  link: "Link / note",
};

type Draft = {
  kind: CardKind;
  section_id: string;
  data: Record<string, any>;
  bg_color: string;
  text_color: string;
  custom_colors: boolean;
};

export default function AddEditCardModal({
  open,
  sections,
  defaultSectionId,
  defaultCardBg,
  defaultCardText,
  editing,
  onClose,
  onSave,
}: {
  open: boolean;
  sections: LibrarySection[];
  defaultSectionId?: string;
  defaultCardBg: string;
  defaultCardText: string;
  editing?: LibraryCard | null;
  onClose: () => void;
  onSave: (d: Draft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>({
    kind: "link",
    section_id: defaultSectionId ?? sections[0]?.id ?? "",
    data: {},
    bg_color: defaultCardBg,
    text_color: defaultCardText,
    custom_colors: false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    if (editing) {
      setDraft({
        kind: editing.kind,
        section_id: editing.section_id,
        data: { ...editing.data },
        bg_color: editing.bg_color,
        text_color: editing.text_color,
        custom_colors: editing.custom_colors,
      });
    } else {
      setDraft({
        kind: "link",
        section_id: defaultSectionId ?? sections[0]?.id ?? "",
        data: {},
        bg_color: defaultCardBg,
        text_color: defaultCardText,
        custom_colors: false,
      });
    }
  }, [open, editing, defaultSectionId, sections, defaultCardBg, defaultCardText]);

  function setData(patch: Record<string, any>) {
    setDraft((d) => ({ ...d, data: { ...d.data, ...patch } }));
  }

  async function submit() {
    setErr(null);
    if (!draft.section_id) { setErr("Pick a section."); return; }
    setBusy(true);
    try {
      await onSave(draft);
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't save card.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit card" : "New card"}>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-sm font-bold mb-1">Type</label>
          <select
            className="field"
            value={draft.kind}
            onChange={(e) => setDraft({ ...draft, kind: e.target.value as CardKind, data: {} })}
            disabled={!!editing}
          >
            {(Object.keys(KIND_LABELS) as CardKind[]).map((k) => (
              <option key={k} value={k}>{KIND_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Section</label>
          <select
            className="field"
            value={draft.section_id}
            onChange={(e) => setDraft({ ...draft, section_id: e.target.value })}
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <KindFields kind={draft.kind} data={draft.data} setData={setData} />

      <div className="mt-2">
        <ColorPalette
          label="Card background"
          value={draft.bg_color}
          onChange={(c) => setDraft((d) => ({ ...d, bg_color: c, custom_colors: true }))}
        />
        <ColorPalette
          label="Card text"
          value={draft.text_color}
          onChange={(c) => setDraft((d) => ({ ...d, text_color: c, custom_colors: true }))}
        />
        {draft.custom_colors && (
          <button
            type="button"
            className="text-xs underline opacity-70 mb-2"
            onClick={() => setDraft((d) => ({ ...d, bg_color: defaultCardBg, text_color: defaultCardText, custom_colors: false }))}
          >
            ↺ Use theme colors
          </button>
        )}
      </div>

      <div className="rounded-xl border-2 border-ink p-3 mt-1" style={{ background: draft.bg_color, color: draft.text_color }}>
        <div className="text-xs opacity-70 uppercase tracking-wider font-bold">Preview</div>
        <div className="font-display text-lg">{draft.data.title || draft.data.name || draft.data.form || "Card preview"}</div>
      </div>

      {err && <p className="text-red-600 text-sm mt-3">{err}</p>}

      <div className="flex justify-end gap-2 mt-4">
        <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={busy}>
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}

function KindFields({
  kind,
  data,
  setData,
}: {
  kind: CardKind;
  data: Record<string, any>;
  setData: (p: Record<string, any>) => void;
}) {
  if (kind === "endpoint") {
    return (
      <>
        <Text label="Name" value={data.name} onChange={(v) => setData({ name: v })} />
        <Text label="Key" value={data.key} onChange={(v) => setData({ key: v })} />
        <Text label="URL" value={data.url} onChange={(v) => setData({ url: v })} />
        <Text label="Swagger URL (optional)" value={data.swagger_url} onChange={(v) => setData({ swagger_url: v })} />
      </>
    );
  }
  if (kind === "form_key") {
    return (
      <>
        <Text label="Service" value={data.service} onChange={(v) => setData({ service: v })} />
        <Text label="Form name" value={data.form} onChange={(v) => setData({ form: v })} />
        <Text label="URN" value={data.urn} onChange={(v) => setData({ urn: v })} />
      </>
    );
  }
  if (kind === "report") {
    return (
      <>
        <Text label="Service" value={data.service} onChange={(v) => setData({ service: v })} />
        <Text label="Module" value={data.module} onChange={(v) => setData({ module: v })} />
        <Text label="Report ID" value={data.report_id} onChange={(v) => setData({ report_id: v })} />
        <Text
          label="DB views (comma-separated)"
          value={(data.db_views ?? []).join(", ")}
          onChange={(v) => setData({ db_views: v.split(",").map((s) => s.trim()).filter(Boolean) })}
        />
      </>
    );
  }
  if (kind === "guide") {
    return (
      <>
        <Text label="Title" value={data.title} onChange={(v) => setData({ title: v })} />
        <label className="block text-sm font-bold mb-1">Body (markdown)</label>
        <textarea
          className="field mb-3"
          rows={6}
          value={data.body_md ?? ""}
          onChange={(e) => setData({ body_md: e.target.value })}
        />
      </>
    );
  }
  return (
    <>
      <Text label="Title" value={data.title} onChange={(v) => setData({ title: v })} />
      <Text label="URL" value={data.url} onChange={(v) => setData({ url: v })} />
      <Text label="Description" value={data.description} onChange={(v) => setData({ description: v })} />
      <Text
        label="Tags (comma-separated)"
        value={(data.tags ?? []).join(", ")}
        onChange={(v) => setData({ tags: v.split(",").map((s) => s.trim()).filter(Boolean) })}
      />
    </>
  );
}

function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-2">
      <label className="block text-sm font-bold mb-1">{label}</label>
      <input className="field" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
