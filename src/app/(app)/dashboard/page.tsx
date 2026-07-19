"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/Shell";
import { AREA_TINT, Card, CardHead, Check, Chip, GradientButton, ProgressBar, Ring, Sparkline } from "@/components/ui";
import { useMomentum } from "@/lib/store";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { state, toggleTask, bumpHabit } = useMomentum();
  const router = useRouter();

  const doneTasks = state.tasks.filter(t => t.status === "completed").length;
  const habitsDone = state.habits.filter(h => h.progress >= h.target).length;
  const goalPct = Math.min(100, Math.round((state.score / state.dailyGoal) * 100));
  const deepWorkMin = state.events.filter(e => e.kind === "deepwork")
    .reduce((m, e) => m + (toMin(e.end) - toMin(e.start)), 0) + 90;

  return (
    <div className="animate-rise">
      <TopBar title={`${greeting()}, ${state.user.name} 👋`} subtitle="Let's build momentum today." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* ── Momentum Score ─────────────────────────────── */}
        <Card className="xl:row-span-1">
          <CardHead title="Momentum Score" />
          <div className="flex items-center justify-between px-5">
            <div>
              <p className="text-[44px] font-extrabold leading-none tracking-tight text-ink">{state.score}</p>
              <p className="mt-2 text-[12px]">
                <span className={state.scoreDelta >= 0 ? "font-semibold text-mint" : "font-semibold text-coral"}>
                  {state.scoreDelta >= 0 ? "+" : ""}{state.scoreDelta}
                </span>{" "}
                <span className="text-mute">vs yesterday</span>
              </p>
              <span className="mt-3 inline-block rounded-lg border border-amber/30 bg-amber/10 px-2.5 py-1 text-[11px] font-semibold text-amber">
                Excellent Momentum 🔥
              </span>
            </div>
            <Ring value={state.score / state.dailyGoal} size={132} stroke={10} gradient>
              <span className="text-sm">👑</span>
              <span className="text-[10px] text-mute">Daily Goal</span>
              <span className="text-xl font-bold text-ink">{state.dailyGoal}</span>
              <span className="text-[11px] font-semibold text-indigo">{goalPct}%</span>
            </Ring>
          </div>
          <div className="px-3 pb-2 pt-1">
            <Sparkline points={state.scoreHistory.map(p => p.value)} />
            <div className="flex justify-between px-2 pb-2 text-[9px] text-dim">
              {state.scoreHistory.map(p => <span key={p.day}>{p.day}</span>)}
            </div>
          </div>
        </Card>

        {/* ── AI Daily Brief ─────────────────────────────── */}
        <Card>
          <CardHead icon={<span className="text-indigo">✦</span>} title="AI Daily Brief" action="View Full Brief" onAction={() => router.push("/coach")} />
          <div className="px-5 pb-5">
            <p className="bg-gradient-to-r from-azure to-violet bg-clip-text text-[15px] font-semibold text-transparent">
              {state.brief.headline}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-mute">{state.brief.summary}</p>
            <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-dim">Top Priorities</p>
            <ol className="space-y-2">
              {state.brief.priorities.map((p, i) => {
                const t = state.tasks.find(x => x.id === p.taskId);
                if (!t) return null;
                return (
                  <li key={p.taskId} className="flex items-center gap-3 rounded-xl border border-line bg-raise/50 px-3 py-2">
                    <span className="grid h-5 w-5 place-items-center rounded-md bg-line text-[10px] font-bold text-mute">{i + 1}</span>
                    <span className="flex-1 truncate text-[12px] font-medium text-ink">{t.title}</span>
                    <Chip label={cap(t.area)} tint={AREA_TINT[t.area]} />
                    <span className="text-[11px] text-dim">{p.hours}h</span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-[11px] text-mute">{state.brief.footer}</p>
          </div>
        </Card>

        {/* ── Calendar ───────────────────────────────────── */}
        <Card>
          <CardHead title="Calendar" action="View All" onAction={() => router.push("/planner")} />
          <div className="px-5 pb-5">
            <div className="mb-3 flex items-center justify-between text-[12px]">
              <span className="font-semibold text-ink">{todayLabel()}</span>
              <span className="rounded-md border border-line px-2 py-0.5 text-[10px] text-mute">Today</span>
            </div>
            <ul className="space-y-0">
              {state.events.map(e => (
                <li key={e.id} className="flex gap-3">
                  <span className="w-10 pt-0.5 text-right text-[10px] leading-4 text-dim">{e.start}<br />{e.end}</span>
                  <span className="relative flex flex-col items-center">
                    <span className="z-10 mt-1 h-2 w-2 rounded-full" style={{ background: e.color }} />
                    <span className="w-px flex-1 bg-line" />
                  </span>
                  <span className="pb-4 text-[12px] font-medium text-ink">{e.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* ── Life Areas ─────────────────────────────────── */}
        <Card>
          <CardHead title="Life Areas" action="View All" onAction={() => router.push("/life")} />
          <div className="grid grid-cols-4 gap-2 px-4 pb-4">
            {state.areas.slice(0, 8).map(a => (
              <Link key={a.id} href={`/life/${a.id}`}
                className="group rounded-xl border border-line bg-raise/40 p-2.5 text-center transition hover:border-indigo/40 hover:bg-raise">
                <span className="text-lg">{a.icon}</span>
                <span className="mt-1 block truncate text-[10px] font-medium text-mute group-hover:text-ink">{a.name}</span>
                <span className="block text-[11px] font-bold text-ink">{a.progress}%</span>
                <ProgressBar value={a.progress} tint={a.color} className="mt-1.5 h-1" />
              </Link>
            ))}
          </div>
        </Card>

        {/* ── Today's Mission ────────────────────────────── */}
        <Card className="flex flex-col">
          <CardHead icon={<span className="text-coral">◎</span>} title="Today's Mission" />
          <div className="flex flex-1 flex-col px-5 pb-5">
            <p className="text-[19px] font-semibold leading-snug text-ink">Make progress on what matters most.</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <Stat icon="🧠" label="Deep Work" value={fmtH(deepWorkMin)} />
              <Stat icon="☰" label="Tasks" value={`${doneTasks}/${state.tasks.length}`} />
              <Stat icon="✓" label="Habits" value={`${habitsDone}/${state.habits.length}`} tint="#22c55e" />
            </div>
            <GradientButton onClick={() => router.push("/focus")} className="mt-auto w-full">
              ▶ Start Focus Session
            </GradientButton>
          </div>
        </Card>

        {/* ── Today's Tasks ──────────────────────────────── */}
        <Card>
          <CardHead title="Today's Tasks" action="View All" onAction={() => router.push("/planner")} />
          <div className="px-5 pb-4">
            <p className="text-[11px] text-mute">{doneTasks} of {state.tasks.length} completed</p>
            <ProgressBar value={(doneTasks / Math.max(1, state.tasks.length)) * 100} tint="#22c55e" className="mt-1.5" />
            <ul className="mt-3 space-y-1">
              {state.tasks.map(t => (
                <li key={t.id}>
                  <button onClick={() => toggleTask(t.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-raise/60">
                    <Check checked={t.status === "completed"} />
                    <span className={`flex-1 truncate text-[12px] font-medium ${t.status === "completed" ? "text-dim line-through" : "text-ink"}`}>
                      {t.title}
                    </span>
                    <Chip label={cap(t.area)} tint={AREA_TINT[t.area]} />
                  </button>
                </li>
              ))}
            </ul>
            <Link href="/planner" className="mt-1 block px-2 text-[11px] text-dim transition hover:text-mute">＋ Add Task</Link>
          </div>
        </Card>

        {/* ── Habits ─────────────────────────────────────── */}
        <Card>
          <CardHead title="Habits" action="View All" onAction={() => router.push("/insights")} />
          <div className="grid grid-cols-6 gap-1 px-3 pb-4">
            {state.habits.map(h => {
              const done = h.progress >= h.target;
              return (
                <button key={h.id} onClick={() => bumpHabit(h.id)} title={`${h.title} — tap to log`}
                  className="group flex flex-col items-center gap-1 rounded-xl p-1.5 transition hover:bg-raise/60">
                  <Ring value={h.progress / h.target} size={46} stroke={4} tint={h.color}>
                    <span className="text-[13px]">{h.icon}</span>
                  </Ring>
                  <span className="text-[9px] font-medium text-mute group-hover:text-ink">{h.title}</span>
                  <span className={`text-[9px] font-semibold ${done ? "text-mint" : "text-dim"}`}>
                    {habitStatus(h.progress, h.target, h.unit)}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* ── Focus Timer ────────────────────────────────── */}
        <Card className="flex flex-col items-center justify-center py-6">
          <p className="self-start px-5 text-[13px] font-semibold text-ink">Focus Timer</p>
          <p className="mt-4 text-[52px] font-extrabold tabular-nums tracking-tight text-ink">25:00</p>
          <p className="text-[12px] text-mute">Deep Work Session</p>
          <GradientButton onClick={() => router.push("/focus")} className="mt-5 w-48">▶ Start</GradientButton>
          <button onClick={() => router.push("/planner")} className="mt-3 text-[11px] text-dim transition hover:text-mute">
            ☰ Choose Task
          </button>
        </Card>

        {/* ── Recent Achievements ────────────────────────── */}
        <Card>
          <CardHead title="Recent Achievements" action="View All" onAction={() => router.push("/insights")} />
          <ul className="space-y-2 px-5 pb-5">
            {state.achievements.map(a => (
              <li key={a.id} className="flex items-center gap-3 rounded-xl border border-line bg-raise/40 px-3 py-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg text-base" style={{ background: `${a.tint}22` }}>
                  {a.icon}
                </span>
                <span>
                  <span className="block text-[12px] font-semibold text-ink">{a.title}</span>
                  <span className="block text-[10px] text-mute">{a.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tint }: { icon: string; label: string; value: string; tint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-raise/50 px-2 py-2.5 text-center">
      <span className="text-sm" style={tint ? { color: tint } : undefined}>{icon}</span>
      <span className="mt-0.5 block text-[9px] text-dim">{label}</span>
      <span className="block text-[12px] font-bold text-ink">{value}</span>
    </div>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function toMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function fmtH(min: number) { return `${Math.floor(min / 60)}h ${min % 60 ? `${min % 60}m` : ""}`.trim(); }
function habitStatus(p: number, t: number, unit?: string) {
  if (p >= t) return "✓ Done";
  if (unit === "min") return `${Math.floor(p / 60)}h ${p % 60}m`;
  if (t > 1) return `${p} / ${t}`;
  return "—";
}
function todayLabel() {
  return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
