// app/api/patreon/verify/route.ts
/*
  © 2026 UEFN DevKit.

  This file is part of the UEFN DevKit project and is intended
  for use only within uefndevkit.rweb.site and its official services.

  Unauthorized use, copying, modification, or redistribution
  of this file or its contents is strictly prohibited.
*/

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const flaskRes = await fetch(`${FLASK_API_URL}/auth/patreon/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await flaskRes.json();
    return NextResponse.json(data, { status: flaskRes.status });
  } catch (error) {
    console.error('Patreon verify error:', error);
    return NextResponse.json(
      { error: 'Failed to verify Patreon membership' },
      { status: 500 }
    );
  }
}
