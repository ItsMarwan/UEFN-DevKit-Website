/*
  © 2026 UEFN DevKit.

  This file is part of the UEFN DevKit project and is intended
  for use only within uefndevkit.rweb.site and its official services.

  Unauthorized use, copying, modification, or redistribution
  of this file or its contents is strictly prohibited.
*/

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

    const islandCode = new URL(req.url).searchParams.get("island_code");
    if (!islandCode) {
      return NextResponse.json(
        { status: "error", message: "Missing island_code parameter", timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const { status, data } = await proxyFlaskFetch(req, {
      endpoint: "island_predict",
      parameters: { island_code: islandCode },
    }, auth.guildId);

    return NextResponse.json(data, { status, headers: { "Cache-Control": "no-cache" } });
  } catch (error) {
    console.error("Island predict endpoint error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to get island prediction", error: error instanceof Error ? error.message : "Unknown error", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}