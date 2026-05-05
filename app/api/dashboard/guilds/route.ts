import { NextRequest, NextResponse } from 'next/server';
import { requireWebsiteOnlyRequest } from '@/lib/website-only';
import { fetchBotGuildIds, isBotInGuild } from '@/lib/discord-bot-guilds';

const DISCORD_API = 'https://discord.com/api/v10';
export const dynamic = 'force-dynamic';

interface GuildPayload {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: number;
}

export async function GET(req: NextRequest) {
  const forbiddenResponse = requireWebsiteOnlyRequest(req);
  if (forbiddenResponse) return forbiddenResponse;

  const raw = req.cookies.get('dashboard_session')?.value;
  if (!raw) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let session: { access_token: string; expires_at: number };
  try {
    session = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Malformed session' }, { status: 401 });
  }

  if (!session.access_token || typeof session.expires_at !== 'number' || Date.now() > session.expires_at) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  try {
    const guildsRes = await fetch(`${DISCORD_API}/users/@me/guilds?limit=200`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    });

    if (!guildsRes.ok) {
      return NextResponse.json({ error: 'Unable to fetch guilds from Discord' }, { status: 401 });
    }

    const rawGuilds: GuildPayload[] = await guildsRes.json();
    const botGuildIds = await fetchBotGuildIds();

    const guilds = await Promise.all(
      rawGuilds.map(async (guild) => {
        const botPresent = botGuildIds ? botGuildIds.has(guild.id) : await isBotInGuild(guild.id);
        const perms = typeof guild.permissions === 'string' ? parseInt(guild.permissions, 10) : guild.permissions;
        const hasManagePerms = guild.owner || (perms & 0x8) !== 0 || (perms & 0x20) !== 0;
        return {
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          owner: guild.owner,
          permissions: perms,
          botPresent,
          hasManagePerms,
        };
      })
    );

    return NextResponse.json({ guilds }, { status: 200 });
  } catch (err) {
    console.error('[dashboard/guilds] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
