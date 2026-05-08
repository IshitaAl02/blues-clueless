"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ChatRoom from "@/components/ChatRoom";
import Sidebar from "@/components/Sidebar";
import { NewGroupModal, NewDMModal } from "@/components/ConversationModals";
import { Conversation, LOBBY, listConversations } from "@/lib/conversations";

export default function ChatPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation>(LOBBY);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);

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

  async function handleCreated(convId: string) {
    const list = await listConversations(userId!);
    setConversations(list);
    const found = list.find((c) => c.id === convId);
    if (found) setActive(found);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (err) return <main className="p-6 text-center">{err}</main>;
  if (!userId || !username) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-lg italic opacity-70">🐾 Sniffing for clues...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex justify-center p-3 sm:p-6">
      <div className="flex gap-3 w-full max-w-6xl h-[92vh]">
        <Sidebar
          conversations={conversations}
          activeId={active.id}
          myUserId={userId}
          onSelect={setActive}
          onNewGroup={() => setShowNewGroup(true)}
          onNewDM={() => setShowNewDM(true)}
          onLogout={handleLogout}
        />

        <ChatRoom
          key={active.id}
          userId={userId}
          username={username}
          conversation={active}
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
    </main>
  );
}
