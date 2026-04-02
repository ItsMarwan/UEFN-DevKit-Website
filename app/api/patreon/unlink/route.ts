// app/api/patreon/unlink/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const flaskRes = await fetch(`${FLASK_API_URL}/auth/patreon/unlink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await flaskRes.json();
    return NextResponse.json(data, { status: flaskRes.status });
  } catch (error) {
    console.error('Patreon unlink error:', error);
    return NextResponse.json(
      { error: 'Failed to unlink Patreon account' },
      { status: 500 }
    );
  }
}
