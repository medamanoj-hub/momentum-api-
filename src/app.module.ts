import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { JwtAuthGuard } from "./common/auth";
import { AiProviderService } from "./features/ai-provider.service";
import { AiModule } from "./features/ai.module";
import { AuthModule } from "./features/auth.module";
import { CalendarModule } from "./features/calendar.module";
import { FocusModule } from "./features/focus.module";
import { GoalsModule } from "./features/goals.module";
import { HabitsModule } from "./features/habits.module";
import { JournalModule } from "./features/journal.module";
import { LifeAreasModule } from "./features/life-areas.module";
import { MiscModule } from "./features/misc.modules";
import { MomentumScoreModule } from "./features/momentum-score.module";
import { PlannerModule } from "./features/planner.module";
import { ProjectsModule } from "./features/projects.module";
import { TasksModule } from "./features/tasks.module";
import { UsersModule } from "./features/users.module";
import { PrismaModule } from "./prisma/prisma.service";

/** AI provider is shared by the AI, Journal, and future modules. */
@Global()
@Module({ providers: [AiProviderService], exports: [AiProviderService] })
class AiProviderModule {}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // JWT is global so the auth guard and auth service share one config.
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET", "dev-secret-change-me")
      })
    }),

    // Default rate limit per the spec: 100 req/min per user.
    // Auth (10/min) and AI (20/min) override at the controller level.
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 100 }]),

    PrismaModule,
    AiProviderModule,
    AuthModule,
    UsersModule,
    LifeAreasModule,
    GoalsModule,
    ProjectsModule,
    TasksModule,
    HabitsModule,
    JournalModule,
    CalendarModule,
    PlannerModule,
    FocusModule,
    MomentumScoreModule,
    AiModule,
    MiscModule
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard }
  ]
})
export class AppModule {}
