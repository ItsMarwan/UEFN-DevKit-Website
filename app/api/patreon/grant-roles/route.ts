// app/api/patreon/grant-roles/route.ts
// Verifies the logged-in Discord user's Patreon membership via Flask server
// and grants the corresponding Discord role(s) using the bot token.
//
// Calls the Flask server's /api/v1/patreon/verify-email endpoint which:
// - Fetches Patreon data from Patreon API
// - Compares emails internally on the server
// - Grants roles if membership is found
// - Returns results without exposing Patreon data to client

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DISCORD_API = 'https://discord.com/api/v10';

export async function POST(req: NextRequest) {
  // 1. Verify session cookie (same dashboard_session cookie used everywhere)
  const raw = req.cookies.get('dashboard_session')?.value;
  if (!raw) {
    return NextResponse.json(
      { error: 'Not authenticated. Please log in with Discord first.' },
      { status: 401 }
    );
  }

  let session: { access_token: string; expires_at: number };
  try {
    session = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
  }

  if (!session.access_token || Date.now() > session.expires_at) {
    return NextResponse.json(
      { error: 'Session expired. Please log in again.' },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { guildId } = body as { guildId?: string };

  if (!guildId) {
    return NextResponse.json({ error: 'Missing guildId' }, { status: 400 });
  }

  // 2. Fetch the Discord user (need email + Discord ID)
  const userRes = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  });

  if (!userRes.ok) {
    return NextResponse.json(
      { error: 'Could not fetch your Discord account. Please log in again.' },
      { status: 401 }
    );
  }

  const discordUser = await userRes.json();
  const discordEmail: string | undefined = discordUser.email;
  const discordId: string = discordUser.id;

  if (!discordEmail) {
    return NextResponse.json(
      {
        error:
          'Your Discord account does not have a verified email address. Please verify your email in Discord settings first.',
      },
      { status: 400 }
    );
  }

  // 3. Call Flask server for Patreon verification
  const flaskApiUrl = process.env.FLASK_API_URL || 'http://localhost:5000';
  const verificationPayload = {
    guild_id: guildId,
    discord_user_id: discordId,
    discord_email: discordEmail,
    discord_username: `${discordUser.username}#${discordUser.discriminator || '0000'}`,
  };

  try {
    const verificationRes = await fetch(`${flaskApiUrl}/api/v1/patreon/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verificationPayload),
    });

    const verificationData = await verificationRes.json();

    if (!verificationRes.ok) {
      // Return the error from Flask server
      return NextResponse.json(
        { error: verificationData.error || 'Patreon verification failed' },
        { status: verificationRes.status }
      );
    }

    // Success! Return the results
    return NextResponse.json({
      success: true,
      grantedRoles: verificationData.granted_roles || [],
      patronName: verificationData.patron_name || '',
      tierNames: verificationData.tier_names || [],
      discordUser: {
        id: discordId,
        username: discordUser.username,
      },
    });

  } catch (error) {
    console.error('[patreon/grant-roles] Failed to call Flask API:', error);
    return NextResponse.json(
      { error: 'Could not connect to verification service. Please try again.' },
      { status: 503 }
    );
  }
}