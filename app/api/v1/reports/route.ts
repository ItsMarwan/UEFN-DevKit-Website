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

    const { searchParams } = new URL(req.url);
    const { status, data } = await proxyFlaskFetch(req, {
      endpoint: "reports",
      parameters: {
        limit:  parseInt(searchParams.get("limit")  || "100"),
        offset: parseInt(searchParams.get("offset") || "0"),
      },
    }, auth.guildId);

    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Reports endpoint error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch reports", error: error instanceof Error ? error.message : "Unknown error", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}