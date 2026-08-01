import { NextResponse } from "next/server";
import { env } from "@/config/env";
import { metricsSnapshot } from "@/server/observability/metrics";
import { secureCompareBearer } from "@/server/security/request-security";
export const runtime = "nodejs";
export function GET(request: Request) {
  if (!secureCompareBearer(request, env.CRON_SECRET)) return NextResponse.json({ status: "unauthorized" }, { status: 401, headers: { "Cache-Control": "private, no-store", "WWW-Authenticate": "Bearer" } });
  return NextResponse.json({ service: "repopulse", version: env.APP_VERSION, timestamp: new Date().toISOString(), ...metricsSnapshot() }, { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
