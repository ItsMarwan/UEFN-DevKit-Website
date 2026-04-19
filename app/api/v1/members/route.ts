/**
 * Enterprise API - Members Endpoint
 * GET /api/v1/members
 * 
 * Fetch members with optional role filter
 */

import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/get-client-ip";

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "100";
    const offset = searchParams.get("offset") || "0";
    const role = searchParams.get("role") || "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ status: "denied", message: "Missing Authorization header", timestamp: new Date().toISOString() }, { status: 401 });
    }

    const serverIdHeader = req.headers.get("X-Discord-Server-ID");
    if (!serverIdHeader) {
      return NextResponse.json({ status: "denied", message: "Missing X-Discord-Server-ID header", timestamp: new Date().toISOString() }, { status: 401 });
    }

    const originHeader = req.headers.get("Origin");

    const response = await fetch(`${FLASK_API_URL}/api/v1/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        "X-Discord-Server-ID": serverIdHeader,
        Origin: originHeader || "",
        "X-Forwarded-For": getClientIp(req),
        "X-Forwarded-Proto": "https",
      },
      body: JSON.stringify({
        endpoint: "members",
        parameters: { limit: parseInt(limit), offset: parseInt(offset), role },
      }),
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Members endpoint error:", error);
    return NextResponse.json({ status: "error", message: "Failed to fetch members", error: error instanceof Error ? error.message : "Unknown error", timestamp: new Date().toISOString() }, { status: 500 });
  }
}
