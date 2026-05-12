"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ChatRoom from "@/components/ChatRoom";
import Sidebar from "@/components/Sidebar";
import { NewGroupModal, NewDMModal } from "@/components/ConversationModals";
import ProfileModal from "@/components/ProfileModal";
import GroupSettingsModal from "@/components/GroupSettingsModal";
import ChatBgModal from "@/components/ChatBgModal";
import { deriveChatPalette, getPrefs, setChatBg, setChatChrome, setChatImage, setChatText, setChatTheme } from "@/lib/library";
import { Conversation, LOBBY, listConversations } from "@/lib/conversations";
import { getSavedSeed, onSeedChange, loadMySeedFromDb } from "@/lib/profile";
import { fetchAllProfiles, ProfileMap, subscribeProfiles } from "@/lib/profilesCache";

export default function ChatPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation>(LOBBY);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showBg, setShowBg] = useState(false);
  const [chatBg, setChatBgState] = useState<string | null>(null);
  const [chatImage, setChatImageState] = useState<string | null>(null);
  const [chatText, setChatTextState] = useState<string | null>(null);
  const [chatChrome, setChatChromeState] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [myAvatarSeed, setMyAvatarSeed] = useState<string>("");
  const [profiles, setProfiles] = useState<ProfileMap>({});
  const [unreadByConv, setUnreadByConv] = useState<Record<string, number>>({});
  const activeIdRef = useRef(active.id);
  useEffect(() => { activeIdRef.current = active.id; }, [active.id]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) { router.replace("/login"); return; }
      const uid = session.user.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", uid)
        .maybeSingle();

      let name = profile?.username as string | undefined;
      if (!name) {
        name = (session.user.user_metadata?.username as string) || session.user.email?.split("@")[0];
        if (name) await supabase.from("profiles").upsert({ id: uid, username: name });
      }
      if (!name) { setErr("Couldn't determine username."); return; }
      setUserId(uid);
      setUsername(name);
      try {
        const prefs = await getPrefs(uid);
        setChatBgState(prefs?.chat_bg ?? null);
        setChatImageState(prefs?.chat_image ?? null);
        setChatTextState(prefs?.chat_text ?? null);
        setChatChromeState(prefs?.chat_chrome ?? null);
      } catch {}
    })();
  }, [router]);

  const refreshConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await listConversations(userId);
      setConversations(list);
    } catch (e) {
      console.error(e);
    }
  }, [userId]);

  useEffect(() => { refreshConversations(); }, [refreshConversations]);

  // Initialize avatar seed: prefer DB, fall back to localStorage, fall back to username.
  useEffect(() => {
    if (!userId || !username) return;
    (async () => {
      const fromDb = await loadMySeedFromDb(userId);
      setMyAvatarSeed(fromDb ?? getSavedSeed() ?? username);
    })();
    return onSeedChange(() => {
      setMyAvatarSeed(getSavedSeed() ?? username);
    });
  }, [userId, username]);

  // Load every profile + keep the cache in sync via realtime.
  useEffect(() => {
    if (!userId) return;
    fetchAllProfiles().then(setProfiles);
    return subscribeProfiles((entry) => {
      setProfiles((prev) => ({ ...prev, [entry.id]: entry }));
      // If it's me and someone else's tab/device updated our profile, mirror locally
      if (entry.id === userId && entry.avatar_seed) {
        setMyAvatarSeed(entry.avatar_seed);
      }
    });
  }, [userId]);

  // One global channel listens for INSERTs on the messages table.
  // RLS on the messages table only lets us see rows for conversations we're
  // a member of, so we automatically only get notified about our own conversations.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("unread-watcher");
    channel.on(
      "postgres_changes" as any,
      { event: "INSERT", schema: "public", table: "messages" },
      (payload: any) => {
        const row = payload.new;
        if (!row) return;
        if (row.user_id === userId) return; // my own message
        // If the message belongs to the conversation we're currently viewing, don't bump unread.
        // The user is looking at it (or will see it as soon as they refocus the tab — and we
        // also clear on focus below).
        if (row.conversation_id === activeIdRef.current) return;
        setUnreadByConv((prev) => ({
          ...prev,
          [row.conversation_id]: (prev[row.conversation_id] ?? 0) + 1,
        }));
      },
    );
    channel.subscribe();
    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // When the active conversation changes, clear its unread badge.
  // Also clear when the window regains focus while a conversation is open.
  useEffect(() => {
    setUnreadByConv((prev) => {
      if (!prev[active.id]) return prev;
      const next = { ...prev };
      delete next[active.id];
      return next;
    });
    function onFocus() {
      setUnreadByConv((prev) => {
        if (!prev[activeIdRef.current]) return prev;
        const next = { ...prev };
        delete next[activeIdRef.current];
        return next;
      });
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [active.id]);

  function selectConversation(c: Conversation) {
    setActive(c);
    setSidebarOpen(false); // close drawer on mobile after selecting
    setUnreadByConv((prev) => {
      if (!prev[c.id]) return prev;
      const next = { ...prev };
      delete next[c.id];
      return next;
    });
  }

  async function handleCreated(convId: string) {
    const list = await listConversations(userId!);
    setConversations(list);
    const found = list.find((c) => c.id === convId);
    if (found) selectConversation(found);
  }

  // Refresh after group settings changes — keep active in sync, drop it if I left
  async function handleConversationChanged() {
    if (!userId) return;
    const list = await listConversations(userId);
    setConversations(list);
    const updated = list.find((c) => c.id === active.id);
    if (updated) setActive(updated);
    else setActive(LOBBY); // I was removed → fall back to lobby
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const palette = deriveChatPalette({ chrome: chatChrome, text: chatText, bg: chatBg });
  const themeVars: React.CSSProperties = palette
    ? ({
        ["--chrome-bg" as any]: palette.chromeBg,
        ["--chrome-text" as any]: palette.chromeText,
        ["--bubble-me-bg" as any]: palette.bubbleMeBg,
        ["--bubble-me-text" as any]: palette.bubbleMeText,
        ["--accent-mine" as any]: palette.accentMine,
        ["--card-glass" as any]: palette.paneTint,
        ["--card-bg" as any]: palette.paneTint,
        ["--bubble-them-bg" as any]: palette.paneTint,
        ["--bubble-them-text" as any]: palette.chromeText,
        ["--hover-bg" as any]: palette.paneTint,
        ["--reply-bg" as any]: palette.paneTint,
      } as React.CSSProperties)
    : {};

  if (err) return <main className="p-6 text-center">{err}</main>;
  if (!userId || !username) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-lg italic opacity-70">🐾 Sniffing for clues...</div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-[100dvh] flex justify-center p-0 sm:p-4 lg:p-6 ${chatImage ? "chat-translucent" : ""}`}
      style={{
        ...(chatImage
          ? { backgroundImage: `url(${chatImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }
          : chatBg
          ? { background: chatBg, backgroundAttachment: "fixed" }
          : {}),
        ...themeVars,
      }}
    >
      <div className="flex gap-0 lg:gap-3 w-full max-w-6xl h-[100dvh] sm:h-[92vh] relative">
        <Sidebar
          conversations={conversations}
          activeId={active.id}
          myUserId={userId}
          myUsername={username}
          myAvatarSeed={myAvatarSeed || username}
          profiles={profiles}
          unreadByConv={unreadByConv}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelect={selectConversation}
          onNewGroup={() => setShowNewGroup(true)}
          onNewDM={() => setShowNewDM(true)}
          onOpenProfile={() => setShowProfile(true)}
          onOpenBg={() => setShowBg(true)}
          onLogout={handleLogout}
        />

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <ChatRoom
          key={active.id}
          userId={userId}
          username={username}
          conversation={active}
          myAvatarSeed={myAvatarSeed || username}
          profiles={profiles}
          onOpenSettings={active.kind === "group" ? () => setShowGroupSettings(true) : undefined}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      </div>

      <NewGroupModal
        open={showNewGroup}
        onClose={() => setShowNewGroup(false)}
        onCreated={handleCreated}
        myUserId={userId}
      />
      <NewDMModal
        open={showNewDM}
        onClose={() => setShowNewDM(false)}
        onCreated={handleCreated}
        myUserId={userId}
      />
      <ProfileModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        username={username}
        userId={userId}
      />
      <ChatBgModal
        open={showBg}
        initialBg={chatBg}
        initialImage={chatImage}
        initialText={chatText}
        initialChrome={chatChrome}
        onClose={() => setShowBg(false)}
        onSaveTheme={async (t) => {
          await setChatTheme(userId, { chat_bg: t.page_bg, chat_text: t.card_text, chat_image: null, chat_chrome: t.card_bg });
          setChatBgState(t.page_bg);
          setChatTextState(t.card_text);
          setChatChromeState(t.card_bg);
          setChatImageState(null);
        }}
        onSaveBg={async (v) => { await setChatBg(userId, v); setChatBgState(v); }}
        onSaveText={async (v) => { await setChatText(userId, v); setChatTextState(v); }}
        onSaveChrome={async (v) => { await setChatChrome(userId, v); setChatChromeState(v); }}
        onSaveImage={async (v) => { await setChatImage(userId, v); setChatImageState(v); }}
      />
      <GroupSettingsModal
        open={showGroupSettings}
        onClose={() => setShowGroupSettings(false)}
        conversation={active.kind === "group" ? active : null}
        myUserId={userId}
        onChanged={handleConversationChanged}
      />
    </main>
  );
}
