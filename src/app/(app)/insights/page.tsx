"use client";

import { TopBar } from "@/components/Shell";
import { Card, CardHead, ProgressBar, Ring, Sparkline } from "@/components/ui";
import { useMomentum } from "@/lib/store";

export default function InsightsPage() {
  const { state } = useMomentum();

  const habitsDone = state.habits.filter(h => h.progress >= h.target).length;
  const habitPct = Math.round((habitsDone / Math.max(1, state.habits.length)) * 100);
  const tasksDone = state.tasks.filter(t => t.status === "completed").length;
  const taskPct = Math.round((tasksDone / Math.max(1, state.tasks.length)) * 100);
  const avgGoal = Math.round(state.goals.reduce((s, g) => s + g.progress, 0) / Math.max(1, state.goals.length));
  const balance = Math.round(state.areas.reduce((s, a) => s + a.progress, 0) / state.areas.length);

  return (
    <div className="animate-rise">
      <TopBar title="Insights" subtitle="Meaningful progress, not vanity metrics." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Momentum Score" value={String(state.score)} sub={`${state.scoreDelta >= 0 ? "+" : ""}${state.scoreDelta} today`} />
        <Kpi label="Habit Completion" value={`${habitPct}%`} sub={`${habitsDone}/${state.habits.length} today`} />
        <Kpi label="Task Completion" value={`${taskPct}%`} sub={`${tasksDone}/${state.tasks.length} today`} />
        <Kpi label="Goal Progress" value={`${avgGoal}%`} sub={`${state.goals.length} active goals`} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHead title="Momentum Score — This Week" />
          <div className="px-4 pb-2">
            <Sparkline points={state.scoreHistory.map(p => p.value)} height={150} />
            <div className="flex justify-between px-2 pb-3 text-[10px] text-dim">
              {state.scoreHistory.map(p => <span key={p.day}>{p.day}</span>)}
            </div>
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center p-6">
          <p className="self-start text-[13px] font-semibold text-ink">Life Balance</p>
          <Ring value={balance / 100} size={130} stroke={10} gradient>
            <span className="text-3xl font-extrabold text-ink">{balance}</span>
            <span className="text-[10px] text-mute">balance index</span>
          </Ring>
          <p className="mt-3 text-center text-[11px] text-mute">Average progress across all {state.areas.length} life areas.</p>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHead title="Life Area Breakdown" />
          <ul className="space-y-3 px-5 pb-5">
            {state.areas.map(a => (
              <li key={a.id} className="flex items-center gap-3">
                <span className="w-6 text-center">{a.icon}</span>
                <span className="w-28 text-[12px] font-medium text-ink">{a.name}</span>
                <ProgressBar value={a.progress} tint={a.color} className="flex-1" />
                <span className="w-9 text-right text-[12px] font-semibold text-mute">{a.progress}%</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHead title="Habit Streaks" />
            <ul className="space-y-2 px-5 pb-5">
              {[...state.habits].sort((a, b) => b.streak - a.streak).map(h => (
                <li key={h.id} className="flex items-center gap-3 text-[12px]">
                  <span>{h.icon}</span>
                  <span className="flex-1 font-medium text-ink">{h.title}</span>
                  <span className="text-mute">🔥 {h.streak}d</span>
                  <span className="text-dim">best {h.bestStreak}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHead title="Achievements" />
            <ul className="grid grid-cols-2 gap-2 px-5 pb-5">
              {state.achievements.map(a => (
                <li key={a.id} className="rounded-xl border border-line bg-raise/40 p-3 text-center">
                  <span className="text-lg">{a.icon}</span>
                  <span className="mt-1 block text-[11px] font-semibold text-ink">{a.title}</span>
                  <span className="block text-[9px] text-mute">{a.detail}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] text-mute">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] text-dim">{sub}</p>
    </Card>
  );
}
