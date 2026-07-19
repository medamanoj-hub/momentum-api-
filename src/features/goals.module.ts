// Goals feature — /goals (filters: status, lifeArea, priority)
import {
  Body, Controller, Delete, Get, Injectable, Module, Param, ParseUUIDPipe, Patch, Post, Query
} from "@nestjs/common";
import { GoalStatus } from "@prisma/client";
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { ApiException } from "../common/api-error";
import { UserId } from "../common/auth";
import { PrismaService } from "../prisma/prisma.service";

class CreateGoalDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() lifeArea?: string;      // name, e.g. "Learning" (per spec example)
  @IsOptional() @IsUUID() lifeAreaId?: string;      // or direct id
  @IsOptional() @IsDateString() targetDate?: string;
  @IsOptional() @IsInt() @Min(1) @Max(5) priority?: number;
}
class UpdateGoalDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() targetDate?: string;
  @IsOptional() @IsInt() @Min(1) @Max(5) priority?: number;
  @IsOptional() @IsEnum(GoalStatus) status?: GoalStatus;
  @IsOptional() @IsInt() @Min(0) @Max(100) progress?: number;
}

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async resolveAreaId(userId: string, dto: { lifeArea?: string; lifeAreaId?: string }) {
    if (dto.lifeAreaId) return dto.lifeAreaId;
    if (!dto.lifeArea) return null;
    const area = await this.prisma.lifeArea.findFirst({
      where: { userId, name: { equals: dto.lifeArea, mode: "insensitive" } }
    });
    return area?.id ?? null;
  }

  list(userId: string, q: { status?: string; lifeArea?: string; priority?: string }) {
    return this.prisma.goal.findMany({
      where: {
        userId,
        deletedAt: null,
        status: q.status ? (q.status.toUpperCase() as GoalStatus) : undefined,
        priority: q.priority ? Number(q.priority) : undefined,
        lifeArea: q.lifeArea ? { name: { equals: q.lifeArea, mode: "insensitive" } } : undefined
      },
      include: { milestones: true, lifeArea: { select: { name: true, color: true } } },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }]
    });
  }

  async create(userId: string, dto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        lifeAreaId: await this.resolveAreaId(userId, dto),
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        priority: dto.priority ?? 3
      }
    });
  }

  async getById(userId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId, deletedAt: null },
      include: { milestones: true, projects: { where: { deletedAt: null }, include: { tasks: { where: { deletedAt: null } } } } }
    });
    if (!goal) throw ApiException.notFound("GOAL");
    return goal;
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    await this.getById(userId, id);
    return this.prisma.goal.update({
      where: { id },
      data: { ...dto, targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined }
    });
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await this.prisma.goal.update({ where: { id }, data: { deletedAt: new Date() } });
    return {};
  }
}

@Controller("goals")
export class GoalsController {
  constructor(private goals: GoalsService) {}
  @Get() list(@UserId() u: string, @Query() q: { status?: string; lifeArea?: string; priority?: string }) { return this.goals.list(u, q); }
  @Post() create(@UserId() u: string, @Body() dto: CreateGoalDto) { return this.goals.create(u, dto); }
  @Get(":id") get(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string) { return this.goals.getById(u, id); }
  @Patch(":id") update(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateGoalDto) { return this.goals.update(u, id, dto); }
  @Delete(":id") remove(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string) { return this.goals.remove(u, id); }
}

@Module({ controllers: [GoalsController], providers: [GoalsService], exports: [GoalsService] })
export class GoalsModule {}
