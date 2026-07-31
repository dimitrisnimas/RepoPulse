import { NextResponse } from "next/server";
import{env}from"@/config/env";

export function GET() {
  return NextResponse.json({ status: "ok", service: "repopulse", timestamp: new Date().toISOString(),version:env.APP_VERSION });
}
