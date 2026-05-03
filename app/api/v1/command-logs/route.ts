import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/dashboard-auth";
import { proxyFlaskCommandLogs } from "@/lib/flask-api-proxy";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.ok === false) {
      return NextResponse.json(
        { status: "error", message: auth.message, timestamp: new Date().toISOString() },
        { status: auth.status }
      );
    }

    const { status, data } = await proxyFlaskCommandLogs(req, auth.guildId);

    return NextResponse.json(data, { status, headers: { "Cache-Control": "no-cache" } });
  } catch (error) {
    console.error("Command logs endpoint error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch command logs", error: error instanceof Error ? error.message : "Unknown error", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Discord-Server-ID",
    },
  });
}