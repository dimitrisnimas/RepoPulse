import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ServiceError } from "./errors";
import { renderError } from "./render";

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger("HTTP");

  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const failure =
      error instanceof ServiceError
        ? error
        : error instanceof HttpException && error.getStatus() === 404
          ? new ServiceError("NOT_FOUND", 404)
          : new ServiceError("INTERNAL_ERROR", 500);
    response.setHeader("Cache-Control", "private, no-store");
    response.removeHeader("ETag");
    if (failure.status === 401)
      response.setHeader("WWW-Authenticate", "Bearer");
    if (failure.retryAfter)
      response.setHeader("Retry-After", String(failure.retryAfter));
    if (failure.status >= 500)
      this.logger.error(
        JSON.stringify({
          requestId: response.getHeader("X-Request-Id"),
          code: failure.code,
        }),
      );
    response.status(failure.status);
    if (request.path === "/activity.svg")
      response.type("image/svg+xml").send(renderError());
    else
      response.json({
        error: {
          code: failure.code,
          message: "The request could not be completed.",
        },
        requestId: response.getHeader("X-Request-Id"),
      });
  }
}
