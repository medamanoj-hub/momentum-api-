"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/Shell";
import { Card, GradientButton } from "@/components/ui";
import { remote } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !remote) return;
    setBusy(true);
    try { await remote.auth.forgotPassword(email.trim()); } catch { /* same message either way */ }
    setSent(true);
    setBusy(false);
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm animate-rise">
        <div className="mb-8 flex justify-center"><Link href="/"><Logo /></Link></div>
        <Card className="p-6">
          <h1 className="text-[18px] font-bold text-ink">Reset your password</h1>
          {sent ? (
            <>
              <p className="mt-3 rounded-lg border border-mint/30 bg-mint/10 px-3 py-2.5 text-[13px] text-mint">
                If an account exists for that email, a reset link is on its way. It expires in 30 minutes.
              </p>
              <Link href="/login" className="mt-4 block text-center text-[12px] text-dim transition hover:text-mute">
                ← Back to sign in
              </Link>
            </>
          ) : (
            <>
              <p className="mt-1 text-[12px] text-mute">
                Enter your email and we'll send you a link to choose a new password.
              </p>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email"
                onKeyDown={e => e.key === "Enter" && submit()}
                className="mt-4 w-full rounded-xl border border-line bg-raise px-4 py-2.5 text-[13px] text-ink placeholder:text-dim focus:border-indigo focus:outline-none" />
              <GradientButton onClick={submit} className={`mt-4 w-full ${busy ? "pointer-events-none opacity-60" : ""}`}>
                {busy ? "Sending…" : "Send reset link"}
              </GradientButton>
              <Link href="/login" className="mt-4 block text-center text-[12px] text-dim transition hover:text-mute">
                ← Back to sign in
              </Link>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
