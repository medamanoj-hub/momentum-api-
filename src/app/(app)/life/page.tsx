"use client";

import Link from "next/link";
import { TopBar } from "@/components/Shell";
import { Card, ProgressBar } from "@/components/ui";
import { useMomentum } from "@/lib/store";

export default function LifePage() {
  const { state } = useMomentum();
  return (
    <div className="animate-rise">
      <TopBar title="Life" subtitle="Every important area of your life, in one place." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {state.areas.map(a => {
          const goals = state.goals.filter(g => g.area === a.id);
          const habits = state.habits.filter(h => h.area === a.id);
          const tasks = state.tasks.filter(t => t.area === a.id && t.status !== "completed");
          return (
            <Link key={a.id} href={`/life/${a.id}`}>
              <Card className="group h-full p-5 transition hover:border-indigo/40">
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl text-xl"
                    style={{ background: `${a.color}1c`, border: `1px solid ${a.color}35` }}>
                    {a.icon}
                  </span>
                  <span className="text-xl font-bold text-ink">{a.progress}%</span>
                </div>
                <h2 className="mt-3 text-[15px] font-semibold text-ink">{a.name}</h2>
                <ProgressBar value={a.progress} tint={a.color} className="mt-2" />
                <p className="mt-3 text-[11px] text-mute">
                  {goals.length} goal{goals.length !== 1 && "s"} · {habits.length} habit{habits.length !== 1 && "s"} · {tasks.length} open task{tasks.length !== 1 && "s"}
                </p>
                <span className="mt-2 inline-block text-[11px] font-medium text-dim transition group-hover:text-indigo">
                  Open area ›
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
