"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Shell";
import { Card, GradientButton, ProgressBar } from "@/components/ui";
import { useMomentum } from "@/lib/store";

const GOALS = ["Get Fit", "Build Wealth", "Learn Programming", "Crack CAT", "Read More", "Start Business"];
const AREAS = ["Career", "Health", "Finance", "Relationships", "Learning", "Mind"];
const HABITS = ["Gym", "Reading", "Meditation", "Journaling", "Running"];

export default function Onboarding() {
  const router = useRouter();
  const { setName } = useMomentum();
  const [step, setStep] = useState(0);
  const [name, setLocalName] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [habits, setHabits] = useState<string[]>([]);
  const [wake, setWake] = useState("06:30");
  const [sleep, setSleep] = useState("22:30");

  const total = 6;
  const canNext =
    (step === 0 && name.trim().length > 0) ||
    (step === 1 && goals.length > 0) ||
    (step === 2) || (step === 3) || (step === 4) || (step === 5);

  function next() {
    if (step === total - 1) {
      setName(name.trim() || "Friend");
      router.push("/dashboard");
      return;
    }
    setStep(s => s + 1);
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md animate-rise">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <span className="text-[11px] text-dim">Step {step + 1} of {total}</span>
        </div>
        <ProgressBar value={((step + 1) / total) * 100} className="mb-5" />
        <Card className="p-6">
          {step === 0 && (
            <>
              <h1 className="text-[18px] font-bold text-ink">Welcome 👋</h1>
              <p className="mt-1 text-[12px] text-mute">What should Momentum call you?</p>
              <input
                autoFocus
                value={name}
                onChange={e => setLocalName(e.target.value)}
                placeholder="Your name"
                className="mt-4 w-full rounded-xl border border-line bg-raise px-4 py-2.5 text-[13px] text-ink placeholder:text-dim focus:border-indigo focus:outline-none"
              />
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-[18px] font-bold text-ink">Choose your goals</h1>
              <p className="mt-1 text-[12px] text-mute">Pick what you want to build momentum toward.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {GOALS.map(g => (
                  <Toggle key={g} active={goals.includes(g)} onClick={() =>
                    setGoals(x => x.includes(g) ? x.filter(y => y !== g) : [...x, g])
                  }>{g}</Toggle>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-[18px] font-bold text-ink">Rate your life areas</h1>
              <p className="mt-1 text-[12px] text-mute">How satisfied are you today? Honest beats perfect.</p>
              <ul className="mt-4 space-y-3">
                {AREAS.map(a => (
                  <li key={a} className="flex items-center justify-between">
                    <span className="text-[13px] text-ink">{a}</span>
                    <span className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setRatings(r => ({ ...r, [a]: n }))}
                          className={`text-[16px] transition ${((ratings[a] ?? 0) >= n) ? "text-amber" : "text-line"}`}>
                          ★
                        </button>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-[18px] font-bold text-ink">Choose habits</h1>
              <p className="mt-1 text-[12px] text-mute">Consistency begins small — start with a few.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {HABITS.map(h => (
                  <Toggle key={h} active={habits.includes(h)} onClick={() =>
                    setHabits(x => x.includes(h) ? x.filter(y => y !== h) : [...x, h])
                  }>{h}</Toggle>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="text-[18px] font-bold text-ink">Your daily rhythm</h1>
              <p className="mt-1 text-[12px] text-mute">Momentum plans around your real schedule.</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="text-[11px] text-dim">Wake-up time
                  <input type="time" value={wake} onChange={e => setWake(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-raise px-3 py-2 text-[13px] text-ink focus:border-indigo focus:outline-none" />
                </label>
                <label className="text-[11px] text-dim">Sleep time
                  <input type="time" value={sleep} onChange={e => setSleep(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-raise px-3 py-2 text-[13px] text-ink focus:border-indigo focus:outline-none" />
                </label>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h1 className="text-[18px] font-bold text-ink">Your Momentum plan ✦</h1>
              <div className="mt-4 space-y-2 text-[13px] text-ink">
                <p><span className="text-mute">Your priorities:</span> {goals.slice(0, 3).join(", ") || "Career, Health, Learning"}</p>
                <p><span className="text-mute">First habits:</span> {habits.join(", ") || "Start with one — consistency begins small"}</p>
                <p><span className="text-mute">Your first mission:</span> Build consistency.</p>
                <p><span className="text-mute">Estimated Momentum Score:</span> <span className="font-bold text-indigo">650</span></p>
              </div>
            </>
          )}

          <GradientButton onClick={next} className={`mt-6 w-full ${!canNext ? "pointer-events-none opacity-40" : ""}`}>
            {step === total - 1 ? "Enter Momentum →" : "Continue"}
          </GradientButton>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="mt-3 w-full text-[12px] text-dim transition hover:text-mute">
              ← Back
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`rounded-xl border px-3.5 py-2 text-[12px] font-medium transition ${
        active ? "border-indigo bg-indigo/20 text-indigo" : "border-line bg-raise text-mute hover:text-ink"
      }`}>
      {children}
    </button>
  );
}
