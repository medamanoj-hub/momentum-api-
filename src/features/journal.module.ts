// Journal feature — /journal (+ POST /journal/{id}/reflect → { summary })
import {
  Body, Controller, Delete, Get, Injectable, Module, Param, ParseUUIDPipe, Patch, Post
} from "@nestjs/common";
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator";
import { ApiException } from "../common/api-error";
import { UserId } from "../common/auth";
import { PrismaService } from "../prisma/prisma.service";
import { AiProviderService } from "./ai-provider.service";

const JOURNAL_POINTS = 5; // per the Momentum Score examples

class CreateJournalDto {
  @IsOptional() @IsString() title?: string;
  @IsString() @IsNotEmpty() content!: string;
  @IsOptional() @IsInt() @Min(1) @Max(5) mood?: number;
}
class UpdateJournalDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsInt() @Min(1) @Max(5) mood?: number;
}

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService, private ai: AiProviderService) {}

  list(userId: string) {
    return this.prisma.journalEntry.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }

  async getById(userId: string, id: string) {
    const entry = await this.prisma.journalEntry.findFirst({ where: { id, userId, deletedAt: null } });
    if (!entry) throw ApiException.notFound("JOURNAL");
    return entry;
  }

  async create(userId: string, dto: CreateJournalDto) {
    const [entry] = await this.prisma.$transaction([
      this.prisma.journalEntry.create({ data: { userId, ...dto } }),
      this.prisma.momentumScore.create({
        data: { userId, points: JOURNAL_POINTS, reason: "Journal entry", sourceType: "Journal" }
      })
    ]);
    return entry;
  }

  async update(userId: string, id: string, dto: UpdateJournalDto) {
    await this.getById(userId, id);
    return this.prisma.journalEntry.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await this.prisma.journalEntry.update({ where: { id }, data: { deletedAt: new Date() } });
    return {};
  }

  /** AI reflection: summarize the entry, store as ai_summary, return { summary }. */
  async reflect(userId: string, id: string) {
    const entry = await this.getById(userId, id);
    const summary = await this.ai.reflectOnJournal(entry.content);
    await this.prisma.journalEntry.update({ where: { id }, data: { aiSummary: summary } });
    return { summary };
  }
}

@Controller("journal")
export class JournalController {
  constructor(private journal: JournalService) {}
  @Get() list(@UserId() u: string) { return this.journal.list(u); }
  @Post() create(@UserId() u: string, @Body() dto: CreateJournalDto) { return this.journal.create(u, dto); }
  @Patch(":id") update(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateJournalDto) { return this.journal.update(u, id, dto); }
  @Delete(":id") remove(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string) { return this.journal.remove(u, id); }
  @Post(":id/reflect") reflect(@UserId() u: string, @Param("id", ParseUUIDPipe) id: string) { return this.journal.reflect(u, id); }
}

@Module({ controllers: [JournalController], providers: [JournalService] })
export class JournalModule {}
