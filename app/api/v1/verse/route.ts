/**
 * Enterprise API - Verse Scripts Endpoint
 * GET /api/v1/verse - List scripts
 * POST /api/v1/verse - Upload script
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionToken, getGuildIdFromUrl, getGuildIdFromRequestBody, verifyGuildAccess } from "@/lib/dashboard-auth";
import { proxyFlaskFetch } from "@/lib/flask-api-proxy";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const guildId = getGuildIdFromUrl(req);
    if (!guildId) {
      return NextResponse.json({
        status: "error",
        message: "Missing or invalid guild_id parameter",
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    const accessToken = getSessionToken(req);
    if (!accessToken) {
      return NextResponse.json({
        status: "denied",
        message: "Unauthorized",
        timestamp: new Date().toISOString(),
      }, { status: 401 });
    }

    if (!(await verifyGuildAccess(accessToken, guildId))) {
      return NextResponse.json({
        status: "denied",
        message: "Forbidden",
        timestamp: new Date().toISOString(),
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "100";
    const offset = searchParams.get("offset") || "0";

    const { status, data } = await proxyFlaskFetch(req, {
      endpoint: "verse_list",
      parameters: {
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    }, guildId);

    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Verse list endpoint error:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to fetch verse scripts",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const reqBody = await req.json();
    const guildId = getGuildIdFromRequestBody(reqBody);
    if (!guildId) {
      return NextResponse.json({
        status: "error",
        message: "Missing or invalid guild_id parameter",
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    const accessToken = getSessionToken(req);
    if (!accessToken) {
      return NextResponse.json({
        status: "denied",
        message: "Unauthorized",
        timestamp: new Date().toISOString(),
      }, { status: 401 });
    }

    if (!(await verifyGuildAccess(accessToken, guildId))) {
      return NextResponse.json({
        status: "denied",
        message: "Forbidden",
        timestamp: new Date().toISOString(),
      }, { status: 403 });
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
    return NextResponse.json({
      status: "error",
      message: "Failed to upload verse script",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
