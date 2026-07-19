"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import { useMomentum } from "@/lib/store";
import { AREA_TINT } from "./ui";
import type { LifeAreaId } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/life", label: "Life", icon: "◈" },
  { href: "/planner", label: "Planner", icon: "▤" },
  { href: "/coach", label: "AI Coach", icon: "◎" },
  { href: "/insights", label: "Insights", icon: "∿" },
  { href: "/search", label: "Search", icon: "⌕" },
  { href: "/profile", label: "Profile", icon: "◉" }
];

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-azure via-indigo to-violet text-[15px] font-black text-white shadow-glow">
        M
      </span>
      {!small && <span className="text-[15px] font-bold tracking-tight text-ink">Momentum</span>}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { state } = useMomentum();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col border-r border-line bg-surface/80 px-3 py-5 backdrop-blur-md lg:flex">
      <div className="px-2"><Logo /></div>
      <nav className="mt-8 flex flex-col gap-1">
        {NAV.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                active
                  ? "bg-gradient-to-r from-indigo/25 to-violet/15 text-ink shadow-[inset_0_0_0_1px_rgba(99,102,241,.35)]"
                  : "text-mute hover:bg-raise hover:text-ink"
              }`}
            >
              <span className="w-4 text-center text-[15px]">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <QuickCapture />
        <Link href="/profile" className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-raise/60 px-3 py-2.5 transition hover:border-indigo/40">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo to-violet text-xs font-bold text-white">
            {state.user.name.charAt(0)}
          </span>
          <span>
            <span className="block text-[12px] font-semibold text-ink">{state.user.handle}</span>
            <span className="block text-[10px] text-mute">View Profile</span>
          </span>
        </Link>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-surface/95 py-2 backdrop-blur-md lg:hidden">
      {NAV.slice(0, 5).map(item => {
        const active = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] ${active ? "text-indigo" : "text-mute"}`}>
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Global Quick Capture — capture a task from anywhere; AI categorizes by keyword for now. */
export function QuickCapture() {
  const { addTask } = useMomentum();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  function categorize(t: string): LifeAreaId {
    const s = t.toLowerCase();
    if (/(gym|run|workout|sleep|doctor)/.test(s)) return "health";
    if (/(study|read|learn|course|cat|exam)/.test(s)) return "learning";
    if (/(invoice|budget|pay|invest|money)/.test(s)) return "finance";
    if (/(clean|grocer|repair|home|laundry)/.test(s)) return "home";
    if (/(call|meet|friend|family|mom|dad)/.test(s)) return "relationships";
    if (/(meditat|journal|reflect)/.test(s)) return "mind";
    return "career";
  }

  function submit() {
    const t = text.trim();
    if (!t) return;
    addTask(t, categorize(t));
    setText("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-raise/60 px-3 py-2 text-[12px] font-medium text-mute transition hover:border-indigo/50 hover:text-ink"
      >
        ＋ Quick Capture
      </button>
      {open && (
        <div className="absolute bottom-12 left-0 w-64 rounded-xl border border-line bg-card p-3 shadow-card animate-rise">
          <input
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Capture a task, idea, reminder…"
            className="w-full rounded-lg border border-line bg-raise px-3 py-2 text-[12px] text-ink placeholder:text-dim focus:border-indigo focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-dim">AI files it under the right life area</span>
            <button onClick={submit} className="rounded-lg bg-indigo px-3 py-1 text-[11px] font-semibold text-white">Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter();
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-mute">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push("/focus")}
          className="flex items-center gap-2 rounded-full border border-line bg-raise/70 px-4 py-1.5 text-[12px] font-medium text-ink transition hover:border-indigo/50"
        >
          ◔ Focus Mode
        </button>
        <span className="grid h-8 w-8 place-items-center rounded-full border border-line bg-raise/70 text-[13px] text-mute">🔔</span>
        <span className="grid h-8 w-8 place-items-center rounded-full border border-line bg-raise/70 text-[13px] text-mute">⚙︎</span>
      </div>
    </header>
  );
}

export { AREA_TINT };
