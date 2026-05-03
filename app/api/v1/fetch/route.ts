import { NextRequest, NextResponse } from "next/server";
import { isApiKeyRequest, getGuildIdFromRequestBody, getSessionToken, verifyGuildAccess } from "@/lib/dashboard-auth";
import { proxyFlaskFetch } from "@/lib/flask-api-proxy";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // guild_id lives in the request body for this endpoint
    const guildId = getGuildIdFromRequestBody(body);
    if (!guildId) {
      return NextResponse.json(
        { status: "error", message: "Missing or invalid guild_id parameter", timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    // API-key path
    if (!isApiKeyRequest(req)) {
      const accessToken = getSessionToken(req);
      if (!accessToken) {
        return NextResponse.json(
          { status: "denied", message: "Unauthorized", timestamp: new Date().toISOString() },
          { status: 401 }
        );
      }
      if (!(await verifyGuildAccess(accessToken, guildId))) {
        return NextResponse.json(
          { status: "denied", message: "Forbidden", timestamp: new Date().toISOString() },
          { status: 403 }
        );
      }
    }

    const { status, data } = await proxyFlaskFetch(req, body, guildId);

    return NextResponse.json(data, { status, headers: { "Cache-Control": "no-cache" } });
  } catch (error) {
    console.error("Fetch endpoint error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch data", error: error instanceof Error ? error.message : "Unknown error", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Discord-Server-ID",
    },
  });
}