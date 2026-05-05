/*
  © 2026 UEFN DevKit.

  This file is part of the UEFN DevKit project and is intended
  for use only within uefndevkit.rweb.site and its official services.

  Unauthorized use, copying, modification, or redistribution
  of this file or its contents is strictly prohibited.
*/

/**
 * Enterprise API Admin Logs Endpoint Proxy
 * GET /api/v1/admin/logs
 * 
 * ⚠️ DISABLED FOR NOW - Will be enabled later
 * Proxies to Flask backend at /api/v1/admin/logs
 * Requires Authorization header with Bearer token
 * Query params: ?limit=50&offset=0
 */

/*
  © 2026 UEFN DevKit.

  This file is part of the UEFN DevKit project and is intended
  for use only within uefndevkit.rweb.site and its official services.

  Unauthorized use, copying, modification, or redistribution
  of this file or its contents is strictly prohibited.
*/

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Admin routes disabled for now
  return NextResponse.json(
    {
      status: "disabled",
      message: "Admin logs endpoint is not available yet",
      timestamp: new Date().toISOString(),
    },
    { status: 403 }
  );
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
