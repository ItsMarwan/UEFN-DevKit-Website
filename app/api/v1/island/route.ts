/**
 * Island API Endpoints
 * GET /api/v1/island/lookup?code=...
 * GET /api/v1/island/predict?code=...
 */

import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/get-client-ip";

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL;
const DASHBOARD_TOKEN = process.env.DASHBOARD_API_TOKEN;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const action = searchParams.get("action") || "lookup"; // lookup or predict

    if (!code) {
      return NextResponse.json(
        { status: "error", message: "Missing code parameter" },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ status: "denied", message: "Missing Authorization header" }, { status: 401 });
    }

    const serverIdHeader = req.headers.get("X-Discord-Server-ID");
    if (!serverIdHeader) {
      return NextResponse.json({ status: "denied", message: "Missing X-Discord-Server-ID header" }, { status: 401 });
    }

    const originHeader = req.headers.get("Origin");

    const endpoint = action === "predict" ? "island_predict" : "island_lookup";
    const body = {
      endpoint,
      parameters: { island_code: code.trim() },
    };

    // Use /api/v1/premium/fetch for premium endpoints
    const response = await fetch(`${FLASK_API_URL}/api/v1/premium/fetch`, {
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
    console.error("Island endpoint error:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to process island request",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
