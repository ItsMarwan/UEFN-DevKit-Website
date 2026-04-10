/**
 * Command Logs Endpoint Proxy
 * GET /api/command-logs
 *
 * Proxies to Flask backend at /api/v1/command-logs
 */

import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const FLASK_URL = process.env.FLASK_API_URL;

export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guild_id');
    const limit = searchParams.get('limit') || '100';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const headers = new Headers();
    // Forward authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers.set('Authorization', authHeader);
    }

    let url = `${FLASK_URL}/api/v1/command-logs?limit=${limit}`;
    if (guildId) {
      url += `&guild_id=${guildId}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.ENTERPRISE_API_TOKEN || ''}`,
      },
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
    console.error("Command logs fetch error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch command logs",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}