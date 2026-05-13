"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  applyThemeToCards,
  createCard,
  createSection,
  deleteCard,
  deleteSection,
  getCachedPrefs,
  getPrefs,
  patchCachedPrefs,
  listCards,
  listSections,
  LibraryCard,
  LibrarySection,
  renameSection,
  reorderCards,
  Scope,
  setPageBg,
  setPageImage,
  setTheme,
  Theme,
  hexA,
  updateCard,
} from "@/lib/library";
import AddEditCardModal from "@/components/library/AddEditCardModal";
import AddEditSectionModal from "@/components/library/AddEditSectionModal";
import PageStyleModal from "@/components/library/PageStyleModal";
import LibraryCardView from "@/components/library/LibraryCardView";
import CopyToast from "@/components/library/CopyToast";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";

export default function LibraryClient() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>("mine");
  const [sections, setSections] = useState<LibrarySection[]>([]);
  const [cards, setCards] = useState<LibraryCard[]>([]);
  const [pageBg, setPageBgState] = useState<string | null>(null);
  const [pageImage, setPageImageState] = useState<string | null>(null);
  const [cardBg, setCardBg] = useState<string>("#ffffff");
  const [cardText, setCardText] = useState<string>("#093C5D");
  const [themeKey, setThemeKey] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showSection, setShowSection] = useState<{ open: boolean; editing?: LibrarySection | null }>({ open: false });
  const [showCard, setShowCard] = useState<{ open: boolean; sectionId?: string; editing?: LibraryCard | null }>({ open: false });
  const [showPage, setShowPage] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) { router.replace("/login"); return; }
      setUserId(session.user.id);
      // 1) instant paint from cache
      const cached = getCachedPrefs(session.user.id);
      if (cached) {
        setPageBgState(cached.page_bg ?? null);
        setPageImageState(cached.page_image ?? null);
        setThemeKey(cached.theme_key ?? null);
        if (cached.card_bg) setCardBg(cached.card_bg);
        if (cached.card_text) setCardText(cached.card_text);
      }
      // 2) refresh from server (getPrefs re-caches automatically)
      try {
        const prefs = await getPrefs(session.user.id);
        if (prefs) {
          setPageBgState(prefs.page_bg ?? null);
          setPageImageState(prefs.page_image ?? null);
          setThemeKey(prefs.theme_key ?? null);
          if (prefs.card_bg) setCardBg(prefs.card_bg);
          if (prefs.card_text) setCardText(prefs.card_text);
        }
      } catch (e: any) {
        // table may not exist yet; ignore
      }
    })();
  }, [router]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setErr(null);
    try {
      const s = await listSections(scope, userId);
      const c = await listCards(s.map((x) => x.id));
      setSections(s);
      setCards(c);
      setActiveSectionId((prev) => (prev && s.some((x) => x.id === prev) ? prev : s[0]?.id ?? null));
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't load library.");
    } finally {
      setLoading(false);
    }
  }, [scope, userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const activeSection = useMemo(
    () => sections.find((s) => s.id === activeSectionId) ?? null,
    [sections, activeSectionId]
  );

  const cardsBySection = useMemo(() => {
    const map: Record<string, LibraryCard[]> = {};
    for (const c of cards) (map[c.section_id] ||= []).push(c);
    return map;
  }, [cards]);

  async function onSaveSection(name: string) {
    if (!userId) return;
    if (showSection.editing) {
      await renameSection(showSection.editing.id, name);
    } else {
      await createSection(scope, userId, name, sections.length);
    }
    await refresh();
  }

  async function onDeleteSection(s: LibrarySection) {
    if (!confirm(`Delete section "${s.name}" and all its cards?`)) return;
    await deleteSection(s.id);
    await refresh();
  }

  async function onSaveCard(d: {
    kind: any; section_id: string; data: any; bg_color: string; text_color: string; custom_colors: boolean;
  }) {
    if (!userId) return;
    if (showCard.editing) {
      await updateCard(showCard.editing.id, d);
    } else {
      const pos = (cardsBySection[d.section_id]?.length ?? 0);
      await createCard(scope, userId, { ...d, position: pos });
    }
    await refresh();
  }

  async function onDeleteCard(c: LibraryCard) {
    if (!confirm("Delete this card?")) return;
    await deleteCard(c.id);
    await refresh();
  }

  async function onSavePageBg(bg: string | null) {
    if (!userId) return;
    await setPageBg(userId, bg);
    patchCachedPrefs(userId, { page_bg: bg });
    setPageBgState(bg);
  }

  async function onSavePageImage(img: string | null) {
    if (!userId) return;
    await setPageImage(userId, img);
    patchCachedPrefs(userId, { page_image: img });
    setPageImageState(img);
  }

  async function onPickTheme(t: Theme) {
    if (!userId) return;
    const patch = {
      page_bg: t.page_bg,
      card_bg: t.card_bg,
      card_text: t.card_text,
      theme_key: t.key,
    };
    await setTheme(userId, patch);
    patchCachedPrefs(userId, patch);
    setPageBgState(t.page_bg);
    setCardBg(t.card_bg);
    setCardText(t.card_text);
    setThemeKey(t.key);
    if (scope === "mine") {
      await applyThemeToCards(sections.map((s) => s.id), t.card_bg, t.card_text);
      await refresh();
    }
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const activeData = active.data.current as any;
    const overData = over.data.current as any;
    if (activeData?.type !== "card") return;

    const fromSection = activeData.section_id as string;
    const toSection = (overData?.type === "card" ? overData.section_id : over.id) as string;

    const sourceList = [...(cardsBySection[fromSection] ?? [])];
    if (fromSection === toSection) {
      const oldIdx = sourceList.findIndex((c) => c.id === active.id);
      const newIdx = sourceList.findIndex((c) => c.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return;
      const reordered = arrayMove(sourceList, oldIdx, newIdx);
      // optimistic
      setCards((prev) => {
        const others = prev.filter((c) => c.section_id !== fromSection);
        return [...others, ...reordered.map((c, i) => ({ ...c, position: i }))];
      });
      await reorderCards(reordered.map((c, i) => ({ id: c.id, section_id: fromSection, position: i })));
    } else {
      const moving = sourceList.find((c) => c.id === active.id);
      if (!moving) return;
      const targetList = [...(cardsBySection[toSection] ?? [])];
      const newSource = sourceList.filter((c) => c.id !== active.id);
      const overIdx = overData?.type === "card" ? targetList.findIndex((c) => c.id === over.id) : targetList.length;
      const insertAt = overIdx < 0 ? targetList.length : overIdx;
      const newTarget = [...targetList.slice(0, insertAt), { ...moving, section_id: toSection }, ...targetList.slice(insertAt)];
      setCards((prev) => {
        const others = prev.filter((c) => c.section_id !== fromSection && c.section_id !== toSection);
        return [
          ...others,
          ...newSource.map((c, i) => ({ ...c, position: i })),
          ...newTarget.map((c, i) => ({ ...c, position: i, section_id: toSection })),
        ];
      });
      await reorderCards([
        ...newSource.map((c, i) => ({ id: c.id, section_id: fromSection, position: i })),
        ...newTarget.map((c, i) => ({ id: c.id, section_id: toSection, position: i })),
      ]);
    }
  }

  const themed = !!themeKey;
  const translucent = !!pageImage;
  // Chrome strip (sidebar header, main header): use themed card colors when a theme is set
  const headerStyle: React.CSSProperties = themed
    ? { background: cardBg, color: cardText, borderColor: cardText }
    : {};
  // Glass card body — translucent when an image is behind it
  const paneStyle: React.CSSProperties = translucent
    ? { background: hexA(themed ? cardBg : "#ffffff", 0.55), backdropFilter: "blur(14px)" }
    : themed
    ? { background: hexA(cardBg, 0.92), color: cardText }
    : {};
  const navItemActiveStyle: React.CSSProperties = themed
    ? { background: cardBg, color: cardText, borderColor: cardText }
    : {};

  return (
    <div
      className="min-h-[100dvh]"
      style={
        pageImage
          ? { backgroundImage: `url(${pageImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }
          : pageBg
          ? { background: pageBg, backgroundAttachment: "fixed" }
          : undefined
      }
    >
      <main className="min-h-[100dvh] flex justify-center p-0 sm:p-4 lg:p-6">
        <div className="flex gap-0 lg:gap-3 w-full max-w-6xl h-[100dvh] sm:h-[92vh] relative">
          {/* Sidebar — mirrors the chat Sidebar shell */}
          <aside className="w-72 max-w-[85vw] lg:w-64 shrink-0 glass-card flex flex-col overflow-hidden h-[100dvh] lg:h-full" style={paneStyle}>
            <div
              className={`px-3 py-3 border-b-2 border-ink flex items-center gap-2 ${themed ? "" : "bg-gradient-to-br from-mint to-sky on-accent"}`}
              style={headerStyle}
            >
              <span className="text-2xl">📚</span>
              <div className="leading-tight flex-1 min-w-0">
                <div className="font-display text-lg truncate">Dev Library</div>
                <div className="text-[10px] italic opacity-80 truncate">your code codex</div>
              </div>
              <Link href="/chat" className="btn-ghost !py-1 !px-2 text-xs" title="Back to chat">←</Link>
            </div>

            <div className="px-3 pt-3">
              <div className="bg-cloud/70 border-2 border-ink rounded-full p-1 inline-flex w-full gap-1">
                {(["mine", "shared"] as Scope[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScope(s)}
                    className={`flex-1 px-2 py-1 rounded-full text-xs font-bold transition ${
                      scope === s ? "bg-mint on-accent shadow-popSm" : "hover:bg-white/60"
                    }`}
                  >
                    {s === "mine" ? "My Library" : "Shared"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              <div>
                <div className="px-2 mb-1">
                  <span className="text-[11px] uppercase tracking-wider opacity-60 font-bold">Sections</span>
                </div>
                {sections.length === 0 && (
                  <div className="text-[11px] italic opacity-50 px-2">No sections yet.</div>
                )}
                {sections.map((s) => {
                  const count = (cardsBySection[s.id] ?? []).length;
                  const isActive = s.id === activeSectionId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSectionId(s.id)}
                      style={isActive ? navItemActiveStyle : undefined}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition border-2 ${
                        isActive
                          ? (themed ? "font-bold shadow-popSm" : "bg-mint font-bold on-accent border-ink")
                          : "border-transparent hover:bg-cloud"
                      }`}
                    >
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 border-ink bg-white">📄</span>
                      <span className="truncate flex-1">{s.name}</span>
                      {count > 0 && (
                        <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-white text-ink text-[11px] font-bold flex items-center justify-center border-2 border-ink">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t-2 border-ink p-2 flex items-center gap-2">
              <button
                className="btn-ghost !py-1 !px-3 text-xs flex-1"
                onClick={() => setShowPage(true)}
                title="Theme & background"
              >🎨 Theme</button>
              <button
                className="btn-primary !py-1 !px-3 text-xs flex-1"
                onClick={() => setShowSection({ open: true })}
                title="New section"
              >＋ Section</button>
            </div>
          </aside>

          {/* Main pane — mirrors ChatRoom shell */}
          <section className="flex-1 min-w-0 glass-card flex flex-col overflow-hidden h-[100dvh] lg:h-full" style={paneStyle}>
            {err && <p className="text-red-600 text-sm p-4">{err}</p>}
            {loading && <p className="opacity-60 p-4">Loading…</p>}

            {!loading && sections.length === 0 && (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                  <div className="font-display text-2xl mb-2">Nothing here yet</div>
                  <p className="text-sm opacity-70 mb-4">
                    {scope === "mine" ? "Start your personal library with a section." : "Be the first to add a shared section."}
                  </p>
                  <button className="btn-primary" onClick={() => setShowSection({ open: true })}>Create a section</button>
                </div>
              </div>
            )}

            {activeSection && (
              <>
                <header
                  className={`px-4 py-3 border-b-2 border-ink flex items-center gap-3 ${themed ? "" : "bg-gradient-to-br from-mint to-sky on-accent"}`}
                  style={headerStyle}
                >
                  <span className="text-2xl">📄</span>
                  <div className="leading-tight flex-1 min-w-0">
                    <div className="font-display text-lg truncate">{activeSection.name}</div>
                    <div className="text-[10px] italic opacity-80 truncate">
                      {(cardsBySection[activeSection.id] ?? []).length} {((cardsBySection[activeSection.id] ?? []).length) === 1 ? "card" : "cards"}
                    </div>
                  </div>
                  <button
                    className="btn-primary !py-1 !px-3 text-xs"
                    onClick={() => setShowCard({ open: true, sectionId: activeSection.id })}
                    title="Add card to this section"
                  >＋ Card</button>
                  <button
                    className="btn-ghost !py-1 !px-2 text-xs"
                    onClick={() => setShowSection({ open: true, editing: activeSection })}
                    title="Rename"
                  >✎</button>
                  <button
                    className="btn-ghost !py-1 !px-2 text-xs"
                    onClick={() => onDeleteSection(activeSection)}
                    title="Delete section"
                  >🗑</button>
                </header>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <div className="flex-1 overflow-y-auto p-4">
                    <SortableContext
                      items={(cardsBySection[activeSection.id] ?? []).map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-3">
                        {(cardsBySection[activeSection.id] ?? []).length === 0 && (
                          <div className="col-span-full text-sm italic opacity-60 px-2 py-8 border-2 border-dashed border-ink/30 rounded-xl text-center">
                            Empty section. Click <b>＋ Card</b> to add one.
                          </div>
                        )}
                        {(cardsBySection[activeSection.id] ?? []).map((c) => (
                          <LibraryCardView
                            key={c.id}
                            card={c}
                            onEdit={() => setShowCard({ open: true, sectionId: c.section_id, editing: c })}
                            onDelete={() => onDeleteCard(c)}
                            onCopied={(m) => setToast(m)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                </DndContext>
              </>
            )}
          </section>
        </div>
      </main>

      <CopyToast message={toast} onDismiss={() => setToast(null)} />

      <AddEditSectionModal
        open={showSection.open}
        initialName={showSection.editing?.name}
        onClose={() => setShowSection({ open: false })}
        onSave={onSaveSection}
      />
      <AddEditCardModal
        open={showCard.open}
        sections={sections}
        defaultSectionId={showCard.sectionId}
        defaultCardBg={cardBg}
        defaultCardText={cardText}
        editing={showCard.editing ?? null}
        onClose={() => setShowCard({ open: false })}
        onSave={onSaveCard}
      />
      <PageStyleModal
        open={showPage}
        initialThemeKey={themeKey}
        initialPageBg={pageBg}
        initialPageImage={pageImage}
        onClose={() => setShowPage(false)}
        onPickTheme={onPickTheme}
        onCustomPageBg={onSavePageBg}
        onCustomPageImage={onSavePageImage}
      />
    </div>
  );
}
