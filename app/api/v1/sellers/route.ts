/**
 * Premium API - Sellers Endpoint
 * GET /api/v1/sellers - List sellers
 * POST /api/v1/sellers - Create seller profile
 */

import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/get-client-ip";

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL;
const DASHBOARD_TOKEN = process.env.DASHBOARD_API_TOKEN;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";
    const listedOnly = searchParams.get("listed_only") === "true";

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
      endpoint: "sellers",
      parameters: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        listed_only: listedOnly,
      },
    };

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
    console.error("Sellers list endpoint error:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to fetch sellers",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ status: "denied", message: "Missing Authorization header" }, { status: 401 });
    }

    const serverIdHeader = req.headers.get("X-Discord-Server-ID");
    if (!serverIdHeader) {
      return NextResponse.json({ status: "denied", message: "Missing X-Discord-Server-ID header" }, { status: 401 });
    }

    const originHeader = req.headers.get("Origin");
    const reqBody = await req.json();

    const body = {
      endpoint: "seller_create",
      parameters: reqBody,
    };

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
    console.error("Seller create endpoint error:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to create seller profile",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
