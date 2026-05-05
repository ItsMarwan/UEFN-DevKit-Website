import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/asset-callback`;

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'OAuth not configured' }, { status: 500 });
  }

  const url = new URL(req.url);
  const nextPath = url.searchParams.get('next') || '/';
  const encodedState = Buffer.from(String(nextPath)).toString('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds guilds.members.read',
    state: encodedState,
  });

  return NextResponse.redirect(
    `https://discord.com/oauth2/authorize?${params.toString()}`
  );
}
