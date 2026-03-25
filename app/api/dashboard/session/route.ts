// app/api/dashboard/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchBotGuildIds } from '@/lib/discord-bot-guilds';

export const dynamic = 'force-dynamic';

const DISCORD_API = 'https://discord.com/api/v10';
const REQUEST_TIMEOUT = 15000;

// Create fetch with timeout
async function fetchWithTimeout(url: string, init?: Omit<RequestInit, 'signal'>, timeoutMs: number = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: number;
}

interface TaggedGuild extends Guild {
  hasPerms: boolean;
}

export async function GET(req: NextRequest) {
  try {
    const raw = req.cookies.get('dashboard_session')?.value;
    if (!raw) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    let session: { access_token: string; expires_at: number };
    try {
      session = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Malformed session' }, { status: 401 });
    }

    if (!session.access_token || !session.expires_at) {
      return NextResponse.json({ error: 'Invalid session structure' }, { status: 401 });
    }
    if (Date.now() > session.expires_at) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Fetch user info and their guild list in parallel with timeouts
    const [userRes, guildsRes, botGuildIds] = await Promise.all([
      fetchWithTimeout(`${DISCORD_API}/users/@me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      }, 8000),
      fetchWithTimeout(`${DISCORD_API}/users/@me/guilds?limit=200`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      }, 8000),
      fetchBotGuildIds(),
    ]);

    if (!userRes.ok) {
      return NextResponse.json({ error: 'Discord token invalid or expired' }, { status: 401 });
    }

    const user = await userRes.json();
    const allGuilds: Guild[] = guildsRes.ok ? await guildsRes.json() : [];

    // Filter 1: Only include guilds where the bot is present
    const botsGuilds = botGuildIds
      ? allGuilds.filter((g) => botGuildIds.has(g.id))
      : [];

    // Filter 2: Tag each guild with permission check (admin or owner)
    const MANAGE_GUILD = 0x20;
    const ADMINISTRATOR = 0x8;

    const filteredGuilds: TaggedGuild[] = botsGuilds
      .map((g) => {
        const perms = typeof g.permissions === 'string'
          ? parseInt(g.permissions)
          : g.permissions;

        const hasPerms =
          g.owner ||
          (perms & ADMINISTRATOR) !== 0 ||
          (perms & MANAGE_GUILD) !== 0;

        return { ...g, hasPerms };
      });
      // Include ALL guilds the bot is in, regardless of permissions
      // Frontend will show them in separate sections

    return NextResponse.json({ user, guilds: filteredGuilds });
  } catch (err) {
    console.error('[session] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}