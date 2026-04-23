/**
 * Enterprise API - Verse Scripts Endpoint
 * GET /api/v1/verse-scripts
 * 
 * Fetch verse scripts with optional search filter
 */

import { NextRequest, NextResponse } from "next/server";
import { proxyFlaskFetch } from "@/lib/flask-api-proxy";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "100";
    const offset = searchParams.get("offset") || "0";
    const search = searchParams.get("search") || "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ status: "denied", message: "Missing Authorization header", timestamp: new Date().toISOString() }, { status: 401 });
    }

    const serverIdHeader = req.headers.get("X-Discord-Server-ID");
    if (!serverIdHeader) {
      return NextResponse.json({ status: "denied", message: "Missing X-Discord-Server-ID header", timestamp: new Date().toISOString() }, { status: 401 });
    }

    const { status, data } = await proxyFlaskFetch(req, {
      endpoint: "verse_scripts",
      parameters: { limit: parseInt(limit), offset: parseInt(offset), search },
    });

    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Verse scripts endpoint error:", error);
    return NextResponse.json({ status: "error", message: "Failed to fetch verse scripts", error: error instanceof Error ? error.message : "Unknown error", timestamp: new Date().toISOString() }, { status: 500 });
  }
}
