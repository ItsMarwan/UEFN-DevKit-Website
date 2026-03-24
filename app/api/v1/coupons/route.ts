import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      status: "error",
      message: "Coupons endpoint has been removed",
      details: "The coupons feature was deprecated and has been fully removed as of March 2026.",
      timestamp: new Date().toISOString(),
    },
    { status: 410 }
  );
}