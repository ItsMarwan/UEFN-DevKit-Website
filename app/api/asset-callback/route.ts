// app/api/asset-callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DISCORD_API = 'https://discord.com/api/v10';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=no_code`);
  }

  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/asset-callback`;

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
      console.error('Token exchange failed:', await tokenRes.text());
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=token_failed`);
    }

    const tokenData = await tokenRes.json();

    // Store the access token + expiry in a cookie for asset access
    const cookiePayload = JSON.stringify({
      access_token: tokenData.access_token,
      expires_at: Date.now() + tokenData.expires_in * 1000,
    });

    const redirectState = searchParams.get('state') || '';
    const safeNext = (() => {
      try {
        const decoded = Buffer.from(decodeURIComponent(redirectState), 'base64url').toString('utf-8');
        return decoded.startsWith('/') ? decoded : '/';
      } catch {
        return '/';
      }
    })();

    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${safeNext}`);
    response.cookies.set('asset_session', cookiePayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=internal`);
  }
}
