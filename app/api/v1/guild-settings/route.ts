/**
 * Enterprise API - Guild Settings Endpoint
 * GET /api/v1/guild-settings
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionToken, getGuildIdFromUrl, verifyGuildAccess } from "@/lib/dashboard-auth";
import { proxyFlaskFetch } from "@/lib/flask-api-proxy";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const guildId = getGuildIdFromUrl(req);
    if (!guildId) {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing or invalid guild_id parameter",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const accessToken = getSessionToken(req);
    if (!accessToken) {
      return NextResponse.json(
        {
          status: "denied",
          message: "Unauthorized",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    if (!(await verifyGuildAccess(accessToken, guildId))) {
      return NextResponse.json(
        {
          status: "denied",
          message: "Forbidden",
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    const body = {
      endpoint: "guild_settings",
      parameters: {},
    };

    const { status, data } = await proxyFlaskFetch(req, body, guildId);
    return NextResponse.json(data, {
      status,
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Guild settings endpoint error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch guild settings",
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
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
