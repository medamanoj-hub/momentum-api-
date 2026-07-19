import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * Contract-shaped error. Thrown anywhere in the app, it is rendered by
 * HttpErrorFilter as: { success: false, error: { code, message } }
 * Codes follow the API Specification: USER_NOT_FOUND, TASK_NOT_FOUND,
 * GOAL_NOT_FOUND, HABIT_NOT_FOUND, UNAUTHORIZED, VALIDATION_ERROR,
 * RATE_LIMIT_EXCEEDED, SYNC_CONFLICT, AI_PROVIDER_UNAVAILABLE, ...
 */
export class ApiException extends HttpException {
  constructor(public code: string, message: string, status: HttpStatus) {
    super({ code, message }, status);
  }

  static notFound(entity: "USER" | "TASK" | "GOAL" | "HABIT" | "PROJECT" | "JOURNAL" | "EVENT" | "SESSION", msg?: string) {
    return new ApiException(`${entity}_NOT_FOUND`, msg ?? `${entity.toLowerCase()} does not exist.`, HttpStatus.NOT_FOUND);
  }
  static unauthorized(msg = "Authentication required.") {
    return new ApiException("UNAUTHORIZED", msg, HttpStatus.UNAUTHORIZED);
  }
  static conflict(msg: string, code = "SYNC_CONFLICT") {
    return new ApiException(code, msg, HttpStatus.CONFLICT);
  }
  static validation(msg: string) {
    return new ApiException("VALIDATION_ERROR", msg, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
