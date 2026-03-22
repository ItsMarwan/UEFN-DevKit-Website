/**
 * Health Check Endpoint Proxy
 * GET /api/health
 * 
 * Proxies to Flask backend at /health
 */

import { NextResponse } from "next/server";

const FLASK_URL = process.env.FLASK_API_URL;

export async function GET() {
  try {
    const response = await fetch(`${FLASK_URL}/health`, {
      method: "GET",
      cache: "no-store",
      next: { revalidate: 0 },
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
