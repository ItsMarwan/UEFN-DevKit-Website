/**
 * Enterprise API - Files Endpoint
 * GET /api/v1/files
 *
 * Fetches records from Supabase through the Flask fetch proxy.
 */

import { NextRequest, NextResponse } from "next/server";
import { proxyFlaskFetch } from "@/lib/flask-api-proxy";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const what = searchParams.get("what") || "";
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

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

    const { status, data } = await proxyFlaskFetch(req, {
      endpoint: "files",
      parameters: {
        what,
        limit,
        offset,
      },
    });

    return NextResponse.json(data, {
      status,
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Files endpoint error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch files",
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
