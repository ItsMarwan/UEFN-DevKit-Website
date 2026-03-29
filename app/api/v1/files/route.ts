/**
 * Enterprise API - Files Endpoint
 * GET /api/v1/files?what=customers|verse_scripts|trackers|guild_settings
 * Fetch data from various guild tables (read-only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/get-client-ip";

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL;
const DASHBOARD_TOKEN = process.env.DASHBOARD_API_TOKEN;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const what = searchParams.get("what") || "";
    const limit = searchParams.get("limit") || "100";
    const offset = searchParams.get("offset") || "0";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ status: "denied", message: "Missing Authorization header" }, { status: 401 });
    }

    const serverIdHeader = req.headers.get("X-Discord-Server-ID");
    if (!serverIdHeader) {
      return NextResponse.json({ status: "denied", message: "Missing X-Discord-Server-ID header" }, { status: 401 });
    }

    const originHeader = req.headers.get("Origin");

    const body = {
      endpoint: "files",
      parameters: {
        what,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    };

    const response = await fetch(`${FLASK_API_URL}/api/v1/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        "X-Discord-Server-ID": serverIdHeader,
        "X-Dashboard-Bypass-Token": DASHBOARD_TOKEN || "",
        Origin: originHeader || "",
        "X-Forwarded-For": getClientIp(req),
        "X-Forwarded-Proto": "https",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Files endpoint error:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to fetch files",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
