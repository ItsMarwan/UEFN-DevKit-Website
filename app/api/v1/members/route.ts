/**
 * Enterprise API - Members Endpoint
 * GET /api/v1/members
 * 
 * Fetch members with optional role filter
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionToken, getGuildIdFromUrl, verifyGuildAccess } from "@/lib/dashboard-auth";
import { proxyFlaskFetch } from "@/lib/flask-api-proxy";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const guildId = getGuildIdFromUrl(req);
    if (!guildId) {
      return NextResponse.json({ status: "error", message: "Missing or invalid guild_id parameter", timestamp: new Date().toISOString() }, { status: 400 });
    }

    const accessToken = getSessionToken(req);
    if (!accessToken) {
      return NextResponse.json({ status: "denied", message: "Unauthorized", timestamp: new Date().toISOString() }, { status: 401 });
    }

    if (!(await verifyGuildAccess(accessToken, guildId))) {
      return NextResponse.json({ status: "denied", message: "Forbidden", timestamp: new Date().toISOString() }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "100";
    const offset = searchParams.get("offset") || "0";
    const role = searchParams.get("role") || "";

    const { status, data } = await proxyFlaskFetch(req, {
      endpoint: "members",
      parameters: { limit: parseInt(limit), offset: parseInt(offset), role },
    }, guildId);

    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Members endpoint error:", error);
    return NextResponse.json({ status: "error", message: "Failed to fetch members", error: error instanceof Error ? error.message : "Unknown error", timestamp: new Date().toISOString() }, { status: 500 });
  }
}
