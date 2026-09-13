import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { Express } from "express";
import { AppModule } from "./app.module.js";
import { configureApplication } from "./bootstrap.js";
import { ConfigurationError, readConfig } from "./config.js";

let startupStage = "configuration";

async function bootstrap() {
  const config = readConfig();
  startupStage = "Nest initialization";
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.register(config),
    {
      bodyParser: false,
      logger: ["error", "warn"],
      abortOnError: false,
    },
  );
  configureApplication(app);
  startupStage = "route initialization";
  await app.init();
  if (process.env.VERCEL !== "1") {
    startupStage = "HTTP listen";
    await app.listen(config.port);
  }
  return app.getHttpAdapter().getInstance() as Express;
}

// Vercel owns the HTTP listener. Export the initialized Express handler so module
// loading never waits for a listen callback intercepted by its runtime.
const server = await bootstrap().catch((error: unknown) => {
  // Never serialize framework errors: they can contain configuration or request data.
  const message =
    error instanceof ConfigurationError
      ? error.message
      : `Startup failed during ${startupStage}`;
  console.error(`RepoPulse: ${message}`);
  // Reject module loading instead of letting Vercel inspect an unstarted server.
  throw new Error(`RepoPulse: ${message}`);
});

export default server;
