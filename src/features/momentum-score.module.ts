// Momentum Score feature — /momentum-score, /momentum-score/history
// Returns { today, weekly, monthly } computed from the append-only history.
import { Controller, Get, Injectable, Module } from "@nestjs/common";
import { UserId } from "../common/auth";
import { PrismaService } from "../prisma/prisma.service";

function daysAgo(n: number) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - n); return d; }

@Injectable()
export class MomentumScoreService {
  constructor(private prisma: PrismaService) {}

  private async sumSince(userId: string, since: Date) {
    const agg = await this.prisma.momentumScore.aggregate({
      where: { userId, createdAt: { gte: since } },
      _sum: { points: true }
    });
    return agg._sum.points ?? 0;
  }

  async current(userId: string) {
    const [today, week, month] = await Promise.all([
      this.sumSince(userId, daysAgo(0)),
      this.sumSince(userId, daysAgo(7)),
      this.sumSince(userId, daysAgo(30))
    ]);
    return {
      today,
      weekly: Math.round(week / 7),
      monthly: Math.round(month / 30)
    };
  }

  history(userId: string) {
    return this.prisma.momentumScore.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 200
    });
  }
}

@Controller("momentum-score")
export class MomentumScoreController {
  constructor(private score: MomentumScoreService) {}
  @Get() current(@UserId() u: string) { return this.score.current(u); }
  @Get("history") history(@UserId() u: string) { return this.score.history(u); }
}

@Module({ controllers: [MomentumScoreController], providers: [MomentumScoreService], exports: [MomentumScoreService] })
export class MomentumScoreModule {}
