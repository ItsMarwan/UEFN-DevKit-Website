/**
 * Enterprise API - Coupons Endpoint
 * GET /api/v1/coupons
 * 
 * Fetch coupons with optional active_only filter
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "100";
    const offset = searchParams.get("offset") || "0";
    const active_only = searchParams.get("active_only") === "true";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { status: "denied", message: "Missing Authorization header", timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    const serverIdHeader = req.headers.get("X-Discord-Server-ID");
    if (!serverIdHeader) {
      return NextResponse.json(
        { status: "denied", message: "Missing X-Discord-Server-ID header", timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    const originHeader = req.headers.get("Origin");

    const body = {
      endpoint: "coupons",
      parameters: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        active_only,
      },
    };

    const response = await fetch(`${FLASK_API_URL}/api/v1/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        "X-Discord-Server-ID": serverIdHeader,
        Origin: originHeader || "",
        "X-Forwarded-For": req.ip || "unknown",
        "X-Forwarded-Proto": "http",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status, headers: { "Cache-Control": "no-cache" } });
  } catch (error) {
    console.error("Coupons endpoint error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch coupons",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
