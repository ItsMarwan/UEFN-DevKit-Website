import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DISCORD_API = 'https://discord.com/api/v10';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

function getSessionToken(req: NextRequest): string | null {
  const raw = req.cookies.get('dashboard_session')?.value;
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as { access_token: string; expires_at: number };
    if (!session.access_token || Date.now() > session.expires_at) return null;
    return session.access_token;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const sessionToken = getSessionToken(req);
  if (!sessionToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'Role granting is not configured' }, { status: 503 });
  }

  let body: { guildId?: string; assetId?: string; roleId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { guildId, assetId, roleId } = body;
  if (!guildId || !roleId) {
    return NextResponse.json({ error: 'Missing guildId or roleId' }, { status: 400 });
  }

  try {
    // Fetch user info from Discord
    const userRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${sessionToken}` },
      cache: 'no-store',
    });

    if (!userRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch user info' }, { status: 401 });
    }

    const user = await userRes.json();
    const userId = user.id;

    // Check if user is a member of the guild and fetch their member info
    const memberRes = await fetch(`${DISCORD_API}/guilds/${guildId}/members/${userId}`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
      cache: 'no-store',
    });

    if (!memberRes.ok) {
      return NextResponse.json(
        { error: 'You are not a member of this server.' },
        { status: 403 }
      );
    }

    const member = await memberRes.json();

    // Check if user already has the role
    const memberRoles = (member.roles || []) as string[];
    if (memberRoles.includes(roleId)) {
      return NextResponse.json(
        {
          success: true,
          message: 'You already have this role.',
          roleId,
          assetId,
        },
        { status: 200 }
      );
    }

    // Add the role to the member
    const addRoleRes = await fetch(
      `${DISCORD_API}/guilds/${guildId}/members/${userId}/roles/${roleId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!addRoleRes.ok) {
      const errorText = await addRoleRes.text();
      console.error('[asset-link/grant-role] Failed to add role:', addRoleRes.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to grant role. The bot may lack permission or the role may not exist.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Role granted successfully!',
        roleId,
        assetId,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[asset-link/grant-role]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
