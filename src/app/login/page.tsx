"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Shell";
import { Card, GradientButton } from "@/components/ui";
import { remote } from "@/lib/api";
import { ApiError } from "@/lib/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serverless = !remote; // no NEXT_PUBLIC_API_URL configured

  async function submit() {
    setError(null);
    if (serverless) { router.push("/onboarding"); return; }
    if (!email.trim() || !password) { setError("Enter your email and password."); return; }
    if (mode === "signup" && !name.trim()) { setError("Tell us your name."); return; }
    if (mode === "signup" && password.length < 8) { setError("Password needs at least 8 characters."); return; }

    setBusy(true);
    try {
      if (mode === "signup") {
        await remote!.auth.register({ name: name.trim(), email: email.trim(), password });
      } else {
        await remote!.auth.login({ email: email.trim(), password });
      }
      // Full reload so the store boots from the server state.
      window.location.href = "/dashboard";
    } catch (e) {
      if (e instanceof ApiError) {
        setError(
          e.code === "EMAIL_TAKEN" ? "That email already has an account — try signing in instead." :
          e.code === "UNAUTHORIZED" ? "Wrong email or password." :
          e.code === "RATE_LIMIT_EXCEEDED" ? "Too many attempts — wait a minute and try again." :
          e.message
        );
      } else {
        setError("Couldn't reach the server. Check your connection and try again.");
      }
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm animate-rise">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/"><Logo /></Link>
          <p className="text-[13px] text-mute">Design Your Life. Every Day.</p>
        </div>
        <Card className="p-6">
          <div className="mb-5 flex rounded-xl border border-line bg-surface/70 p-1">
            {(["signin", "signup"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 rounded-lg py-1.5 text-[12px] font-semibold transition ${
                  mode === m ? "bg-gradient-to-r from-indigo/30 to-violet/20 text-ink" : "text-mute hover:text-ink"
                }`}>
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
              className="mb-2.5 w-full rounded-xl border border-line bg-raise px-4 py-2.5 text-[13px] text-ink placeholder:text-dim focus:border-indigo focus:outline-none" />
          )}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email"
            onKeyDown={e => e.key === "Enter" && submit()}
            className="w-full rounded-xl border border-line bg-raise px-4 py-2.5 text-[13px] text-ink placeholder:text-dim focus:border-indigo focus:outline-none" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password"
            onKeyDown={e => e.key === "Enter" && submit()}
            className="mt-2.5 w-full rounded-xl border border-line bg-raise px-4 py-2.5 text-[13px] text-ink placeholder:text-dim focus:border-indigo focus:outline-none" />

          {mode === "signin" && !serverless && (
            <Link href="/forgot-password" className="mt-2 block text-right text-[11px] text-dim transition hover:text-mute">
              Forgot password?
            </Link>
          )}

          {error && (
            <p className="mt-3 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-[12px] text-coral">{error}</p>
          )}

          <GradientButton onClick={submit} className={`mt-4 w-full ${busy ? "pointer-events-none opacity-60" : ""}`}>
            {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
          </GradientButton>

          <div className="my-4 flex items-center gap-3 text-[10px] text-dim">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
          <button onClick={() => router.push(serverless ? "/onboarding" : "/dashboard")}
            className="w-full rounded-xl border border-line bg-raise py-2.5 text-[13px] font-medium text-ink transition hover:border-indigo/40">
            Continue as guest
          </button>
          <p className="mt-2 text-center text-[10px] text-dim">
            Guest mode keeps everything in this browser only.
          </p>
        </Card>
        <p className="mt-4 text-center text-[11px] text-dim">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline transition hover:text-mute">Terms</Link> and{" "}
          <Link href="/privacy" className="underline transition hover:text-mute">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
