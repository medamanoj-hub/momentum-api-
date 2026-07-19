// Planner feature — /planner/daily|weekly|monthly
// AI-flavored plan generation: orders open tasks by priority and due date.
import { Controller, Injectable, Module, Post } from "@nestjs/common";
import { UserId } from "../common/auth";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PlannerService {
  constructor(private prisma: PrismaService) {}

  private openTasks(userId: string, horizonDays: number, take: number) {
    const end = new Date(); end.setDate(end.getDate() + horizonDays); end.setHours(23, 59, 59, 999);
    return this.prisma.task.findMany({
      where: {
        userId, deletedAt: null, completed: false,
        OR: [{ dueDate: null }, { dueDate: { lte: end } }]
      },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }],
      take
    });
  }

  async daily(userId: string) { return { tasks: await this.openTasks(userId, 0, 5) }; }
  async weekly(userId: string) { return { tasks: await this.openTasks(userId, 7, 20) }; }
  async monthly(userId: string) { return { tasks: await this.openTasks(userId, 30, 50) }; }
}

@Controller("planner")
export class PlannerController {
  constructor(private planner: PlannerService) {}
  @Post("daily") daily(@UserId() u: string) { return this.planner.daily(u); }
  @Post("weekly") weekly(@UserId() u: string) { return this.planner.weekly(u); }
  @Post("monthly") monthly(@UserId() u: string) { return this.planner.monthly(u); }
}

@Module({ controllers: [PlannerController], providers: [PlannerService] })
export class PlannerModule {}
