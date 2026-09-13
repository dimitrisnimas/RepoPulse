import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { NextFunction, Request, Response } from "express";
import { AppModule } from "./app.module";
import type { Config } from "./config";

export async function createApplication(
  config: Config,
  transport: typeof fetch = fetch,
) {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.register(config, transport),
    {
      bodyParser: false,
      logger: ["error", "warn"],
      abortOnError: false,
    },
  );
  const server = app.getHttpAdapter().getInstance();
  server.disable("x-powered-by");
  server.disable("etag");
  server.set("strict routing", true);
  server.set("case sensitive routing", true);
  const logger = new Logger("HTTP");
  app.use((_request: Request, response: Response, next: NextFunction) => {
    const started = performance.now();
    response.setHeader("X-Request-Id", randomUUID());
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("X-Robots-Tag", "noindex, nofollow");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    );
    response.once("finish", () => {
      const durationMs = Math.round(performance.now() - started);
      if (durationMs > 5000)
        logger.warn(
          JSON.stringify({
            requestId: response.getHeader("X-Request-Id"),
            durationMs,
            status: response.statusCode,
          }),
        );
    });
    next();
  });
  return app;
}
