// app/api/patreon/callback/route.ts
// Handles Discord OAuth callback for the Patreon role-grant flow.
// Sets the same dashboard_session cookie so both flows share auth state.
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DISCORD_API = 'https://discord.com/api/v10';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Parse state
  let returnUrl = '/';
  if (stateParam) {
    try {
      const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
      returnUrl = decoded.returnUrl ?? '/';
    } catch {
      // ignore
    }
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}${returnUrl}&discord_auth=error`);
  }

  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
  const redirectUri = `${appUrl}/api/patreon/callback`;

  try {
    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${appUrl}${returnUrl}&discord_auth=error`);
    }

    const tokenData = await tokenRes.json();

    // Build session payload — same format as dashboard callback
    const cookiePayload = JSON.stringify({
      access_token: tokenData.access_token,
      expires_at: Date.now() + tokenData.expires_in * 1000,
    });

    // Append discord_auth=success so the page knows to auto-grant
    const separator = returnUrl.includes('?') ? '&' : '?';
    const finalReturn = `${appUrl}${returnUrl}${separator}discord_auth=success`;

    const response = NextResponse.redirect(finalReturn);
    response.cookies.set('dashboard_session', cookiePayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.redirect(`${appUrl}${returnUrl}&discord_auth=error`);
  }
}