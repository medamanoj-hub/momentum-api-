// Auth feature — /auth/* (rate-limited: 10 req/min per the spec)
// JWT access + refresh with rotation; refresh hash stored on the user row.
import { Body, Controller, HttpStatus, Injectable, Module, Post } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Throttle } from "@nestjs/throttler";
import * as bcrypt from "bcryptjs";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiException } from "../common/api-error";
import { JwtPayload, Public } from "../common/auth";
import { PrismaService } from "../prisma/prisma.service";

// ── DTOs ───────────────────────────────────────────────────────────
class RegisterDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
}
class LoginDto {
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() password!: string;
}
class RefreshDto {
  @IsString() @IsNotEmpty() refreshToken!: string;
}

const DEFAULT_LIFE_AREAS = [
  { name: "Career", icon: "💼", color: "#8b5cf6" },
  { name: "Health", icon: "❤️", color: "#22c55e" },
  { name: "Learning", icon: "📘", color: "#3b82f6" },
  { name: "Finance", icon: "💰", color: "#f59e0b" },
  { name: "Relationships", icon: "👥", color: "#ec4899" },
  { name: "Home", icon: "🏠", color: "#f97316" },
  { name: "Mind", icon: "🧠", color: "#06b6d4" },
  { name: "Purpose", icon: "⭐", color: "#a78bfa" },
  { name: "Hobbies", icon: "🎨", color: "#34d399" }
];

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService
  ) {}

  private async issueTokens(userId: string, email: string) {
    const base: Omit<JwtPayload, "type"> = { sub: userId, email };
    const token = await this.jwt.signAsync(
      { ...base, type: "access" },
      { expiresIn: this.config.get("JWT_ACCESS_TTL", "15m") }
    );
    const refreshToken = await this.jwt.signAsync(
      { ...base, type: "refresh" },
      { expiresIn: this.config.get("JWT_REFRESH_TTL", "30d") }
    );
    // Rotation: only the latest refresh token is valid.
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: await bcrypt.hash(refreshToken, 10) }
    });
    return { token, refreshToken };
  }

  private publicUser(u: { id: string; name: string; email: string; avatarUrl: string | null; timezone: string; onboardingCompleted: boolean }) {
    return { id: u.id, name: u.name, email: u.email, avatarUrl: u.avatarUrl, timezone: u.timezone, onboardingCompleted: u.onboardingCompleted };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw ApiException.conflict("An account with this email already exists.", "EMAIL_TAKEN");

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        lifeAreas: {
          create: DEFAULT_LIFE_AREAS.map((a, i) => ({ ...a, displayOrder: i }))
        },
        settings: { create: {} }
      }
    });
    const tokens = await this.issueTokens(user.id, user.email);
    return { user: this.publicUser(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || user.deletedAt || !user.passwordHash) throw ApiException.unauthorized("Invalid email or password.");
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw ApiException.unauthorized("Invalid email or password.");
    const tokens = await this.issueTokens(user.id, user.email);
    return { user: this.publicUser(user), ...tokens };
  }

  async refresh(dto: RefreshDto) {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(dto.refreshToken);
    } catch {
      throw ApiException.unauthorized("Invalid or expired refresh token.");
    }
    if (payload.type !== "refresh") throw ApiException.unauthorized("Invalid token type.");

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.refreshTokenHash) throw ApiException.unauthorized("Session revoked. Please sign in again.");
    const matches = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
    if (!matches) {
      // Reuse of an old rotated token → revoke the session entirely.
      await this.prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: null } });
      throw ApiException.unauthorized("Refresh token reuse detected. Please sign in again.");
    }
    return this.issueTokens(user.id, user.email);
  }

  async logout(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
    return {};
  }

  /**
   * Sign in with Apple / Google.
   * Production flow: verify the identity token against Apple's / Google's
   * JWKS, extract the stable subject + email, then upsert the user.
   * Token verification is intentionally left to deployment configuration
   * (client IDs, team IDs); the endpoint shape matches the contract.
   */
  async oauthNotConfigured(provider: "apple" | "google"): Promise<never> {
    throw new ApiException(
      "OAUTH_NOT_CONFIGURED",
      `Sign in with ${provider === "apple" ? "Apple" : "Google"} requires provider credentials to be configured on the server.`,
      HttpStatus.NOT_IMPLEMENTED
    );
  }
}

@Controller("auth")
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AuthController {
  constructor(private auth: AuthService, private jwt: JwtService) {}

  @Public() @Post("register")
  register(@Body() dto: RegisterDto) { return this.auth.register(dto); }

  @Public() @Post("login")
  login(@Body() dto: LoginDto) { return this.auth.login(dto); }

  @Public() @Post("apple")
  apple() { return this.auth.oauthNotConfigured("apple"); }

  @Public() @Post("google")
  google() { return this.auth.oauthNotConfigured("google"); }

  @Public() @Post("refresh")
  refresh(@Body() dto: RefreshDto) { return this.auth.refresh(dto); }

  @Public() @Post("logout")
  async logout(@Body() body: { refreshToken?: string }) {
    // Best-effort revocation: identify the session from the refresh token.
    if (body?.refreshToken) {
      try {
        const p = await this.jwt.verifyAsync<{ sub: string }>(body.refreshToken);
        return this.auth.logout(p.sub);
      } catch { /* already invalid — nothing to revoke */ }
    }
    return {};
  }
}

@Module({ controllers: [AuthController], providers: [AuthService] })
export class AuthModule {}
