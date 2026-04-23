/**
 * Island API Endpoints
 * GET /api/v1/island/lookup?code=...
 * GET /api/v1/island/predict?code=...
 */

import { NextRequest, NextResponse } from "next/server";
import { proxyFlaskFetch } from "@/lib/flask-api-proxy";

export const dynamic = 'force-dynamic';

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

    const { status, data } = await proxyFlaskFetch(req, {
      endpoint: action === "predict" ? "island_predict" : "island_lookup",
      parameters: { island_code: code.trim() },
    });

    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Island endpoint error:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to process island request",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
