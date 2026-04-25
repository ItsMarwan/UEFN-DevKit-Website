/**
 * Premium API - Island Lookup Endpoint
 * GET /api/v1/island/lookup?island_code=1234-1234-1234
 * 
 * Fetch detailed island statistics by code
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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const islandCode = searchParams.get("island_code");

    if (!islandCode) {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing island_code parameter",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const { status, data } = await proxyFlaskFetch(req, {
      endpoint: "island_lookup",
      parameters: {
        island_code: islandCode,
      },
    }, guildId);

    return NextResponse.json(data, {
      status,
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Island lookup endpoint error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch island data",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
