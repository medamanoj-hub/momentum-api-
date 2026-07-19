// Habits feature — /habits
// POST /habits/{id}/complete returns { streak, points }, writes a
// habit_logs row and a momentum_scores entry (source_type "Habit").
import {
  Body, Controller, Delete, Get, Injectable, Module, Param, ParseUUIDPipe, Patch, Post
} from "@nestjs/common";
import { HabitFrequency } from "@prisma/client";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from "class-validator";
import { ApiException } from "../common/api-error";
import { UserId } from "../common/auth";
import { PrismaService } from "../prisma/prisma.service";

const HABIT_POINTS = 10; // default per the Momentum Score examples

class CreateHabitDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsEnum(HabitFrequency) frequency?: HabitFrequency;
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) reminderTime?: string;
  @IsOptional() @IsUUID() lifeAreaId?: string;
}
class UpdateHabitDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsEnum(HabitFrequency) frequency?: HabitFrequency;
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) reminderTime?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsUUID() lifeAreaId?: string;
}

function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function startOfYesterday() { const d = startOfToday(); d.setDate(d.getDate() - 1); return d; }

@Injectable()
export class HabitsService {
  constructor(private prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.habit.findMany({
      where: { userId, deletedAt: null, active: true },
      include: { logs: { where: { completedAt: { gte: startOfToday() } }, take: 1 } },
      orderBy: { createdAt: "asc" }
    });
  }

  async getById(userId: string, id: string) {
    const habit = await this.prisma.habit.findFirst({ where: { id, userId, deletedAt: null } });
    if (!habit) throw ApiException.notFound("HABIT");
    return habit;
  }

  create(userId: string, dto: CreateHabitDto) {
    return this.prisma.habit.create({
      data: {
        userId,
        title: dto.title,
        frequency: dto.frequency ?? "DAILY",
        reminderTime: dto.reminderTime,
        lifeAreaId: dto.lifeAreaId
      }
    });
  }

  async update(userId: string, id: string, dto: UpdateHabitDto) {
    await this.getById(userId, id);
    return this.prisma.habit.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await this.prisma.habit.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
    return {};
  }

  async complete(userId: string, id: string) {
    const habit = await this.getById(userId, id);

    // Idempotent per day: a second completion today changes nothing.
    const already = await this.prisma.habitLog.findFirst({
      where: { habitId: id, completedAt: { gte: startOfToday() } }
    });
    if (already) return { streak: habit.streak, points: 0 };

    // Streak continues if there was a log yesterday; otherwise it restarts.
    const yesterdayLog = await this.prisma.habitLog.findFirst({
      where: { habitId: id, completedAt: { gte: startOfYesterday(), lt: startOfToday() } }
    });
    const streak = yesterdayLog ? habit.streak + 1 : 1;

    await this.prisma.$transaction([
      this.prisma.habitLog.create({ data: { habitId: id, momentumPoints: HABIT_POINTS } }),
      this.prisma.habit.update({
        where: { id },
        data: { streak, bestStreak: Math.max(habit.bestStreak, streak) }
      }),
      this.prisma.momentumScore.create({
        data: {
          userId, points: HABIT_POINTS,
          reason: `${habit.title} completed`, sourceType: "Habit", sourceId: id
        }
      })
    ]);

    return { streak, points: HABIT_POINTS };
  }

  async logs(userId: string, id: string) {
    await this.getById(userId, id);
    return this.prisma.habitLog.findMany({
      where: { habitId: id },
      orderBy: { completedAt: "desc" },
      take: 90 // heatmap window
    });
  }
}

@Controller("habits")
export class HabitsController {
  constructor(private habits: HabitsService) {}
  @Get() list(@UserId() u: string) { return this.habits.list(u); }
  @Post() create(@UserId() u: string, @Body() dto: CreateHabitDto) { return this.habits.create(u, dto); }
  @Patch(":id") update(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateHabitDto) { return this.habits.update(u, id, dto); }
  @Delete(":id") remove(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string) { return this.habits.remove(u, id); }
  @Post(":id/complete") complete(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string) { return this.habits.complete(u, id); }
  @Get(":id/logs") logs(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string) { return this.habits.logs(u, id); }
}

@Module({ controllers: [HabitsController], providers: [HabitsService] })
export class HabitsModule {}
