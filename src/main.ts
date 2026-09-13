import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { configureApplication } from "./bootstrap";
import { readConfig } from "./config";

async function bootstrap() {
  const config = readConfig();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.register(config),
    {
      bodyParser: false,
      logger: ["error", "warn"],
      abortOnError: false,
    },
  );
  configureApplication(app);
  await app.listen(config.port);
}

void bootstrap().catch(() => {
  // Never serialize framework errors: they can contain configuration or request data.
  console.error(
    "RepoPulse could not start. Check the documented environment configuration.",
  );
  process.exitCode = 1;
});
