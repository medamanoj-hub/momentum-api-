import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import { Response } from "express";

/** Renders every error as: { success: false, error: { code, message } } */
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_SERVER_ERROR";
    let message = "Something went wrong.";

    if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      code = "RATE_LIMIT_EXCEEDED";
      message = "Too many requests. Please slow down.";
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as { code?: string; message?: string | string[] } | string;
      if (typeof body === "object" && body !== null) {
        code = body.code ?? defaultCode(status);
        const m = body.message;
        message = Array.isArray(m) ? m.join(" ") : m ?? exception.message;
        if (Array.isArray(m)) code = "VALIDATION_ERROR"; // class-validator output
      } else {
        code = defaultCode(status);
        message = exception.message;
      }
    } else if (isPrismaKnownError(exception)) {
      if (exception.code === "P2025") { status = 404; code = "NOT_FOUND"; message = "Record does not exist."; }
      else if (exception.code === "P2002") { status = 409; code = "SYNC_CONFLICT"; message = "A record with this value already exists."; }
    }

    res.status(status).json({ success: false, error: { code, message } });
  }
}

function defaultCode(status: number): string {
  const map: Record<number, string> = {
    400: "BAD_REQUEST", 401: "UNAUTHORIZED", 403: "FORBIDDEN", 404: "NOT_FOUND",
    409: "CONFLICT", 422: "VALIDATION_ERROR", 429: "RATE_LIMIT_EXCEEDED"
  };
  return map[status] ?? "INTERNAL_SERVER_ERROR";
}

function isPrismaKnownError(e: unknown): e is { code: string } {
  return typeof e === "object" && e !== null && "code" in e &&
    typeof (e as { code: unknown }).code === "string" && (e as { code: string }).code.startsWith("P");
}
