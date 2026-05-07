"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ChatRoom from "@/components/ChatRoom";

export default function ChatPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        router.replace("/login");
        return;
      }
      const uid = session.user.id;

      // Try profiles table first; fall back to auth metadata.
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", uid)
        .maybeSingle();

      let name = profile?.username as string | undefined;
      if (!name) {
        name = (session.user.user_metadata?.username as string) || session.user.email?.split("@")[0];
        if (name) {
          await supabase.from("profiles").upsert({ id: uid, username: name });
        }
      }
      if (!name) {
        setErr("Couldn't determine username.");
        return;
      }
      setUserId(uid);
      setUsername(name);
    })();
  }, [router]);

  if (err) return <main className="p-6 text-center">{err}</main>;
  if (!userId || !username) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-lg italic opacity-70">🐾 Sniffing for clues...</div>
      </main>
    );
  }
  return <ChatRoom userId={userId} username={username} />;
}
