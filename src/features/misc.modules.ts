// Insights, Notifications, Search, Settings, Widgets — /insights /notifications /search /settings /widgets
import {
  Body, Controller, Delete, Get, Injectable, Module, Param, ParseUUIDPipe, Patch, Query
} from "@nestjs/common";
import { IsBoolean, IsOptional, IsString, Matches } from "class-validator";
import { UserId } from "../common/auth";
import { PrismaService } from "../prisma/prisma.service";

// ── Insights ───────────────────────────────────────────────────────
@Injectable()
export class InsightsService {
  constructor(private prisma: PrismaService) {}

  async overview(userId: string) {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const [goals, goalsDone, habits, logsWeek, tasksOpen, tasksDoneWeek, focusWeek] = await Promise.all([
      this.prisma.goal.count({ where: { userId, deletedAt: null, status: "ACTIVE" } }),
      this.prisma.goal.count({ where: { userId, deletedAt: null, status: "COMPLETED" } }),
      this.prisma.habit.count({ where: { userId, deletedAt: null, active: true } }),
      this.prisma.habitLog.count({ where: { habit: { userId }, completedAt: { gte: weekAgo } } }),
      this.prisma.task.count({ where: { userId, deletedAt: null, completed: false } }),
      this.prisma.task.count({ where: { userId, deletedAt: null, completed: true, updatedAt: { gte: weekAgo } } }),
      this.prisma.focusSession.aggregate({
        where: { userId, startedAt: { gte: weekAgo }, interrupted: false },
        _sum: { duration: true }, _count: true
      })
    ]);
    return {
      goals: { active: goals, completed: goalsDone },
      habits: { active: habits, completionsThisWeek: logsWeek },
      productivity: { openTasks: tasksOpen, completedThisWeek: tasksDoneWeek },
      timeAllocation: { deepWorkMinutesThisWeek: focusWeek._sum.duration ?? 0, sessions: focusWeek._count },
      trends: { period: "7d" }
    };
  }
}

@Controller("insights")
export class InsightsController {
  constructor(private insights: InsightsService) {}
  @Get() overview(@UserId() u: string) { return this.insights.overview(u); }
}

// ── Notifications ──────────────────────────────────────────────────
@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}
  list(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { scheduledAt: "desc" }, take: 50 });
  }
  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return {};
  }
  async remove(userId: string, id: string) {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
    return {};
  }
}

@Controller("notifications")
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}
  @Get() list(@UserId() u: string) { return this.notifications.list(u); }
  @Patch("read") markRead(@UserId() u: string) { return this.notifications.markAllRead(u); }
  @Delete(":id") remove(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string) { return this.notifications.remove(u, id); }
}

// ── Universal Search ───────────────────────────────────────────────
@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(userId: string, q: string) {
    if (!q || q.trim().length < 2) {
      return { tasks: [], goals: [], projects: [], journal: [], calendar: [], habits: [] };
    }
    const contains = { contains: q.trim(), mode: "insensitive" as const };
    const [tasks, goals, projects, journal, calendar, habits] = await Promise.all([
      this.prisma.task.findMany({ where: { userId, deletedAt: null, title: contains }, take: 10 }),
      this.prisma.goal.findMany({ where: { userId, deletedAt: null, title: contains }, take: 10 }),
      this.prisma.project.findMany({ where: { deletedAt: null, goal: { userId }, title: contains }, take: 10 }),
      this.prisma.journalEntry.findMany({ where: { userId, deletedAt: null, content: contains }, take: 10 }),
      this.prisma.calendarEvent.findMany({ where: { userId, deletedAt: null, title: contains }, take: 10 }),
      this.prisma.habit.findMany({ where: { userId, deletedAt: null, title: contains }, take: 10 })
    ]);
    return { tasks, goals, projects, journal, calendar, habits };
  }
}

@Controller("search")
export class SearchController {
  constructor(private searchSvc: SearchService) {}
  @Get() search(@UserId() u: string, @Query("q") q: string) { return this.searchSvc.search(u, q ?? ""); }
}

// ── Settings ───────────────────────────────────────────────────────
class UpdateSettingsDto {
  @IsOptional() @IsString() theme?: string;
  @IsOptional() @IsString() aiPersonality?: string;
  @IsOptional() @IsBoolean() notificationsEnabled?: boolean;
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) dailyBriefTime?: string;
}

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}
  get(userId: string) {
    return this.prisma.userSettings.upsert({
      where: { userId }, create: { userId }, update: {}
    });
  }
  update(userId: string, dto: UpdateSettingsDto) {
    return this.prisma.userSettings.upsert({
      where: { userId }, create: { userId, ...dto }, update: dto
    });
  }
}

@Controller("settings")
export class SettingsController {
  constructor(private settings: SettingsService) {}
  @Get() get(@UserId() u: string) { return this.settings.get(u); }
  @Patch() update(@UserId() u: string, @Body() dto: UpdateSettingsDto) { return this.settings.update(u, dto); }
}

// ── Widgets (lightweight dashboard payload for WidgetKit) ─────────
@Injectable()
export class WidgetsService {
  constructor(private prisma: PrismaService) {}

  async dashboard(userId: string) {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const [score, tasks, habits] = await Promise.all([
      this.prisma.momentumScore.aggregate({ where: { userId, createdAt: { gte: startOfDay } }, _sum: { points: true } }),
      this.prisma.task.findMany({
        where: { userId, deletedAt: null, completed: false },
        orderBy: { priority: "asc" }, take: 3, select: { id: true, title: true }
      }),
      this.prisma.habit.findMany({
        where: { userId, deletedAt: null, active: true },
        include: { logs: { where: { completedAt: { gte: startOfDay } }, take: 1 } }
      })
    ]);
    return {
      momentumScore: score._sum.points ?? 0,
      mission: "Make progress on what matters most.",
      topTasks: tasks,
      habits: { done: habits.filter(h => h.logs.length > 0).length, total: habits.length }
    };
  }
}

@Controller("widgets")
export class WidgetsController {
  constructor(private widgets: WidgetsService) {}
  @Get("dashboard") dashboard(@UserId() u: string) { return this.widgets.dashboard(u); }
}

@Module({
  controllers: [InsightsController, NotificationsController, SearchController, SettingsController, WidgetsController],
  providers: [InsightsService, NotificationsService, SearchService, SettingsService, WidgetsService]
})
export class MiscModule {}
