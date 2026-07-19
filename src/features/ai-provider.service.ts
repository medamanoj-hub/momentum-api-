// AI Provider Service — the "AI as a layer" abstraction from the docs.
// Provider selection is hidden behind this service: OpenAI is primary
// when OPENAI_API_KEY is set; a deterministic local coach keeps every
// AI endpoint functional without credentials. Additional providers
// (Anthropic, Gemini) plug in behind the same interface.
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";

export interface UserContext {
  name: string;
  scoreToday: number;
  openTasks: { title: string; priority: number }[];
  habits: { title: string; streak: number; doneToday: boolean }[];
  goals: { title: string; progress: number }[];
  eventsToday: { title: string; startTime: Date }[];
}

@Injectable()
export class AiProviderService {
  constructor(private config: ConfigService, private prisma: PrismaService) {}

  /** Context Builder step of the AI pipeline: gather everything the coach needs. */
  async buildContext(userId: string): Promise<UserContext> {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

    const [user, tasks, habits, goals, events, score] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.task.findMany({ where: { userId, deletedAt: null, completed: false }, orderBy: { priority: "asc" }, take: 10 }),
      this.prisma.habit.findMany({
        where: { userId, deletedAt: null, active: true },
        include: { logs: { where: { completedAt: { gte: startOfDay } }, take: 1 } }
      }),
      this.prisma.goal.findMany({ where: { userId, deletedAt: null, status: "ACTIVE" }, take: 5 }),
      this.prisma.calendarEvent.findMany({ where: { userId, deletedAt: null, startTime: { gte: startOfDay, lte: endOfDay } } }),
      this.prisma.momentumScore.aggregate({ where: { userId, createdAt: { gte: startOfDay } }, _sum: { points: true } })
    ]);

    return {
      name: user?.name ?? "there",
      scoreToday: score._sum.points ?? 0,
      openTasks: tasks.map(t => ({ title: t.title, priority: t.priority })),
      habits: habits.map(h => ({ title: h.title, streak: h.streak, doneToday: h.logs.length > 0 })),
      goals: goals.map(g => ({ title: g.title, progress: g.progress })),
      eventsToday: events.map(e => ({ title: e.title, startTime: e.startTime }))
    };
  }

  /** Prompt Engine + LLM step. Falls back to the local coach on any failure. */
  async generate(system: string, userMessage: string, ctx: UserContext): Promise<string> {
    const key = this.config.get<string>("OPENAI_API_KEY");
    if (key) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: this.config.get("OPENAI_MODEL", "gpt-4o-mini"),
            max_tokens: 400,
            messages: [
              { role: "system", content: `${system}\n\nUser context (JSON): ${JSON.stringify(ctx)}` },
              { role: "user", content: userMessage }
            ]
          })
        });
        if (res.ok) {
          const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
          const text = data.choices?.[0]?.message?.content?.trim();
          if (text) return text;
        }
      } catch { /* fall through to the local coach */ }
    }
    return this.localCoach(userMessage, ctx);
  }

  /** Deterministic, context-aware coach — the AI personality without a provider. */
  localCoach(input: string, ctx: UserContext): string {
    const q = input.toLowerCase();
    const top = ctx.openTasks[0];
    const habitsLeft = ctx.habits.filter(h => !h.doneToday);

    if (q.includes("distract") || q.includes("focus")) {
      return top
        ? `Let's narrow the field, ${ctx.name}. Your highest-impact open task is "${top.title}". One focused session on it will restore momentum faster than anything else.`
        : `Nothing is blocking you, ${ctx.name} — your task list is clear. Use this energy for a habit or a reflection.`;
    }
    if (q.includes("plan") || q.includes("today") || q.includes("next")) {
      const parts = [
        `You're at ${ctx.scoreToday} points today with ${ctx.openTasks.length} open task${ctx.openTasks.length === 1 ? "" : "s"}.`,
        top ? `Next best move: "${top.title}".` : "Your tasks are done — plan tomorrow while it's quiet.",
        habitsLeft.length ? `Still open: ${habitsLeft.map(h => h.title).join(", ")}.` : "All habits are complete. Strong day."
      ];
      return parts.join(" ");
    }
    if (q.includes("goal")) {
      const g = ctx.goals[0];
      return g
        ? `"${g.title}" is at ${g.progress}%. Small daily reps compound — one focused session today keeps it moving.`
        : "You have no active goals yet. Create one and I'll build the roadmap with you.";
    }
    return top
      ? `Based on your patterns, schedule your toughest work in the morning. Right now, the highest-leverage move is "${top.title}".`
      : `You're clear for today, ${ctx.name}. Protect your evening reflection — that's where tomorrow gets designed.`;
  }

  async reflectOnJournal(content: string): Promise<string> {
    const key = this.config.get<string>("OPENAI_API_KEY");
    if (key) {
      const ctx = { name: "", scoreToday: 0, openTasks: [], habits: [], goals: [], eventsToday: [] };
      return this.generate(
        "You are Momentum's reflection coach: calm, honest, encouraging. Summarize this journal entry in 2-3 sentences, naming one win and one gentle suggestion.",
        content,
        ctx
      );
    }
    const words = content.trim().split(/\s+/).length;
    return `You wrote ${words} words of honest reflection — that alone builds self-awareness. Notice what energized you here and protect it tomorrow.`;
  }
}
