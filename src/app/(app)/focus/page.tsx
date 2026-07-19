"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, GradientButton, Ring } from "@/components/ui";
import { useMomentum } from "@/lib/store";

const MODES = [25, 45, 60, 90];

export default function FocusPage() {
  const { state, completeFocusSession } = useMomentum();
  const router = useRouter();
  const [mode, setMode] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(state.tasks.find(t => t.status !== "completed")?.id ?? null);
  const [done, setDone] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      setLeft(l => {
        if (l <= 1) {
          clearInterval(tick.current!);
          setRunning(false);
          setDone(true);
          completeFocusSession(mode);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => { if (tick.current) clearInterval(tick.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function pick(m: number) {
    setMode(m);
    setLeft(m * 60);
    setRunning(false);
    setDone(false);
  }

  const task = state.tasks.find(t => t.id === taskId);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center animate-rise">
      <button onClick={() => router.back()} className="mb-6 self-start text-[12px] text-mute transition hover:text-ink">
        ← Exit Focus Mode
      </button>

      <Card className="w-full p-8 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-dim">Focus Mode</p>

        <div className="mt-6 flex justify-center">
          <Ring value={1 - left / (mode * 60)} size={230} stroke={12} gradient>
            <span className="text-[54px] font-extrabold tabular-nums tracking-tight text-ink">{mm}:{ss}</span>
            <span className="text-[12px] text-mute">{done ? "Session complete 🎉" : "Deep Work Session"}</span>
          </Ring>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {MODES.map(m => (
            <button key={m} onClick={() => pick(m)}
              className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition ${
                mode === m ? "border-indigo bg-indigo/20 text-indigo" : "border-line text-mute hover:text-ink"
              }`}>
              {m} min
            </button>
          ))}
        </div>

        <div className="mt-5">
          <label className="text-[11px] text-dim">Current task</label>
          <select
            value={taskId ?? ""}
            onChange={e => setTaskId(e.target.value || null)}
            className="mt-1.5 w-full rounded-xl border border-line bg-raise px-3 py-2.5 text-[13px] text-ink focus:border-indigo focus:outline-none"
          >
            <option value="">— No task, just focus —</option>
            {state.tasks.filter(t => t.status !== "completed").map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        {done ? (
          <div className="mt-6 rounded-xl border border-mint/30 bg-mint/10 p-4 text-[13px] text-mint">
            +{Math.max(5, Math.round(mode / 5) * 4)} Momentum points earned.
            {task && <> Mark "{task.title}" complete from the Planner if you finished it.</>}
          </div>
        ) : (
          <div className="mt-7 flex justify-center gap-3">
            <GradientButton onClick={() => setRunning(r => !r)} className="w-40">
              {running ? "❚❚ Pause" : "▶ Start"}
            </GradientButton>
            <button onClick={() => pick(mode)}
              className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-mute transition hover:text-ink">
              Reset
            </button>
          </div>
        )}
      </Card>

      <p className="mt-4 text-[11px] text-dim">Completing a session updates your Momentum Score.</p>
    </div>
  );
}
