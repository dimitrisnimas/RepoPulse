import { createApplication } from "./bootstrap";
import { readConfig } from "./config";

async function bootstrap() {
  const config = readConfig();
  const app = await createApplication(config);
  await app.listen(config.port);
}

void bootstrap().catch(() => {
  // Never serialize framework errors: they can contain configuration or request data.
  console.error(
    "RepoPulse could not start. Check the documented environment configuration.",
  );
  process.exitCode = 1;
});
