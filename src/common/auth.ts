import {
  CanActivate, createParamDecorator, ExecutionContext, Injectable, SetMetadata
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { ApiException } from "./api-error";

export const IS_PUBLIC = "isPublic";
/** Marks a route as reachable without a Bearer token (auth endpoints). */
export const Public = () => SetMetadata(IS_PUBLIC, true);

export interface JwtPayload {
  sub: string;              // user id
  email: string;
  type: "access" | "refresh";
}

/** Global guard: verifies `Authorization: Bearer <jwt>` on every route. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService, private reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw ApiException.unauthorized();

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      if (payload.type !== "access") throw new Error("wrong token type");
      req.user = payload;
      return true;
    } catch {
      throw ApiException.unauthorized("Invalid or expired token.");
    }
  }
}

/** Injects the authenticated user's id into a handler parameter. */
export const UserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
  return req.user!.sub;
});
