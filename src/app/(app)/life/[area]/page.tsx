"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { TopBar } from "@/components/Shell";
import { AREA_TINT, Card, CardHead, Check, Chip, GradientButton, ProgressBar, Ring } from "@/components/ui";
import { useMomentum } from "@/lib/store";
import type { LifeAreaId } from "@/lib/types";

const TABS = ["Overview", "Goals", "Habits", "Journal", "Analytics"] as const;

export default function AreaPage() {
  const params = useParams<{ area: string }>();
  const router = useRouter();
  const { state, toggleTask, bumpHabit, addJournal } = useMomentum();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [entry, setEntry] = useState("");

  const area = state.areas.find(a => a.id === params.area);
  if (!area) {
    return (
      <div className="animate-rise">
        <TopBar title="Life area not found" subtitle="Pick an area from the Life section." />
        <GradientButton onClick={() => router.push("/life")}>Back to Life</GradientButton>
      </div>
    );
  }

  const id = area.id as LifeAreaId;
  const goals = state.goals.filter(g => g.area === id);
  const habits = state.habits.filter(h => h.area === id);
  const tasks = state.tasks.filter(t => t.area === id);
  const journal = state.journal;

  return (
    <div className="animate-rise">
      <TopBar title={`${area.icon} ${area.name}`} subtitle={`${area.progress}% satisfaction · ${goals.length} goals · ${habits.length} habits`} />

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface/70 p-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-[12px] font-medium transition ${
              tab === t ? "bg-gradient-to-r from-indigo/30 to-violet/20 text-ink" : "text-mute hover:text-ink"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="flex flex-col items-center justify-center p-6">
            <Ring value={area.progress / 100} size={140} stroke={10} tint={area.color}>
              <span className="text-3xl font-extrabold text-ink">{area.progress}%</span>
              <span className="text-[10px] text-mute">progress</span>
            </Ring>
            <p className="mt-4 text-center text-[12px] text-mute">
              {area.name} contributes to your Momentum Score through its goals, habits, and tasks.
            </p>
          </Card>
          <Card className="lg:col-span-2">
            <CardHead title="Open Tasks" />
            <ul className="space-y-1 px-5 pb-5">
              {tasks.length === 0 && (
                <li className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-[12px] text-mute">
                  You're all caught up here. Capture a task or plan tomorrow.
                </li>
              )}
              {tasks.map(t => (
                <li key={t.id}>
                  <button onClick={() => toggleTask(t.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-raise/60">
                    <Check checked={t.status === "completed"} />
                    <span className={`flex-1 text-[13px] ${t.status === "completed" ? "text-dim line-through" : "text-ink"}`}>{t.title}</span>
                    <span className="text-[11px] text-dim">+{t.points} pts</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === "Goals" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {goals.length === 0 && (
            <Card className="p-8 text-center text-[13px] text-mute lg:col-span-2">
              Create your first {area.name.toLowerCase()} goal to begin building momentum.
            </Card>
          )}
          {goals.map(g => (
            <Card key={g.id} className="p-5">
              <div className="flex items-start justify-between">
                <h3 className="text-[15px] font-semibold text-ink">{g.title}</h3>
                <Chip label={`${g.progress}%`} tint={AREA_TINT[g.area]} />
              </div>
              <ProgressBar value={g.progress} tint={AREA_TINT[g.area]} className="mt-3" />
              {g.deadline && <p className="mt-2 text-[11px] text-dim">Deadline · {g.deadline}</p>}
              <p className="mb-1.5 mt-4 text-[11px] font-semibold uppercase tracking-wider text-dim">Milestones</p>
              <ul className="space-y-1.5">
                {g.milestones.map((m, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-[12px]">
                    <Check checked={m.done} />
                    <span className={m.done ? "text-dim line-through" : "text-ink"}>{m.title}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {tab === "Habits" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {habits.length === 0 && (
            <Card className="p-8 text-center text-[13px] text-mute sm:col-span-2 lg:col-span-3">
              Start with one habit. Consistency begins small.
            </Card>
          )}
          {habits.map(h => (
            <Card key={h.id} className="flex items-center gap-4 p-4">
              <button onClick={() => bumpHabit(h.id)} title="Log habit">
                <Ring value={h.progress / h.target} size={64} stroke={5} tint={h.color}>
                  <span className="text-lg">{h.icon}</span>
                </Ring>
              </button>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">{h.title}</p>
                <p className="text-[11px] text-mute">🔥 {h.streak}-day streak · best {h.bestStreak}</p>
                <p className="text-[11px] text-dim">+{h.points} pts on completion</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "Journal" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-[13px] font-semibold text-ink">New reflection</h3>
            <textarea
              value={entry}
              onChange={e => setEntry(e.target.value)}
              rows={5}
              placeholder={`What moved ${area.name.toLowerCase()} forward today?`}
              className="mt-3 w-full rounded-xl border border-line bg-raise px-3 py-2.5 text-[13px] text-ink placeholder:text-dim focus:border-indigo focus:outline-none"
            />
            <GradientButton
              className="mt-3"
              onClick={() => {
                if (!entry.trim()) return;
                addJournal({ date: new Date().toISOString().slice(0, 10), type: "reflection", text: entry.trim() });
                setEntry("");
              }}
            >
              Save entry · +5 pts
            </GradientButton>
          </Card>
          <Card className="p-5">
            <h3 className="text-[13px] font-semibold text-ink">Recent entries</h3>
            <ul className="mt-3 space-y-3">
              {journal.length === 0 && <li className="text-[12px] text-mute">Reflection helps you grow. Write your first entry.</li>}
              {journal.map(j => (
                <li key={j.id} className="rounded-xl border border-line bg-raise/40 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-dim">{j.date} · {j.type}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink">{j.text}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === "Analytics" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Metric label="Area progress" value={`${area.progress}%`} />
          <Metric label="Open tasks" value={String(tasks.filter(t => t.status !== "completed").length)} />
          <Metric label="Habit completion today" value={`${habits.filter(h => h.progress >= h.target).length}/${habits.length || 0}`} />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5 text-center">
      <p className="text-2xl font-extrabold text-ink">{value}</p>
      <p className="mt-1 text-[11px] text-mute">{label}</p>
    </Card>
  );
}
