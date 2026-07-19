// Tasks feature — /tasks
// POST /tasks/{id}/complete returns { momentumPoints } and writes a
// momentum_scores history row (source_type "Task"), per the contract.
import {
  Body, Controller, Delete, Get, Injectable, Module, Param, ParseUUIDPipe, Patch, Post, Query
} from "@nestjs/common";
import {
  IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min
} from "class-validator";
import { ApiException } from "../common/api-error";
import { UserId } from "../common/auth";
import { PrismaService } from "../prisma/prisma.service";

class CreateTaskDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsInt() @Min(1) @Max(5) priority?: number;
  @IsOptional() @IsInt() @Min(1) duration?: number;         // minutes, per spec example
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsBoolean() recurring?: boolean;
  @IsOptional() @IsInt() @Min(1) momentumPoints?: number;
}
class UpdateTaskDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsInt() @Min(1) @Max(5) priority?: number;
  @IsOptional() @IsInt() @Min(1) duration?: number;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsBoolean() completed?: boolean;
  @IsOptional() @IsBoolean() recurring?: boolean;
}

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  list(userId: string, q: { completed?: string; priority?: string; today?: string; goal?: string; project?: string }) {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
    return this.prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        completed: q.completed !== undefined ? q.completed === "true" : undefined,
        priority: q.priority ? Number(q.priority) : undefined,
        projectId: q.project || undefined,
        project: q.goal ? { goalId: q.goal } : undefined,
        dueDate: q.today === "true" ? { gte: startOfDay, lte: endOfDay } : undefined
      },
      orderBy: [{ completed: "asc" }, { priority: "asc" }, { dueDate: "asc" }]
    });
  }

  async getById(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({ where: { id, userId, deletedAt: null } });
    if (!task) throw ApiException.notFound("TASK");
    return task;
  }

  create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        userId,
        title: dto.title,
        notes: dto.notes,
        priority: dto.priority ?? 3,
        durationMinutes: dto.duration,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        projectId: dto.projectId,
        recurring: dto.recurring ?? false,
        momentumPoints: dto.momentumPoints ?? 10
      }
    });
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const existing = await this.getById(userId, id);
    const { duration, ...rest } = dto;

    // Reopening a completed task reverses its score contribution,
    // keeping the history append-only (negative correction entry).
    if (dto.completed === false && existing.completed) {
      await this.prisma.momentumScore.create({
        data: {
          userId, points: -existing.momentumPoints,
          reason: `Reopened: ${existing.title}`, sourceType: "Task", sourceId: id
        }
      });
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        ...rest,
        durationMinutes: duration,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined
      }
    });
  }

  async complete(userId: string, id: string) {
    const task = await this.getById(userId, id);
    if (task.completed) return { momentumPoints: 0 }; // idempotent

    await this.prisma.$transaction([
      this.prisma.task.update({ where: { id }, data: { completed: true } }),
      this.prisma.momentumScore.create({
        data: {
          userId, points: task.momentumPoints,
          reason: `Completed: ${task.title}`, sourceType: "Task", sourceId: id
        }
      })
    ]);
    return { momentumPoints: task.momentumPoints };
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await this.prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
    return {};
  }
}

@Controller("tasks")
export class TasksController {
  constructor(private tasks: TasksService) {}
  @Get() list(@UserId() u: string, @Query() q: Record<string, string>) { return this.tasks.list(u, q); }
  @Post() create(@UserId() u: string, @Body() dto: CreateTaskDto) { return this.tasks.create(u, dto); }
  @Patch(":id") update(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) { return this.tasks.update(u, id, dto); }
  @Post(":id/complete") complete(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string) { return this.tasks.complete(u, id); }
  @Delete(":id") remove(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string) { return this.tasks.remove(u, id); }
}

@Module({ controllers: [TasksController], providers: [TasksService], exports: [TasksService] })
export class TasksModule {}
