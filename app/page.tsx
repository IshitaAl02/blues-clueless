"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PawLogo, FloatingDecor, StarSpark } from "@/components/Cartoons";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/chat");
    });
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <FloatingDecor />
      <div className="glass-card p-10 max-w-md w-full text-center relative z-10">
        <StarSpark className="absolute -top-4 -left-4 animate-wiggle" size={32} color="#FFD93D" />
        <StarSpark className="absolute -top-3 -right-3 animate-wiggle" size={26} color="#5DF8D8" />

        <PawLogo className="mx-auto mb-3 animate-floaty" size={72} />
        <h1 className="text-5xl mb-1 bg-gradient-to-r from-ink via-ocean to-sky bg-clip-text text-transparent">
          Blue's Clueless
        </h1>
        <p className="text-sm opacity-70 mb-6 italic">"We have no idea either."</p>

        <div className="flex flex-wrap gap-2 justify-center mb-7">
          <span className="chip">🐾 ephemeral</span>
          <span className="chip">🤫 invite-only</span>
          <span className="chip">✨ vibes</span>
        </div>

        <div className="flex gap-3 justify-center">
          <a href="/login" className="btn-primary">Log in</a>
          <a href="/signup" className="btn-ghost">Sign up</a>
        </div>
      </div>
    </main>
  );
}
