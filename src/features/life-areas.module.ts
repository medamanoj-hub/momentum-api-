// Life Areas feature — /life-areas
import { Body, Controller, Get, Injectable, Module, Param, ParseUUIDPipe, Patch } from "@nestjs/common";
import { IsInt, IsOptional, IsString } from "class-validator";
import { UserId } from "../common/auth";
import { PrismaService } from "../prisma/prisma.service";

class UpdateLifeAreaDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsInt() displayOrder?: number;
}

@Injectable()
export class LifeAreasService {
  constructor(private prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.lifeArea.findMany({ where: { userId }, orderBy: { displayOrder: "asc" } });
  }

  async update(userId: string, id: string, dto: UpdateLifeAreaDto) {
    // updateMany scoped by userId prevents cross-user access without a pre-read
    await this.prisma.lifeArea.updateMany({ where: { id, userId }, data: dto });
    return this.prisma.lifeArea.findFirst({ where: { id, userId } });
  }
}

@Controller("life-areas")
export class LifeAreasController {
  constructor(private areas: LifeAreasService) {}
  @Get() list(@UserId() userId: string) { return this.areas.list(userId); }
  @Patch(":id") update(@UserId() userId: string, @Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateLifeAreaDto) {
    return this.areas.update(userId, id, dto);
  }
}

@Module({ controllers: [LifeAreasController], providers: [LifeAreasService] })
export class LifeAreasModule {}
