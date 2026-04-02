// app/api/patreon/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const discord_user_id = searchParams.get('discord_user_id');
    const guild_id = searchParams.get('guild_id');

    if (!discord_user_id || !guild_id) {
      return NextResponse.json(
        { error: 'Missing discord_user_id or guild_id' },
        { status: 400 }
      );
    }

    const flaskRes = await fetch(
      `${FLASK_API_URL}/auth/patreon/login?discord_user_id=${discord_user_id}&guild_id=${guild_id}`
    );

    const data = await flaskRes.json();
    return NextResponse.json(data, { status: flaskRes.status });
  } catch (error) {
    console.error('Patreon login error:', error);
    return NextResponse.json(
      { error: 'Failed to start OAuth flow' },
      { status: 500 }
    );
  }
}
