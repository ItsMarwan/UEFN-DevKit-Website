/**
 * Premium API - Island Lookup Endpoint
 * GET /api/v1/island/lookup?island_code=1234-1234-1234
 * 
 * Fetch detailed island statistics by code
 */

import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/get-client-ip";

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL || "http://localhost:5000";
const PREMIUM_FETCH_URL = new URL("/api/v1/premium/fetch", FLASK_API_URL).toString();

export async function GET(req: NextRequest) {
  try {
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

    // Get headers
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

    const originHeader = req.headers.get("Origin");

    // Build request body for Flask
    const body = {
      endpoint: "island_lookup",
      parameters: {
        island_code: islandCode,
      },
    };

    // Forward to Flask backend
    const response = await fetch(PREMIUM_FETCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        "X-Discord-Server-ID": serverIdHeader,
        Origin: originHeader || "",
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
