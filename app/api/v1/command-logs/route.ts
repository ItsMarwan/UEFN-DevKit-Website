/**
 * Enterprise API - Command Logs Endpoint
 * GET /api/v1/command-logs
 *
 * Forwards auth headers and query params to Flask.
 */

import { NextRequest, NextResponse } from "next/server";
import { proxyFlaskCommandLogs } from "@/lib/flask-api-proxy";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const guildId = searchParams.get("guild_id");

    if (!guildId) {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing guild_id parameter",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        {
          status: "denied",
          message: "Missing Authorization header",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const serverIdHeader = req.headers.get("X-Discord-Server-ID");
    if (!serverIdHeader) {
      return NextResponse.json(
        {
          status: "denied",
          message: "Missing X-Discord-Server-ID header",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const { status, data } = await proxyFlaskCommandLogs(req);

    return NextResponse.json(data, {
      status,
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Command logs endpoint error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch command logs",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Discord-Server-ID",
      },
    }
  );
}
