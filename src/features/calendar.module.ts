// Calendar feature — /calendar (+ POST /calendar/sync)
import {
  Body, Controller, Delete, Get, Injectable, Module, Param, ParseUUIDPipe, Patch, Post
} from "@nestjs/common";
import { IsDateString, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiException } from "../common/api-error";
import { UserId } from "../common/auth";
import { PrismaService } from "../prisma/prisma.service";

class CreateEventDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsDateString() startTime!: string;
  @IsDateString() endTime!: string;
  @IsOptional() @IsString() location?: string;
}
class UpdateEventDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsDateString() startTime?: string;
  @IsOptional() @IsDateString() endTime?: string;
  @IsOptional() @IsString() location?: string;
}

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.calendarEvent.findMany({
      where: { userId, deletedAt: null },
      orderBy: { startTime: "asc" }
    });
  }

  async getById(userId: string, id: string) {
    const e = await this.prisma.calendarEvent.findFirst({ where: { id, userId, deletedAt: null } });
    if (!e) throw ApiException.notFound("EVENT");
    return e;
  }

  create(userId: string, dto: CreateEventDto) {
    return this.prisma.calendarEvent.create({
      data: {
        userId,
        title: dto.title,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        location: dto.location
      }
    });
  }

  async update(userId: string, id: string, dto: UpdateEventDto) {
    await this.getById(userId, id);
    return this.prisma.calendarEvent.update({
      where: { id },
      data: {
        ...dto,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined
      }
    });
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await this.prisma.calendarEvent.update({ where: { id }, data: { deletedAt: new Date() } });
    return {};
  }

  /**
   * External calendar sync (Apple / Google / Outlook).
   * Production: exchange OAuth grants stored per user, pull deltas, upsert
   * with source = provider, resolve conflicts by server timestamp.
   * Returns the current sync status until providers are configured.
   */
  sync() {
    return { synced: 0, providers: [], message: "No external calendar providers connected." };
  }
}

@Controller("calendar")
export class CalendarController {
  constructor(private cal: CalendarService) {}
  @Get() list(@UserId() u: string) { return this.cal.list(u); }
  @Post() create(@UserId() u: string, @Body() dto: CreateEventDto) { return this.cal.create(u, dto); }
  @Patch(":id") update(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateEventDto) { return this.cal.update(u, id, dto); }
  @Delete(":id") remove(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string) { return this.cal.remove(u, id); }
  @Post("sync") sync() { return this.cal.sync(); }
}

@Module({ controllers: [CalendarController], providers: [CalendarService] })
export class CalendarModule {}
