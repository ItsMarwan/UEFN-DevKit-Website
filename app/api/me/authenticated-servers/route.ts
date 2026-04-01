// app/api/me/authenticated-servers/route.ts
import { NextRequest, NextResponse } from 'next/server';

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { discord_user_id } = body;

    if (!discord_user_id) {
      return NextResponse.json(
        { error: 'Missing discord_user_id' },
        { status: 400 }
      );
    }

    // Call Flask endpoint
    const flaskRes = await fetch(`${FLASK_API_URL}/api/v1/authenticated-servers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discord_user_id }),
    });

    if (!flaskRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch authenticated servers' },
        { status: flaskRes.status }
      );
    }

    const data = await flaskRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching authenticated servers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
