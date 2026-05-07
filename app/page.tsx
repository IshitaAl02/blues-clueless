"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PawLogo from "@/components/PawLogo";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/chat");
    });
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="paw-card p-8 max-w-md w-full text-center">
        <PawLogo className="mx-auto mb-3" />
        <h1 className="text-4xl mb-1">Blue's Clueless</h1>
        <p className="text-sm opacity-70 mb-6 italic">"We have no idea either."</p>
        <div className="flex gap-3 justify-center">
          <a href="/login" className="paw-btn">Log in</a>
          <a href="/signup" className="paw-btn" style={{ background: "#FFF8E7" }}>Sign up</a>
        </div>
      </div>
    </main>
  );
}
