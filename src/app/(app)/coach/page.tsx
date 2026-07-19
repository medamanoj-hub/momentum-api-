"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/Shell";
import { AREA_TINT, Card, CardHead, Chip } from "@/components/ui";
import { askCoach } from "@/lib/api";
import { useMomentum } from "@/lib/store";
import type { ChatMessage } from "@/lib/types";

export default function CoachPage() {
  const { state } = useMomentum();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      role: "coach",
      text: `Good to see you, ${state.user.name}. You're at ${state.score} of ${state.dailyGoal} points today. Ask me anything — planning, focus, energy, or your goals.`,
      actions: ["Plan my day", "I'm feeling distracted", "Review my goals"]
    }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function send(text: string) {
    const t = text.trim();
    if (!t || typing) return;
    setMessages(m => [...m, { id: `u${Date.now()}`, role: "user", text: t }]);
    setInput("");
    setTyping(true);
    // POST /ai/chat when a backend is configured; offline heuristic otherwise.
    const minDelay = new Promise(res => setTimeout(res, 600));
    Promise.all([askCoach(t, state), minDelay]).then(([r]) => {
      setMessages(m => [...m, { id: `c${Date.now()}`, role: "coach", text: r.text, actions: r.actions }]);
      setTyping(false);
    });
  }

  function runAction(a: string) {
    if (a.includes("Focus")) return router.push("/focus");
    if (a.includes("Planner")) return router.push("/planner");
    if (a.includes("Goals")) return router.push("/life");
    send(a);
  }

  return (
    <div className="animate-rise">
      <TopBar title="AI Coach" subtitle="Strategic, calm, honest — the decision always stays with you." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHead icon={<span className="text-indigo">✦</span>} title="Daily Brief" />
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
                  <li key={p.taskId} className="flex items-center gap-2.5 rounded-xl border border-line bg-raise/50 px-3 py-2">
                    <span className="grid h-5 w-5 place-items-center rounded-md bg-line text-[10px] font-bold text-mute">{i + 1}</span>
                    <span className="flex-1 truncate text-[12px] font-medium text-ink">{t.title}</span>
                    <Chip label={t.area.charAt(0).toUpperCase() + t.area.slice(1)} tint={AREA_TINT[t.area]} />
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-[11px] text-mute">{state.brief.footer}</p>
          </div>
        </Card>

        <Card className="flex h-[600px] flex-col lg:col-span-2">
          <CardHead icon={<span className="text-indigo">◎</span>} title="Coach Chat" />
          <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-3">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed animate-rise ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-indigo to-violet text-white"
                    : "border border-line bg-raise/60 text-ink"
                }`}>
                  {m.text}
                  {m.actions && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {m.actions.map(a => (
                        <button key={a} onClick={() => runAction(a)}
                          className="rounded-lg border border-indigo/40 bg-indigo/15 px-2.5 py-1 text-[11px] font-medium text-indigo transition hover:bg-indigo/25">
                          {a}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-line bg-raise/60 px-4 py-2.5 text-[13px] text-mute animate-pulseSoft">
                  Coach is thinking…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="border-t border-line p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send(input)}
                placeholder="Ask AI Coach anything…"
                className="flex-1 rounded-xl border border-line bg-raise px-4 py-2.5 text-[13px] text-ink placeholder:text-dim focus:border-indigo focus:outline-none"
              />
              <button onClick={() => send(input)}
                className="rounded-xl bg-gradient-to-r from-indigo to-violet px-4 text-sm font-semibold text-white transition hover:brightness-110">
                ↑
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
