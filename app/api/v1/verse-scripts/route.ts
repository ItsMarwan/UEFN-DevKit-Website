/**
 * Enterprise API - Verse Scripts Endpoint
 * GET /api/v1/verse-scripts
 * 
 * Forward auth and query params to the Flask endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { proxyFlaskVerseScripts } from "@/lib/flask-api-proxy";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
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

    const { status, data } = await proxyFlaskVerseScripts(req);

    return NextResponse.json(data, {
      status,
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Verse scripts endpoint error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch verse scripts",
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
