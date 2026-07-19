"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Shell";
import { remote } from "@/lib/api";

const FEATURES = [
  { icon: "👑", title: "Momentum Score™", text: "One number for your whole life. Every meaningful action — tasks, habits, deep work, reflection — compounds into visible progress." },
  { icon: "✦", title: "AI Coach", text: "A strategic, calm coach that reads your real day and tells you the single highest-leverage thing to do next. It recommends; you decide." },
  { icon: "◈", title: "Nine Life Areas", text: "Career, health, learning, finance, relationships, mind, home, purpose, hobbies — balanced in one place instead of nine apps." },
  { icon: "▤", title: "Planner & Time Blocks", text: "Goals become milestones, milestones become projects, projects become today's plan. Every task traces back to something that matters." },
  { icon: "◔", title: "Focus Mode", text: "Distraction-free deep work sessions from 25 to 90 minutes that feed your score the moment you finish." },
  { icon: "∿", title: "Insights", text: "Streaks, life balance, deep-work hours, and trends — meaningful progress, not vanity metrics." }
];

export default function Landing() {
  // Auth lives in localStorage, so read it after mount to keep SSR output stable.
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { setSignedIn(Boolean(remote?.authenticated)); }, []);
  const cta = signedIn ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen">
      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-3">
          <Link href="/login" className="rounded-xl px-4 py-2 text-[13px] font-medium text-mute transition hover:text-ink">
            Sign in
          </Link>
          <Link href={cta}
            className="rounded-xl bg-gradient-to-r from-indigo to-violet px-4 py-2 text-[13px] font-semibold text-white shadow-glow transition hover:brightness-110">
            {signedIn ? "Open App" : "Get Started"}
          </Link>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 pb-16 pt-16 text-center animate-rise">
        <p className="mx-auto mb-5 w-fit rounded-full border border-indigo/30 bg-indigo/10 px-4 py-1.5 text-[11px] font-semibold tracking-wide text-indigo">
          Your AI-powered Life Operating System
        </p>
        <h1 className="text-[44px] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-[56px]">
          Design Your Life.
          <span className="block bg-gradient-to-r from-azure via-indigo to-violet bg-clip-text text-transparent">
            Every Day.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-mute">
          Stop juggling a calendar, a to-do app, a habit tracker, and a journal.
          Momentum unifies planning, habits, goals, reflection, and AI coaching into
          one calm, beautiful command center — so every small action compounds.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={cta}
            className="rounded-xl bg-gradient-to-r from-indigo to-violet px-7 py-3 text-[15px] font-semibold text-white shadow-glow transition hover:brightness-110 active:scale-[.98]">
            {signedIn ? "Open your dashboard →" : "Start building momentum →"}
          </Link>
          <Link href="/login"
            className="rounded-xl border border-line bg-raise/60 px-7 py-3 text-[15px] font-medium text-ink transition hover:border-indigo/40">
            Try it as a guest
          </Link>
        </div>
        <p className="mt-4 text-[12px] text-dim">Free while in early access · No credit card</p>
      </section>

      {/* ── Score preview strip ─────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6">
        <div className="rounded-2xl border border-line bg-card/90 p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center">
            <Stat value="738" label="Momentum Score" />
            <Stat value="9" label="Life areas, one home" />
            <Stat value="25–90m" label="Focus sessions" />
            <Stat value="+56" label="vs yesterday" tint="#22c55e" />
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-[26px] font-bold tracking-tight text-ink">
          Everything that matters, nothing that doesn't
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-2xl border border-line bg-card/80 p-5 transition hover:border-indigo/40">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo/25 to-violet/15 text-lg">
                {f.icon}
              </span>
              <h3 className="mt-3 text-[15px] font-semibold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-mute">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Philosophy ──────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 pb-16 text-center">
        <div className="rounded-2xl border border-line bg-gradient-to-b from-indigo/10 to-transparent p-8">
          <p className="text-[17px] font-medium leading-relaxed text-ink">
            Most people don't fail from lack of ambition. They fail because life is fragmented.
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-mute">
            Momentum is built on a simple belief: consistency beats intensity, every decision
            compounds, and your life deserves one home. Not another productivity app —
            an operating system for the person you're becoming.
          </p>
          <Link href={cta}
            className="mt-6 inline-block rounded-xl bg-gradient-to-r from-indigo to-violet px-7 py-3 text-[14px] font-semibold text-white shadow-glow transition hover:brightness-110">
            Build Momentum →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <Logo small />
          <nav className="flex gap-6 text-[12px] text-mute">
            <Link href="/privacy" className="transition hover:text-ink">Privacy</Link>
            <Link href="/terms" className="transition hover:text-ink">Terms</Link>
            <Link href="/login" className="transition hover:text-ink">Sign in</Link>
          </nav>
          <p className="text-[11px] text-dim">© {new Date().getFullYear()} Momentum</p>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label, tint }: { value: string; label: string; tint?: string }) {
  return (
    <div>
      <p className="text-[24px] font-extrabold tracking-tight text-ink" style={tint ? { color: tint } : undefined}>{value}</p>
      <p className="text-[11px] text-mute">{label}</p>
    </div>
  );
}
