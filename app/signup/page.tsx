"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SECRET_KEY, emailFromUsername, isValidUsername, normalizeUsername } from "@/lib/auth";
import { PawLogo, FloatingDecor, StarSpark } from "@/components/Cartoons";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);

    if (secret !== SECRET_KEY) {
      setErr("That secret key isn't right. Ask the host. 🐾");
      return;
    }
    const usernameError = isValidUsername(username);
    if (usernameError) {
      setErr(usernameError);
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const cleanUsername = normalizeUsername(username);
    const email = emailFromUsername(cleanUsername);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: cleanUsername } },
    });
    if (error) {
      setLoading(false);
      if (/registered/i.test(error.message)) setErr("That username is taken. Try another.");
      else setErr(error.message);
      return;
    }

    if (data.session && data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, username: cleanUsername });
      setLoading(false);
      router.replace("/chat");
    } else {
      setLoading(false);
      setInfo("Account created! You can log in now.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <FloatingDecor />
      <form onSubmit={handleSubmit} className="glass-card p-8 max-w-md w-full relative z-10">
        <StarSpark className="absolute -top-4 -left-4 animate-wiggle" size={32} color="#FFD93D" />
        <StarSpark className="absolute -bottom-3 -right-3 animate-wiggle" size={28} color="#5DF8D8" />

        <div className="text-center mb-6">
          <PawLogo className="mx-auto mb-2 animate-floaty" size={56} />
          <h1 className="text-3xl">Join the pack</h1>
          <p className="text-sm opacity-70 italic">Pick a name, pick a password, prove you're invited.</p>
        </div>

        <label className="block text-sm font-bold mb-1">Username</label>
        <input
          className="field mb-3"
          placeholder="ishiish"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoCapitalize="off"
          autoComplete="username"
        />

        <label className="block text-sm font-bold mb-1">Password</label>
        <input
          className="field mb-3"
          type="password"
          minLength={6}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        <label className="block text-sm font-bold mb-1">Secret key</label>
        <input
          className="field mb-1"
          placeholder="••••"
          required
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          inputMode="numeric"
        />
        <p className="text-[11px] opacity-60 mb-4">Only friends-of-the-pack have this. 🤫</p>

        {err && <p className="text-red-600 text-sm mb-3 font-semibold">{err}</p>}
        {info && <p className="text-emerald-700 text-sm mb-3 font-semibold">{info}</p>}

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Tracking paws..." : "Sign up"}
        </button>
        <p className="text-center text-sm mt-4">
          Already a clue-haver?{" "}
          <a href="/login" className="underline font-bold">Log in</a>
        </p>
      </form>
    </main>
  );
}
