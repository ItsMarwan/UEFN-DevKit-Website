/**
 * Health Check Endpoint Proxy
 * GET /api/health
 * 
 * Proxies to Flask backend at /health
 */

import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const FLASK_URL = process.env.FLASK_API_URL;

export async function GET() {
  // Check if FLASK_URL is configured
  if (!FLASK_URL) {
    console.warn("FLASK_API_URL is not configured in environment variables");
    return NextResponse.json(
      {
        status: "error",
        message: "API server not configured",
        error: "FLASK_API_URL environment variable is missing",
      },
      { status: 503 }
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${FLASK_URL}/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to API server",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
