// AI Coach feature — /ai/* (rate-limited: 20 req/min per the spec)
// Pipeline per the architecture: Context Builder → Prompt Engine → LLM →
// structured response. Conversations persist to ai_conversations/ai_messages.
import { Body, Controller, Get, Injectable, Module, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { UserId } from "../common/auth";
import { PrismaService } from "../prisma/prisma.service";
import { AiProviderService } from "./ai-provider.service";

const COACH_SYSTEM =
  "You are Momentum's AI Coach: a goal-oriented performance coach. " +
  "Be strategic, calm, honest, encouraging, disciplined, data-driven, and practical. " +
  "Never be manipulative, aggressive, judgmental, or generic. " +
  "Recommend and explain; the final decision always belongs to the user. Keep replies under 120 words.";

class ChatDto {
  @IsString() @IsNotEmpty() message!: string;
  @IsOptional() @IsUUID() conversationId?: string;
}
class RoadmapDto { @IsUUID() goalId!: string; }
class ReflectionDto { @IsString() @IsNotEmpty() content!: string; }

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService, private provider: AiProviderService) {}

  async chat(userId: string, dto: ChatDto) {
    const ctx = await this.provider.buildContext(userId);

    const conversation = dto.conversationId
      ? await this.prisma.aiConversation.findFirst({ where: { id: dto.conversationId, userId } })
      : null;
    const conv = conversation ?? await this.prisma.aiConversation.create({
      data: { userId, title: dto.message.slice(0, 60) }
    });

    const reply = await this.provider.generate(COACH_SYSTEM, dto.message, ctx);

    await this.prisma.aiMessage.createMany({
      data: [
        { conversationId: conv.id, role: "USER", content: dto.message },
        { conversationId: conv.id, role: "ASSISTANT", content: reply }
      ]
    });

    return { reply, conversationId: conv.id };
  }

  async dailyBrief(userId: string) {
    const ctx = await this.provider.buildContext(userId);
    const priorities = ctx.openTasks.slice(0, 3);
    const deepBlocks = ctx.eventsToday.filter(e => /deep work|focus/i.test(e.title)).length;
    const meetings = ctx.eventsToday.filter(e => /meeting|standup|sync|1:1/i.test(e.title)).length;

    const headline = priorities.length >= 2 ? "Today is a high-impact day" :
      priorities.length === 1 ? "One thing matters most today" : "A clear day — design it deliberately";
    const summary = [
      deepBlocks ? `You have ${deepBlocks} deep work block${deepBlocks > 1 ? "s" : ""}` : null,
      meetings ? `${meetings} meeting${meetings > 1 ? "s" : ""}` : null,
      ctx.habits.some(h => /workout|gym|run/i.test(h.title) && !h.doneToday) ? "and time for your workout" : null
    ].filter(Boolean).join(", ") + ".";

    return {
      headline,
      summary: summary.length > 1 ? summary : "Your calendar is open — protect one block for your top priority.",
      priorities,
      footer: "Don't forget your evening reflection. 💜"
    };
  }

  async weeklyReview(userId: string) {
    const since = new Date(); since.setDate(since.getDate() - 7);
    const [points, tasksDone, logs] = await Promise.all([
      this.prisma.momentumScore.aggregate({ where: { userId, createdAt: { gte: since } }, _sum: { points: true } }),
      this.prisma.task.count({ where: { userId, completed: true, updatedAt: { gte: since } } }),
      this.prisma.habitLog.count({ where: { habit: { userId }, completedAt: { gte: since } } })
    ]);
    return {
      review: `This week you earned ${points._sum.points ?? 0} Momentum points, completed ${tasksDone} tasks, and logged ${logs} habit completions. Consistency beats intensity — carry one small win into next week.`
    };
  }

  async monthlyReview(userId: string) {
    const since = new Date(); since.setDate(since.getDate() - 30);
    const points = await this.prisma.momentumScore.aggregate({
      where: { userId, createdAt: { gte: since } }, _sum: { points: true }
    });
    return { review: `Over the last 30 days you earned ${points._sum.points ?? 0} Momentum points. Review which life area moved least — that's next month's focus.` };
  }

  async goalRoadmap(userId: string, dto: RoadmapDto) {
    const goal = await this.prisma.goal.findFirst({
      where: { id: dto.goalId, userId, deletedAt: null },
      include: { milestones: true }
    });
    if (!goal) return { roadmap: null };
    const next = goal.milestones.find(m => !m.completed);
    return {
      roadmap: {
        goal: goal.title,
        progress: goal.progress,
        nextMilestone: next?.title ?? "Define your first milestone",
        guidance: "Break the next milestone into one project and 3-5 tasks. Schedule the first task within 48 hours — momentum starts with motion."
      }
    };
  }

  async habitSuggestions(userId: string) {
    const ctx = await this.provider.buildContext(userId);
    const existing = new Set(ctx.habits.map(h => h.title.toLowerCase()));
    const catalog = ["Morning walk", "Read 20 pages", "Meditate 10 minutes", "Journal before bed", "No phone first hour", "Sleep by 11 PM"];
    return { suggestions: catalog.filter(c => !existing.has(c.toLowerCase())).slice(0, 4) };
  }

  async reflection(userId: string, dto: ReflectionDto) {
    const reflection = await this.provider.reflectOnJournal(dto.content);
    return { reflection };
  }
}

@Controller("ai")
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class AiController {
  constructor(private ai: AiService) {}
  @Post("chat") chat(@UserId() u: string, @Body() dto: ChatDto) { return this.ai.chat(u, dto); }
  @Get("daily-brief") dailyBrief(@UserId() u: string) { return this.ai.dailyBrief(u); }
  @Get("weekly-review") weekly(@UserId() u: string) { return this.ai.weeklyReview(u); }
  @Get("monthly-review") monthly(@UserId() u: string) { return this.ai.monthlyReview(u); }
  @Post("goal-roadmap") roadmap(@UserId() u: string, @Body() dto: RoadmapDto) { return this.ai.goalRoadmap(u, dto); }
  @Get("habits") habitSuggestions(@UserId() u: string) { return this.ai.habitSuggestions(u); }
  @Post("reflection") reflection(@UserId() u: string, @Body() dto: ReflectionDto) { return this.ai.reflection(u, dto); }
}

@Module({ controllers: [AiController], providers: [AiService] })
export class AiModule {}
