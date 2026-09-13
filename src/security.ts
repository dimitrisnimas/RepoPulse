import { createHash, timingSafeEqual } from "node:crypto";
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { CONFIG, type Config } from "./config";
import { ServiceError } from "./errors";

const ACCESS = "repopulse:access";
type Access = "health" | "svg";
export const Access = (value: Access) => SetMetadata(ACCESS, value);

@Injectable()
export class OperatorGuard implements CanActivate {
  private readonly expected: Buffer;
  constructor(
    @Inject(CONFIG) private readonly config: Config,
    private readonly reflector: Reflector,
  ) {
    this.expected = createHash("sha256").update(config.apiKey).digest();
  }

  canActivate(context: ExecutionContext): boolean {
    const access = this.reflector.get<Access>(ACCESS, context.getHandler());
    const request = context.switchToHttp().getRequest<Request>();
    if (
      !["/health", "/activity.svg", "/activity.json"].includes(request.path)
    ) {
      throw new ServiceError("NOT_FOUND", 404);
    }
    if (
      access !== "health" &&
      !(access === "svg" && this.config.publishActivity)
    ) {
      const header = request.headers.authorization ?? "";
      const match =
        header.length <= 300
          ? /^Bearer ([A-Za-z0-9_-]{43,256})$/i.exec(header)
          : null;
      const actual = createHash("sha256")
        .update(match?.[1] ?? "")
        .digest();
      if (!timingSafeEqual(actual, this.expected) || !match)
        throw new ServiceError("UNAUTHORIZED", 401);
    }
    // A fixed card has no public variants, selectors, or cache-busting parameters.
    if (request.originalUrl.length > 100 || request.originalUrl.includes("?")) {
      throw new ServiceError("INVALID_REQUEST", 400);
    }
    return true;
  }
}
