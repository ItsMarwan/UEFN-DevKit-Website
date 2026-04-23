/**
 * Enterprise API - Reports Endpoint (List)
 * GET /api/v1/reports
 */

import { NextRequest, NextResponse } from "next/server";
import { proxyFlaskFetch } from "@/lib/flask-api-proxy";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "100";
    const offset = searchParams.get("offset") || "0";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ status: "denied", message: "Missing Authorization header" }, { status: 401 });
    }

    const serverIdHeader = req.headers.get("X-Discord-Server-ID");
    if (!serverIdHeader) {
      return NextResponse.json({ status: "denied", message: "Missing X-Discord-Server-ID header" }, { status: 401 });
    }

    const { status, data } = await proxyFlaskFetch(req, {
      endpoint: "reports",
      parameters: {
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });

    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Reports endpoint error:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to fetch reports",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
