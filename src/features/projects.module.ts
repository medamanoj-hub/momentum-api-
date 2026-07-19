// Projects feature — /projects (projects belong to goals)
import {
  Body, Controller, Delete, Get, Injectable, Module, Param, ParseUUIDPipe, Patch, Post
} from "@nestjs/common";
import { ProjectStatus } from "@prisma/client";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { ApiException } from "../common/api-error";
import { UserId } from "../common/auth";
import { PrismaService } from "../prisma/prisma.service";

class CreateProjectDto {
  @IsUUID() goalId!: string;
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() deadline?: string;
}
class UpdateProjectDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
  @IsOptional() @IsDateString() deadline?: string;
}

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.project.findMany({
      where: { deletedAt: null, goal: { userId, deletedAt: null } },
      include: { tasks: { where: { deletedAt: null } } },
      orderBy: { createdAt: "desc" }
    });
  }

  async create(userId: string, dto: CreateProjectDto) {
    const goal = await this.prisma.goal.findFirst({ where: { id: dto.goalId, userId, deletedAt: null } });
    if (!goal) throw ApiException.notFound("GOAL");
    return this.prisma.project.create({
      data: {
        goalId: dto.goalId,
        title: dto.title,
        description: dto.description,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined
      }
    });
  }

  async getById(userId: string, id: string) {
    const p = await this.prisma.project.findFirst({
      where: { id, deletedAt: null, goal: { userId } },
      include: { tasks: { where: { deletedAt: null } } }
    });
    if (!p) throw ApiException.notFound("PROJECT");
    return p;
  }

  async update(userId: string, id: string, dto: UpdateProjectDto) {
    await this.getById(userId, id);
    return this.prisma.project.update({
      where: { id },
      data: { ...dto, deadline: dto.deadline ? new Date(dto.deadline) : undefined }
    });
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await this.prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
    return {};
  }
}

@Controller("projects")
export class ProjectsController {
  constructor(private projects: ProjectsService) {}
  @Get() list(@UserId() u: string) { return this.projects.list(u); }
  @Post() create(@UserId() u: string, @Body() dto: CreateProjectDto) { return this.projects.create(u, dto); }
  @Get(":id") get(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string) { return this.projects.getById(u, id); }
  @Patch(":id") update(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto) { return this.projects.update(u, id, dto); }
  @Delete(":id") remove(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string) { return this.projects.remove(u, id); }
}

@Module({ controllers: [ProjectsController], providers: [ProjectsService] })
export class ProjectsModule {}
