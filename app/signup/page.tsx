"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PawLogo from "@/components/PawLogo";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    const trimmed = username.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setErr("Username must be 2–20 characters.");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: trimmed } },
    });
    if (error) {
      setLoading(false);
      setErr(error.message);
      return;
    }

    // If a session exists right away (email confirmation off), upsert the profile and go.
    if (data.session && data.user) {
      const { error: pErr } = await supabase
        .from("profiles")
        .upsert({ id: data.user.id, username: trimmed });
      setLoading(false);
      if (pErr) {
        setErr(pErr.message);
        return;
      }
      router.replace("/chat");
    } else {
      setLoading(false);
      setInfo("Check your email to confirm your account, then log in.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="paw-card p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <PawLogo className="mx-auto mb-2" size={48} />
          <h1 className="text-3xl">Join the pack</h1>
          <p className="text-sm opacity-70 italic">Pick a name. We'll figure it out together.</p>
        </div>
        <label className="block text-sm font-semibold mb-1">Username (shown in chat)</label>
        <input className="paw-input mb-3" required value={username} onChange={(e) => setUsername(e.target.value)} />
        <label className="block text-sm font-semibold mb-1">Email</label>
        <input className="paw-input mb-3" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="block text-sm font-semibold mb-1">Password</label>
        <input className="paw-input mb-4" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="text-red-600 text-sm mb-3">{err}</p>}
        {info && <p className="text-green-700 text-sm mb-3">{info}</p>}
        <button className="paw-btn w-full" disabled={loading}>{loading ? "Tracking paws..." : "Sign up"}</button>
        <p className="text-center text-sm mt-4">
          Already a clue-haver? <a href="/login" className="underline font-semibold">Log in</a>
        </p>
      </form>
    </main>
  );
}
