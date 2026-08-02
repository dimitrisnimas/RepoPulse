import { readFileSync } from "node:fs";
import { join } from "node:path";

let cachedLogo: string | undefined;
export function privateActivityLogoDataUri() {
  cachedLogo ??= `data:image/png;base64,${readFileSync(join(process.cwd(), "public", "RepoPulse.png")).toString("base64")}`;
  return cachedLogo;
}
