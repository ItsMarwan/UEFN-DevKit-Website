// app/api/patreon/discord-auth/route.ts
// Initiates Discord OAuth for the Patreon page (separate from dashboard OAuth)
// Stores the return URL so we can redirect back after auth
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const returnUrl = searchParams.get('return') ?? '/';
  const guildId = searchParams.get('guildId') ?? '';

  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !appUrl) {
    return NextResponse.json({ error: 'OAuth not configured' }, { status: 500 });
  }

  // Use the same dashboard callback — it sets the same cookie
  // We encode the return URL as state so callback can redirect there
  const state = Buffer.from(JSON.stringify({ returnUrl, guildId, patreon: true })).toString('base64url');

  const redirectUri = `${appUrl}/api/patreon/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email guilds',
    state,
  });

  return NextResponse.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
}