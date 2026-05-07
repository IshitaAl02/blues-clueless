"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PawLogo from "@/components/PawLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErr(error.message);
    else router.replace("/chat");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="paw-card p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <PawLogo className="mx-auto mb-2" size={48} />
          <h1 className="text-3xl">Welcome back</h1>
          <p className="text-sm opacity-70 italic">Still clueless? Same.</p>
        </div>
        <label className="block text-sm font-semibold mb-1">Email</label>
        <input className="paw-input mb-3" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="block text-sm font-semibold mb-1">Password</label>
        <input className="paw-input mb-4" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="text-red-600 text-sm mb-3">{err}</p>}
        <button className="paw-btn w-full" disabled={loading}>{loading ? "Sniffing..." : "Log in"}</button>
        <p className="text-center text-sm mt-4">
          New here? <a href="/signup" className="underline font-semibold">Sign up</a>
        </p>
      </form>
    </main>
  );
}
