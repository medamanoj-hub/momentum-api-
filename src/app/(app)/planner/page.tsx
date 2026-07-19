"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/Shell";
import { AREA_TINT, Card, CardHead, Check, Chip, GradientButton, ProgressBar } from "@/components/ui";
import { useMomentum } from "@/lib/store";
import type { LifeAreaId } from "@/lib/types";

const HOUR_H = 52; // px per hour
const DAY_START = 8, DAY_END = 22;

export default function Planner() {
  const { state, toggleTask, addTask } = useMomentum();
  const [title, setTitle] = useState("");
  const [area, setArea] = useState<LifeAreaId>("career");

  const done = state.tasks.filter(t => t.status === "completed").length;

  return (
    <div className="animate-rise">
      <TopBar title="Planner" subtitle="Convert goals into an executable day." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* ── Day timeline ─────────────────────────────── */}
        <Card className="lg:col-span-3">
          <CardHead title={`Today · ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`} />
          <div className="relative mx-5 mb-5 overflow-hidden rounded-xl border border-line bg-surface/60"
            style={{ height: (DAY_END - DAY_START) * HOUR_H }}>
            {Array.from({ length: DAY_END - DAY_START }, (_, i) => {
              const hr = DAY_START + i;
              return (
                <div key={hr} className="absolute inset-x-0 border-t border-line/60" style={{ top: i * HOUR_H }}>
                  <span className="absolute -top-2 left-2 text-[9px] text-dim">{String(hr).padStart(2, "0")}:00</span>
                </div>
              );
            })}
            {state.events.map(e => {
              const top = (toMin(e.start) - DAY_START * 60) / 60 * HOUR_H;
              const h = Math.max(26, (toMin(e.end) - toMin(e.start)) / 60 * HOUR_H - 4);
              return (
                <div key={e.id}
                  className="absolute left-14 right-3 overflow-hidden rounded-lg border px-3 py-1.5"
                  style={{ top, height: h, background: `${e.color}18`, borderColor: `${e.color}55` }}>
                  <p className="truncate text-[11px] font-semibold" style={{ color: e.color }}>{e.title}</p>
                  <p className="text-[9px] text-mute">{e.start}–{e.end}</p>
                </div>
              );
            })}
            <NowLine />
          </div>
        </Card>

        {/* ── Task manager ─────────────────────────────── */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHead title="Add Task" />
            <div className="px-5 pb-5">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
                placeholder="What will move you forward?"
                className="w-full rounded-xl border border-line bg-raise px-3 py-2.5 text-[13px] text-ink placeholder:text-dim focus:border-indigo focus:outline-none"
              />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {state.areas.map(a => (
                  <button key={a.id} onClick={() => setArea(a.id)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                      area === a.id ? "text-ink" : "border-line text-mute hover:text-ink"
                    }`}
                    style={area === a.id ? { borderColor: a.color, background: `${a.color}20`, color: a.color } : undefined}>
                    {a.icon} {a.name}
                  </button>
                ))}
              </div>
              <GradientButton onClick={submit} className="mt-4 w-full">Add to today</GradientButton>
            </div>
          </Card>

          <Card>
            <CardHead title="Today's Tasks" />
            <div className="px-5 pb-5">
              <p className="text-[11px] text-mute">{done} of {state.tasks.length} completed</p>
              <ProgressBar value={(done / Math.max(1, state.tasks.length)) * 100} tint="#22c55e" className="mt-1.5" />
              <ul className="mt-3 space-y-1">
                {state.tasks.length === 0 && (
                  <li className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-[12px] text-mute">
                    No tasks for today. Plan tomorrow or enjoy your free time.
                  </li>
                )}
                {state.tasks.map(t => (
                  <li key={t.id}>
                    <button onClick={() => toggleTask(t.id)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-raise/60">
                      <Check checked={t.status === "completed"} />
                      <span className={`flex-1 truncate text-[12px] font-medium ${t.status === "completed" ? "text-dim line-through" : "text-ink"}`}>
                        {t.title}
                      </span>
                      {t.estimateMin && <span className="text-[10px] text-dim">{t.estimateMin}m</span>}
                      <Chip label={t.area.charAt(0).toUpperCase() + t.area.slice(1)} tint={AREA_TINT[t.area]} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  function submit() {
    const t = title.trim();
    if (!t) return;
    addTask(t, area);
    setTitle("");
  }
}

function NowLine() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  if (!now) return null;
  const min = now.getHours() * 60 + now.getMinutes();
  if (min < DAY_START * 60 || min > DAY_END * 60) return null;
  const top = (min - DAY_START * 60) / 60 * HOUR_H;
  return (
    <div className="absolute inset-x-0 z-10" style={{ top }}>
      <div className="ml-12 h-px bg-coral shadow-[0_0_8px_rgba(239,68,68,.8)]" />
      <span className="absolute -top-1 left-9 h-2 w-2 rounded-full bg-coral" />
    </div>
  );
}

function toMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
