// Momentum API layer
// ------------------------------------------------------------------
// The Technical Architecture defines an API-first backend (NestJS) at:
//   /api/auth /tasks /goals /projects /habits /journal /calendar /analytics
//
// The UI never talks to storage directly — it goes through `api`.
// Phase 1 ships with a LocalAdapter (offline-first, localStorage) so the
// web app is fully interactive without a backend. When the API contracts
// arrive (doc pages 71–122), implement HttpAdapter with the same
// interface and flip ADAPTER — no UI changes required.
// ------------------------------------------------------------------

import { MomentumClient } from "./client";
import { seed } from "./seed";
import { SyncQueue } from "./sync";
import type { MomentumState } from "./types";

const STORAGE_KEY = "momentum.state.v1";

// ── Remote backend (API Specification v1) ─────────────────────────
// Set NEXT_PUBLIC_API_URL to enable server sync, e.g.
//   NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1   (dev)
//   NEXT_PUBLIC_API_URL=https://api.momentum.app/v1    (prod)
// Without it, the app runs fully offline against the LocalAdapter.
const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const remote: MomentumClient | null = API_URL ? new MomentumClient(API_URL) : null;
export const syncQueue: SyncQueue | null = remote ? new SyncQueue(remote) : null;

export interface MomentumAdapter {
  load(): Promise<MomentumState>;
  save(state: MomentumState): Promise<void>;
  reset(): Promise<MomentumState>;
}

class LocalAdapter implements MomentumAdapter {
  async load(): Promise<MomentumState> {
    if (typeof window === "undefined") return seed;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return seed;
      return { ...seed, ...(JSON.parse(raw) as MomentumState) };
    } catch {
      return seed;
    }
  }
  async save(state: MomentumState): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* offline-first: swallow quota errors, retry on next mutation */
    }
  }
  async reset(): Promise<MomentumState> {
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    return seed;
  }
}

// Skeleton for the real backend. Fill in once contracts land.
// class HttpAdapter implements MomentumAdapter { ... fetch("/api/tasks") ... }

export const api: MomentumAdapter = new LocalAdapter();

// ------------------------------------------------------------------
// AI Coach service (POST /ai/chat — rate-limited at 20 req/min)
// Remote-first: when a backend is configured, chat goes through the AI
// Service (context builder → prompt engine → LLM). If the server is
// unreachable or returns AI_PROVIDER_UNAVAILABLE, the local heuristic
// keeps the coach useful offline.
// ------------------------------------------------------------------
export async function askCoach(
  input: string,
  state: MomentumState
): Promise<{ text: string; actions: string[] }> {
  if (remote) {
    try {
      const { reply } = await remote.ai.chat(input);
      return { text: reply, actions: ["Start Focus Session", "Open Planner"] };
    } catch {
      /* fall through to offline coach */
    }
  }
  return coachReply(input, state);
}
export function coachReply(input: string, state: MomentumState): { text: string; actions: string[] } {
  const q = input.toLowerCase();
  const open = state.tasks.filter(t => t.status !== "completed" && t.status !== "skipped");
  const topTask = open.sort((a, b) => a.priority - b.priority)[0];
  const habitsDone = state.habits.filter(h => h.progress >= h.target).length;

  if (q.includes("distract") || q.includes("focus")) {
    return {
      text: `Let's narrow the field. Your highest-impact open task is "${topTask?.title ?? "planning tomorrow"}". One 25-minute focus session on it will restore momentum faster than anything else.`,
      actions: ["Start Focus Session", "Reschedule Tasks", "Take Break"]
    };
  }
  if (q.includes("tired") || q.includes("sleep") || q.includes("energy")) {
    return {
      text: `Your Sleep 8h habit logged 7h 15m — a little under target. Protect tonight's wind-down, and put your hardest block in the morning where your energy peaks.`,
      actions: ["Start Focus Session", "Reflect"]
    };
  }
  if (q.includes("plan") || q.includes("today") || q.includes("next")) {
    return {
      text: `You're at ${state.score} of ${state.dailyGoal} points with ${open.length} tasks open. Next best move: "${topTask?.title}". After that, ${habitsDone}/${state.habits.length} habits are done — close out No Sugar and Sleep to finish strong.`,
      actions: ["Start Focus Session", "Open Planner"]
    };
  }
  if (q.includes("goal")) {
    const g = state.goals[0];
    return {
      text: `"${g.title}" is at ${g.progress}%. The next milestone is "${g.milestones.find(m => !m.done)?.title}". Small daily reps on this compound — one focused session today keeps the streak alive.`,
      actions: ["Open Goals", "Start Focus Session"]
    };
  }
  return {
    text: `Based on your patterns, I recommend scheduling your toughest tasks in the morning. You're most productive between 9 AM – 12 PM. Your next best move right now is "${topTask?.title ?? "an evening reflection"}".`,
    actions: ["Start Focus Session", "Open Planner", "Reflect"]
  };
}
