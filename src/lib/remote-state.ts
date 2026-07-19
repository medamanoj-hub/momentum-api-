// Remote state loader — when the user is signed in against the backend,
// this assembles MomentumState from the v1 API instead of localStorage.
// Every section is fetched defensively: if one call fails, the rest of
// the dashboard still renders (offline-first spirit, server-backed).
import { remote } from "./api";
import type { GoalDto, HabitDto, TaskDto } from "./client";
import { seed } from "./seed";
import type { CalendarEvent, Goal, Habit, LifeArea, LifeAreaId, MomentumState, Task } from "./types";

const AREA_META: Record<LifeAreaId, { icon: string; color: string }> = {
  career: { icon: "💼", color: "#8b5cf6" },
  health: { icon: "❤️", color: "#22c55e" },
  learning: { icon: "📘", color: "#3b82f6" },
  finance: { icon: "💰", color: "#f59e0b" },
  relationships: { icon: "👥", color: "#ec4899" },
  mind: { icon: "🧠", color: "#06b6d4" },
  home: { icon: "🏠", color: "#f97316" },
  purpose: { icon: "⭐", color: "#a78bfa" },
  hobbies: { icon: "🎨", color: "#34d399" }
};

function toAreaId(name?: string): LifeAreaId {
  const n = (name ?? "").toLowerCase();
  return (Object.keys(AREA_META) as LifeAreaId[]).find(k => k === n) ?? "career";
}

/** Keyword fallback when a task has no project→goal→area chain. */
function guessArea(title: string): LifeAreaId {
  const s = title.toLowerCase();
  if (/(gym|run|workout|sleep|doctor|sugar)/.test(s)) return "health";
  if (/(study|read|learn|course|cat|exam|quant)/.test(s)) return "learning";
  if (/(invoice|budget|pay|invest|money)/.test(s)) return "finance";
  if (/(clean|grocer|repair|home|laundry)/.test(s)) return "home";
  if (/(call|meet friend|family|mom|dad)/.test(s)) return "relationships";
  if (/(meditat|journal|reflect)/.test(s)) return "mind";
  return "career";
}

function habitIcon(title: string): string {
  const s = title.toLowerCase();
  if (/(workout|gym|run)/.test(s)) return "🏃";
  if (/meditat/.test(s)) return "🧘";
  if (/read/.test(s)) return "📖";
  if (/journal|write/.test(s)) return "✍️";
  if (/sleep/.test(s)) return "🌙";
  if (/sugar|no /.test(s)) return "🚫";
  if (/water|drink/.test(s)) return "💧";
  if (/walk/.test(s)) return "🚶";
  return "✅";
}

function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try { return await p; } catch { return fallback; }
}

