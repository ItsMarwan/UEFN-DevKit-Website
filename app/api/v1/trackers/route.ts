import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/dashboard-auth";
import { proxyFlaskFetch } from "@/lib/flask-api-proxy";

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

    const { searchParams } = new URL(req.url);
    const { status, data } = await proxyFlaskFetch(req, {
      endpoint: "trackers",
      parameters: {
        limit:  parseInt(searchParams.get("limit")  || "100"),
        offset: parseInt(searchParams.get("offset") || "0"),
        type:   searchParams.get("type") || "",
      },
    }, auth.guildId);

    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Trackers endpoint error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch trackers", error: error instanceof Error ? error.message : "Unknown error", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}