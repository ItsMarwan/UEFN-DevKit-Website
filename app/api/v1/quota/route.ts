/**
 * Enterprise API Quota Endpoint
 * GET /api/v1/quota
 * 
 * Forwards to Flask backend at /api/v1/quota
 * Requires Authorization header with Bearer token
 */

import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/get-client-ip";

const FLASK_API_URL = process.env.FLASK_API_URL;
const DASHBOARD_TOKEN = process.env.DASHBOARD_API_TOKEN;

export async function GET(req: NextRequest) {
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

    // Forward to Flask backend with auth headers
    const response = await fetch(`${FLASK_API_URL}/api/v1/quota`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        "X-Discord-Server-ID": serverIdHeader,
        "X-Dashboard-Bypass-Token": DASHBOARD_TOKEN || "",
        Origin: originHeader,
        "X-Forwarded-For": getClientIp(req),
        "X-Forwarded-Proto": "https",
      },
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
    console.error("Quota endpoint error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to get quota",
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
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
