"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { emailFromUsername, isValidUsername, normalizeUsername } from "@/lib/auth";
import { PawLogo, FloatingDecor, StarSpark } from "@/components/Cartoons";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const usernameError = isValidUsername(username);
    if (usernameError) {
      setErr(usernameError);
      return;
    }

    setLoading(true);
    const email = emailFromUsername(normalizeUsername(username));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (/Invalid login/i.test(error.message)) setErr("Wrong username or password.");
      else setErr(error.message);
      return;
    }
    router.replace("/chat");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <FloatingDecor />
      <form onSubmit={handleSubmit} className="glass-card p-8 max-w-md w-full relative z-10">
        <StarSpark className="absolute -top-4 -right-4 animate-wiggle" size={30} color="#5DF8D8" />

        <div className="text-center mb-6">
          <PawLogo className="mx-auto mb-2 animate-floaty" size={56} />
          <h1 className="text-3xl">Welcome back</h1>
          <p className="text-sm opacity-70 italic">Still clueless? Same.</p>
        </div>

        <label className="block text-sm font-bold mb-1">Username</label>
        <input
          className="field mb-3"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoCapitalize="off"
          autoComplete="username"
        />

        <label className="block text-sm font-bold mb-1">Password</label>
        <input
          className="field mb-4"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {err && <p className="text-red-600 text-sm mb-3 font-semibold">{err}</p>}

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Sniffing..." : "Log in"}
        </button>
        <p className="text-center text-sm mt-4">
          New here? <a href="/signup" className="underline font-bold">Sign up</a>
        </p>
      </form>
    </main>
  );
}
