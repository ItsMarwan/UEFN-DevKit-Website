/**
 * Enterprise API - Guild Settings Endpoint
 * GET /api/v1/guild-settings
 */

import { NextRequest, NextResponse } from "next/server";
import { proxyFlaskFetch } from "@/lib/flask-api-proxy";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ status: "denied", message: "Missing Authorization header", timestamp: new Date().toISOString() }, { status: 401 });
    }

    const serverIdHeader = req.headers.get("X-Discord-Server-ID");
    if (!serverIdHeader) {
      return NextResponse.json({ status: "denied", message: "Missing X-Discord-Server-ID header", timestamp: new Date().toISOString() }, { status: 401 });
    }

    const body = {
      endpoint: "guild_settings",
      parameters: {},
    };

    const { status, data } = await proxyFlaskFetch(req, body);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Guild settings endpoint error:", error);
    return NextResponse.json({ status: "error", message: "Failed to fetch guild settings", error: error instanceof Error ? error.message : "Unknown error", timestamp: new Date().toISOString() }, { status: 500 });
  }
}
