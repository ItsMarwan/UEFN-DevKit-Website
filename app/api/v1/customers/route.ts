/**
 * Enterprise API - Customers Endpoint
 * GET /api/v1/customers
 * 
 * Fetch customer data with optional filtering by status
 */

import { NextRequest, NextResponse } from "next/server";

const FLASK_API_URL = process.env.FLASK_API_URL;

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "100";
    const offset = searchParams.get("offset") || "0";
    const filter = searchParams.get("filter") || "all";

    // Get headers
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        {
          status: "denied",
          message: "Missing Authorization header",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const serverIdHeader = req.headers.get("X-Discord-Server-ID");
    if (!serverIdHeader) {
      return NextResponse.json(
        {
          status: "denied",
          message: "Missing X-Discord-Server-ID header",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const originHeader = req.headers.get("Origin");

    // Build request body for Flask
    const body = {
      endpoint: "customers",
      parameters: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        filter,
      },
    };

    // Forward to Flask backend
    const response = await fetch(`${FLASK_API_URL}/api/v1/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        "X-Discord-Server-ID": serverIdHeader,
        Origin: originHeader || "",
        "X-Forwarded-For": req.ip || "unknown",
        "X-Forwarded-Proto": "http",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Customers endpoint error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch customers",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
