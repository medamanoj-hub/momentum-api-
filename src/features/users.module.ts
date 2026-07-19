// Users feature — /users/me
import { Body, Controller, Delete, Get, Injectable, Module, Patch } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { ApiException } from "../common/api-error";
import { UserId } from "../common/auth";
import { PrismaService } from "../prisma/prisma.service";

class UpdateUserDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() locale?: string;
  @IsOptional() onboardingCompleted?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async me(userId: string) {
    const u = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!u) throw ApiException.notFound("USER");
    const { passwordHash, refreshTokenHash, deletedAt, ...safe } = u;
    return safe;
  }

  async update(userId: string, dto: UpdateUserDto) {
    await this.me(userId);
    const u = await this.prisma.user.update({ where: { id: userId }, data: dto });
    const { passwordHash, refreshTokenHash, deletedAt, ...safe } = u;
    return safe;
  }

  /** Soft delete per the data-retention policy; sessions revoked immediately. */
  async remove(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), refreshTokenHash: null }
    });
    return {};
  }
}

@Controller("users")
export class UsersController {
  constructor(private users: UsersService) {}
  @Get("me") me(@UserId() id: string) { return this.users.me(id); }
  @Patch("me") update(@UserId() id: string, @Body() dto: UpdateUserDto) { return this.users.update(id, dto); }
  @Delete("me") remove(@UserId() id: string) { return this.users.remove(id); }
}

@Module({ controllers: [UsersController], providers: [UsersService] })
export class UsersModule {}
