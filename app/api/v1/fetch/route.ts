/**
 * Enterprise API Fetch Endpoint
 * POST /api/v1/fetch
 * 
 * Forwards requests to Flask backend with full auth headers
 * Requires Authorization header with Bearer token
 */

import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/get-client-ip";

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL;

export async function POST(req: NextRequest) {
  try {
    // Get authorization header
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

    // Get Discord server ID header
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

    // Get Origin header (for domain whitelisting)
    const originHeader = req.headers.get("Origin");

    // Get request body
    const body = await req.json();

    // Forward to Flask backend with all auth headers
    const response = await fetch(`${FLASK_API_URL}/api/v1/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        "X-Discord-Server-ID": serverIdHeader,
        Origin: originHeader,
        "X-Forwarded-For": getClientIp(req),
        "X-Forwarded-Proto": "https",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Fetch endpoint error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch data",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
