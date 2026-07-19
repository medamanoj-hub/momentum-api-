"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "@/components/Shell";
import { Card, GradientButton } from "@/components/ui";
import { remote } from "@/lib/api";
import { ApiError } from "@/lib/client";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!remote) { setError("Server connection isn't configured."); return; }
    if (password.length < 8) { setError("Password needs at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setBusy(true);
    try {
      await remote.auth.resetPassword(token, password);
      setDone(true);
    } catch (e) {
      setError(e instanceof ApiError && e.code === "RESET_TOKEN_INVALID"
        ? "This reset link is invalid or has expired. Request a new one."
        : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <p className="mt-3 text-[13px] text-mute">
        This page needs a reset link from your email.{" "}
        <Link href="/forgot-password" className="text-indigo underline">Request one here.</Link>
      </p>
    );
  }

  if (done) {
    return (
      <>
        <p className="mt-3 rounded-lg border border-mint/30 bg-mint/10 px-3 py-2.5 text-[13px] text-mint">
          Password updated. Sign in with your new password.
        </p>
        <Link href="/login"
          className="mt-4 block rounded-xl bg-gradient-to-r from-indigo to-violet py-2.5 text-center text-sm font-semibold text-white shadow-glow transition hover:brightness-110">
          Go to sign in →
        </Link>
      </>
    );
  }

  return (
    <>
      <p className="mt-1 text-[12px] text-mute">Choose a new password for your account.</p>
      <input value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" type="password"
        className="mt-4 w-full rounded-xl border border-line bg-raise px-4 py-2.5 text-[13px] text-ink placeholder:text-dim focus:border-indigo focus:outline-none" />
      <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat new password" type="password"
        onKeyDown={e => e.key === "Enter" && submit()}
        className="mt-2.5 w-full rounded-xl border border-line bg-raise px-4 py-2.5 text-[13px] text-ink placeholder:text-dim focus:border-indigo focus:outline-none" />
      {error && (
        <p className="mt-3 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-[12px] text-coral">{error}</p>
      )}
      <GradientButton onClick={submit} className={`mt-4 w-full ${busy ? "pointer-events-none opacity-60" : ""}`}>
        {busy ? "Saving…" : "Set new password"}
      </GradientButton>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm animate-rise">
        <div className="mb-8 flex justify-center"><Link href="/"><Logo /></Link></div>
        <Card className="p-6">
          <h1 className="text-[18px] font-bold text-ink">Set a new password</h1>
          <Suspense fallback={<p className="mt-3 text-[13px] text-mute">Loading…</p>}>
            <ResetForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
