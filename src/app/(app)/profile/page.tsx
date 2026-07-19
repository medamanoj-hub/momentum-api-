"use client";

import { useState } from "react";
import { TopBar } from "@/components/Shell";
import { Card, CardHead, GradientButton, Ring } from "@/components/ui";
import { remote } from "@/lib/api";
import { useMomentum } from "@/lib/store";

export default function ProfilePage() {
  const { state, setName, resetAll } = useMomentum();
  const [name, setLocalName] = useState(state.user.name);
  const [saved, setSaved] = useState(false);

  const level = Math.floor(state.score / 100);

  return (
    <div className="animate-rise">
      <TopBar title="Profile" subtitle="Personalization, preferences, and your Momentum identity." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center p-6">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-indigo to-violet text-3xl font-black text-white shadow-glow">
            {state.user.name.charAt(0)}
          </span>
          <p className="mt-3 text-[16px] font-bold text-ink">{state.user.handle}</p>
          <p className="text-[12px] text-mute">Momentum Level {level}</p>
          <div className="mt-5">
            <Ring value={(state.score % 100) / 100} size={110} stroke={8} gradient>
              <span className="text-xl font-extrabold text-ink">{state.score}</span>
              <span className="text-[9px] text-mute">to level {level + 1}</span>
            </Ring>
          </div>
          <div className="mt-5 flex gap-2">
            {state.achievements.slice(0, 4).map(a => (
              <span key={a.id} title={`${a.title} — ${a.detail}`}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-raise/50 text-base">
                {a.icon}
              </span>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHead title="Account" />
          <div className="px-5 pb-5">
            <label className="text-[11px] text-dim">What should Momentum call you?</label>
            <div className="mt-1.5 flex gap-2">
              <input
                value={name}
                onChange={e => { setLocalName(e.target.value); setSaved(false); }}
                className="flex-1 rounded-xl border border-line bg-raise px-4 py-2.5 text-[13px] text-ink focus:border-indigo focus:outline-none"
              />
              <GradientButton onClick={() => { if (name.trim()) { setName(name.trim()); setSaved(true); } }}>
                {saved ? "Saved ✓" : "Save changes"}
              </GradientButton>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Setting title="Appearance" detail="Dark · matches system" />
              <Setting title="AI Coach" detail="Strategic & encouraging" />
              <Setting title="Notifications" detail="Minimal — habits & planning only" />
              <Setting title="Privacy" detail="Data stays on this device (offline-first)" />
              <Setting title="Integrations" detail="Apple / Google Calendar — coming with backend" />
              <Setting title="Subscription" detail="Phase 1 preview" />
            </div>

            {remote?.authenticated && (
              <div className="mt-6 rounded-xl border border-line bg-raise/40 p-4">
                <p className="text-[12px] font-semibold text-ink">Signed in</p>
                <p className="mt-0.5 text-[11px] text-mute">Your data is synced to your Momentum account.</p>
                <button
                  onClick={async () => {
                    try { await remote.auth.logout(); } catch { remote.setTokens(null); }
                    window.location.href = "/";
                  }}
                  className="mt-3 rounded-lg border border-line px-4 py-1.5 text-[12px] font-semibold text-mute transition hover:text-ink"
                >
                  Sign out
                </button>
              </div>
            )}

            <div className="mt-6 rounded-xl border border-coral/25 bg-coral/5 p-4">
              <p className="text-[12px] font-semibold text-ink">Reset demo data</p>
              <p className="mt-0.5 text-[11px] text-mute">Restores the seeded state (score, tasks, habits, journal). This can't be undone.</p>
              <button onClick={resetAll}
                className="mt-3 rounded-lg border border-coral/40 px-4 py-1.5 text-[12px] font-semibold text-coral transition hover:bg-coral/10">
                Reset all data
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Setting({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-line bg-raise/40 px-4 py-3">
      <p className="text-[12px] font-semibold text-ink">{title}</p>
      <p className="mt-0.5 text-[11px] text-mute">{detail}</p>
    </div>
  );
}