export async function loadRemoteState(): Promise<MomentumState | null> {
  if (!remote?.authenticated) return null;

  // users/me is the gatekeeper: if it fails, stay in local mode.
  let me: { name: string };
  try { me = await remote.users.me(); } catch { return null; }

  const [areasDto, tasksDto, habitsDto, goalsDto, eventsDto, current, history, journalDto] = await Promise.all([
    safe(remote.lifeAreas.list(), []),
    safe(remote.tasks.list(), [] as TaskDto[]),
    safe(remote.habits.list(), [] as HabitDto[]),
    safe(remote.goals.list(), [] as GoalDto[]),
    safe(remote.calendar.list(), []),
    safe(remote.momentumScore.current(), { today: 0, weekly: 0, monthly: 0 }),
    safe(remote.momentumScore.history(), []),
    safe(remote.journal.list(), [])
  ]);

  const goals: Goal[] = goalsDto.map(g => ({
    id: g.id,
    title: g.title,
    area: toAreaId(g.lifeArea?.name),
    progress: g.progress ?? 0,
    deadline: g.targetDate ? String(g.targetDate).slice(0, 10) : undefined,
    milestones: (g.milestones ?? []).map(m => ({ title: m.title, done: m.completed }))
  }));

  const areas: LifeArea[] = (Object.keys(AREA_META) as LifeAreaId[]).map(id => {
    const dto = areasDto.find(a => toAreaId(a.name) === id);
    const areaGoals = goals.filter(g => g.area === id);
    const progress = areaGoals.length
      ? Math.round(areaGoals.reduce((s, g) => s + g.progress, 0) / areaGoals.length)
      : 50;
    return {
      id,
      name: dto?.name ?? id.charAt(0).toUpperCase() + id.slice(1),
      icon: dto?.icon ?? AREA_META[id].icon,
      color: dto?.color ?? AREA_META[id].color,
      progress
    };
  });

  const tasks: Task[] = tasksDto.map(t => ({
    id: t.id,
    title: t.title,
    area: guessArea(t.title),
    status: t.completed ? "completed" : "todo",
    priority: (Math.min(3, Math.max(1, t.priority ?? 2)) as Task["priority"]),
    estimateMin: t.durationMinutes,
    points: t.momentumPoints ?? 10
  }));

  const habits: Habit[] = habitsDto.map(h => {
    const area = h.lifeAreaId
      ? toAreaId(areasDto.find(a => a.id === h.lifeAreaId)?.name)
      : guessArea(h.title);
    const doneToday = (h.logs?.length ?? 0) > 0;
    return {
      id: h.id,
      title: h.title,
      icon: habitIcon(h.title),
      area,
      color: AREA_META[area].color,
      target: 1,
      progress: doneToday ? 1 : 0,
      streak: h.streak ?? 0,
      bestStreak: h.bestStreak ?? 0,
      points: 10
    };
  });

  const palette = ["#3b82f6", "#8b5cf6", "#6366f1", "#22c55e", "#f59e0b"];
  const today = new Date().toDateString();
  const events: CalendarEvent[] = eventsDto
    .filter(e => new Date(e.startTime).toDateString() === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((e, i) => ({
      id: e.id,
      title: e.title,
      start: hhmm(e.startTime),
      end: hhmm(e.endTime),
      color: palette[i % palette.length],
      kind: /deep work|focus/i.test(e.title) ? "deepwork"
        : /reflect/i.test(e.title) ? "reflection"
        : /gym|workout|run/i.test(e.title) ? "habit" : "meeting"
    }));

  // Daily score history for the sparkline (last 7 days, summed per day).
  const byDay = new Map<string, number>();
  for (const entry of history) {
    const d = new Date(entry.createdAt); d.setHours(0, 0, 0, 0);
    byDay.set(d.toISOString(), (byDay.get(d.toISOString()) ?? 0) + entry.points);
  }
  const scoreHistory = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      value: byDay.get(d.toISOString()) ?? 0
    };
  });
  const yesterday = scoreHistory[scoreHistory.length - 2]?.value ?? 0;

  // Client-side brief mirrors the backend heuristic (saves an AI rate-limited call).
  const open = tasks.filter(t => t.status !== "completed").sort((a, b) => a.priority - b.priority);
  const brief: MomentumState["brief"] = {
    headline: open.length >= 2 ? "Today is a high-impact day"
      : open.length === 1 ? "One thing matters most today"
      : "A clear day — design it deliberately",
    summary: open.length
      ? `You have ${open.length} open task${open.length > 1 ? "s" : ""}, ${habits.filter(h => h.progress < 1).length} habit${habits.filter(h => h.progress < 1).length === 1 ? "" : "s"} to close, and ${events.length} item${events.length === 1 ? "" : "s"} on the calendar.`
      : "Your task list is clear. Protect one block for your top goal, or plan tomorrow.",
    priorities: open.slice(0, 3).map(t => ({ taskId: t.id, hours: Math.max(0.5, Math.round(((t.estimateMin ?? 60) / 60) * 2) / 2) })),
    footer: "Don't forget your evening reflection. 💜"
  };

  return {
    user: { name: me.name, handle: me.name },
    score: current.today,
    scoreDelta: current.today - yesterday,
    dailyGoal: seed.dailyGoal,
    scoreHistory,
    areas,
    tasks,
    habits,
    goals,
    events,
    achievements: [],
    journal: journalDto.map(j => ({
      id: j.id,
      date: String(j.createdAt).slice(0, 10),
      type: "reflection" as const,
      text: j.content
    })),
    brief,
    onboarded: true
  };
}
