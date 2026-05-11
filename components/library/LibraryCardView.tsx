"use client";

import { LibraryCard } from "@/lib/library";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function LibraryCardView({
  card,
  onEdit,
  onDelete,
  onCopied,
}: {
  card: LibraryCard;
  onEdit: () => void;
  onDelete: () => void;
  onCopied: (label: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", section_id: card.section_id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: card.bg_color,
    color: card.text_color,
    opacity: isDragging ? 0.5 : 1,
  };

  async function copy(v: string, label = "Copied") {
    try {
      await navigator.clipboard.writeText(v);
      onCopied(label);
    } catch {}
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-2xl border-2 border-ink shadow-popSm p-4 flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-xs opacity-50 hover:opacity-100"
          title="Drag to reorder"
          aria-label="Drag handle"
        >⋮⋮</button>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider opacity-60 font-bold">{card.kind.replace("_", " ")}</div>
          <CardBody card={card} onCopy={copy} />
        </div>
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={onEdit} className="text-xs px-2 py-0.5 rounded border-2 border-current" title="Edit">✎</button>
          <button onClick={onDelete} className="text-xs px-2 py-0.5 rounded border-2 border-current" title="Delete">🗑</button>
        </div>
      </div>
    </div>
  );
}

function CardBody({ card, onCopy }: { card: LibraryCard; onCopy: (v: string, label?: string) => void }) {
  const d = card.data || {};
  if (card.kind === "endpoint") {
    return (
      <>
        <div className="font-display text-lg truncate">{d.name || "Endpoint"}</div>
        {d.key && <div className="text-xs opacity-80">key: <code>{d.key}</code></div>}
        {d.url && (
          <div className="flex items-center gap-2">
            <code className="text-xs truncate flex-1">{d.url}</code>
            <button onClick={() => onCopy(d.url, "URL copied")} className="text-xs px-2 py-0.5 border-2 border-current rounded">copy</button>
          </div>
        )}
        {d.swagger_url && (
          <a href={d.swagger_url} target="_blank" rel="noreferrer" className="text-xs underline">swagger →</a>
        )}
      </>
    );
  }
  if (card.kind === "form_key") {
    return (
      <>
        <div className="font-display text-lg truncate">{d.form || "Form key"}</div>
        {d.service && <div className="text-xs opacity-80">{d.service}</div>}
        {d.urn && (
          <div className="flex items-center gap-2">
            <code className="text-xs truncate flex-1">{d.urn}</code>
            <button onClick={() => onCopy(d.urn, "URN copied")} className="text-xs px-2 py-0.5 border-2 border-current rounded">copy</button>
          </div>
        )}
      </>
    );
  }
  if (card.kind === "report") {
    return (
      <>
        <div className="font-display text-lg truncate">{d.module || "Report"}</div>
        {d.service && <div className="text-xs opacity-80">{d.service}</div>}
        {d.report_id && <div className="text-xs">id: <code>{d.report_id}</code></div>}
        {Array.isArray(d.db_views) && d.db_views.length > 0 && (
          <div className="text-xs opacity-80">views: {d.db_views.join(", ")}</div>
        )}
      </>
    );
  }
  if (card.kind === "guide") {
    return (
      <>
        <div className="font-display text-lg truncate">{d.title || "Guide"}</div>
        {d.body_md && <div className="text-xs whitespace-pre-wrap line-clamp-6">{d.body_md}</div>}
      </>
    );
  }
  return (
    <>
      <div className="font-display text-lg truncate">{d.title || "Link"}</div>
      {d.url && (
        <a href={d.url} target="_blank" rel="noreferrer" className="text-xs underline truncate block">{d.url}</a>
      )}
      {d.description && <div className="text-xs opacity-80">{d.description}</div>}
      {Array.isArray(d.tags) && d.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {d.tags.map((t: string) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full border border-current">{t}</span>
          ))}
        </div>
      )}
    </>
  );
}
