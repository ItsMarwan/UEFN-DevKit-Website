/**
 * Enterprise API - Members Endpoint
 * GET /api/v1/members
 * 
 * Fetch members with optional role filter
 */

import { NextRequest, NextResponse } from "next/server";
import { proxyFlaskFetch } from "@/lib/flask-api-proxy";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "100";
    const offset = searchParams.get("offset") || "0";
    const role = searchParams.get("role") || "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ status: "denied", message: "Missing Authorization header", timestamp: new Date().toISOString() }, { status: 401 });
    }

    const serverIdHeader = req.headers.get("X-Discord-Server-ID");
    if (!serverIdHeader) {
      return NextResponse.json({ status: "denied", message: "Missing X-Discord-Server-ID header", timestamp: new Date().toISOString() }, { status: 401 });
    }

    const { status, data } = await proxyFlaskFetch(req, {
      endpoint: "members",
      parameters: { limit: parseInt(limit), offset: parseInt(offset), role },
    });

    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Members endpoint error:", error);
    return NextResponse.json({ status: "error", message: "Failed to fetch members", error: error instanceof Error ? error.message : "Unknown error", timestamp: new Date().toISOString() }, { status: 500 });
  }
}
