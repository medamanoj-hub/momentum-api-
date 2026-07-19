// Focus feature — /focus, /focus/start, /focus/end
// Ending a session awards Momentum points (~4 pts per 5 minutes).
import { Body, Controller, Get, Injectable, Module, Post } from "@nestjs/common";
import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from "class-validator";
import { ApiException } from "../common/api-error";
import { UserId } from "../common/auth";
import { PrismaService } from "../prisma/prisma.service";

class StartFocusDto {
  @IsOptional() @IsUUID() taskId?: string;
  @IsOptional() @IsInt() @Min(1) duration?: number; // planned minutes
}
class EndFocusDto {
  @IsOptional() @IsUUID() sessionId?: string;
  @IsOptional() @IsBoolean() interrupted?: boolean;
}

@Injectable()
export class FocusService {
  constructor(private prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.focusSession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 50
    });
  }

  start(userId: string, dto: StartFocusDto) {
    return this.prisma.focusSession.create({
      data: { userId, taskId: dto.taskId, duration: dto.duration ?? 25 }
    });
  }

  async end(userId: string, dto: EndFocusDto) {
    const session = dto.sessionId
      ? await this.prisma.focusSession.findFirst({ where: { id: dto.sessionId, userId } })
      : await this.prisma.focusSession.findFirst({
          where: { userId, endedAt: null },
          orderBy: { startedAt: "desc" }
        });
    if (!session) throw ApiException.notFound("SESSION", "No active focus session found.");
    if (session.endedAt) return session; // idempotent

    const endedAt = new Date();
    const actualMinutes = Math.max(1, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60_000));
    const minutes = Math.min(actualMinutes, session.duration);
    const interrupted = dto.interrupted ?? false;
    const points = interrupted ? 0 : Math.max(5, Math.round(minutes / 5) * 4);

    const [updated] = await this.prisma.$transaction([
      this.prisma.focusSession.update({ where: { id: session.id }, data: { endedAt, interrupted } }),
      ...(points > 0
        ? [this.prisma.momentumScore.create({
            data: { userId, points, reason: `Focus session (${minutes} min)`, sourceType: "Focus", sourceId: session.id }
          })]
        : [])
    ]);
    return { ...updated, points };
  }
}

@Controller("focus")
export class FocusController {
  constructor(private focus: FocusService) {}
  @Get() list(@UserId() u: string) { return this.focus.list(u); }
  @Post("start") start(@UserId() u: string, @Body() dto: StartFocusDto) { return this.focus.start(u, dto); }
  @Post("end") end(@UserId() u: string, @Body() dto: EndFocusDto) { return this.focus.end(u, dto); }
}

@Module({ controllers: [FocusController], providers: [FocusService] })
export class FocusModule {}
