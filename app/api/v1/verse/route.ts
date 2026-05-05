/*
  © 2026 UEFN DevKit.

  This file is part of the UEFN DevKit project and is intended
  for use only within uefndevkit.rweb.site and its official services.

  Unauthorized use, copying, modification, or redistribution
  of this file or its contents is strictly prohibited.
*/

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, getGuildIdFromRequestBody } from "@/lib/dashboard-auth";
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
      endpoint: "verse_list",
      parameters: {
        limit:  parseInt(searchParams.get("limit")  || "100"),
        offset: parseInt(searchParams.get("offset") || "0"),
      },
    }, auth.guildId);

    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Verse list endpoint error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch verse scripts", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const reqBody = await req.json();

    // For POST, guild_id can come from the body, header, or query string
    const guildId =
      getGuildIdFromRequestBody(reqBody) ??
      (req.headers.get("X-Discord-Server-ID")?.trim().match(/^\d{17,20}$/)
        ? req.headers.get("X-Discord-Server-ID")!.trim()
        : null);

    if (!guildId) {
      return NextResponse.json(
        { status: "error", message: "Missing or invalid guild_id parameter", timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    // Validate auth (api key or session)
    const auth = await authenticateRequest(req);
    if (auth.ok === false) {
      return NextResponse.json(
        { status: "error", message: auth.message, timestamp: new Date().toISOString() },
        { status: auth.status }
      );
    }

    const payload = { ...reqBody } as Record<string, unknown>;
    delete payload.guild_id;
    delete payload.guildId;

    const { status, data } = await proxyFlaskFetch(req, {
      endpoint: "verse_upload",
      parameters: payload,
    }, guildId);

    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Verse upload endpoint error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to upload verse script", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}