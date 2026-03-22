// app/api/dashboard/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DISCORD_API = 'https://discord.com/api/v10';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=no_code`);
  }

  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard/callback`;

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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=token_failed`);
    }

    const tokenData = await tokenRes.json();

    // Store ONLY the access token + expiry in the cookie.
    // Storing user/guilds data here bloats the cookie past 4KB and it gets silently dropped.
    // The session route re-fetches user and guilds fresh from Discord on each call.
    const cookiePayload = JSON.stringify({
      access_token: tokenData.access_token,
      expires_at: Date.now() + tokenData.expires_in * 1000,
    });

    // Also upsert user to Supabase in the background — fetch user+guilds here for that only
    try {
      const [userRes, guildsRes] = await Promise.all([
        fetch(`${DISCORD_API}/users/@me`, { headers: { Authorization: `Bearer ${tokenData.access_token}` } }),
        fetch(`${DISCORD_API}/users/@me/guilds`, { headers: { Authorization: `Bearer ${tokenData.access_token}` } }),
      ]);
      const userData = await userRes.json();
      const guildsData = await guildsRes.json();

      const supabaseApiToken = process.env.SUPABASE_API_TOKEN;
      if (supabaseApiToken) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/supabase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseApiToken}`,
          },
          body: JSON.stringify({
            operation: 'upsert_user',
            discord_id: userData.id,
            data: {
              discord_id: userData.id,
              discord_username: userData.username,
              discord_email: userData.email ?? '',
              discord_avatar_url: userData.avatar
                ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
                : '',
              managed_guild_ids: guildsData
                .filter((g: { permissions: number; owner: boolean }) =>
                  (parseInt(g.permissions.toString()) & 0x20) !== 0 || g.owner
                )
                .map((g: { id: string }) => g.id),
            },
          }),
        }).catch((e) => console.error('Supabase upsert failed:', e));
      }
    } catch (e) {
      console.error('Background upsert error (non-fatal):', e);
    }

    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);
    response.cookies.set('dashboard_session', cookiePayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=internal`);
  }
}