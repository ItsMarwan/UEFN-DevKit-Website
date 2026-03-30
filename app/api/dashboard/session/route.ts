// app/api/dashboard/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isBotInGuild } from '@/lib/discord-bot-guilds';

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

    const url = new URL(req.url);
    const isLightweight = url.searchParams.get('lightweight') === 'true';

    // Fetch user info
    const userRes = await fetchWithTimeout(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    }, 8000);

    if (!userRes.ok) {
      return NextResponse.json({ error: 'Discord token invalid or expired' }, { status: 401 });
    }

    const user = await userRes.json();

    if (isLightweight) {
      // Return only user info for lightweight requests
      return NextResponse.json({ user });
    }

    // Fetch guilds for full session
    const guildsRes = await fetchWithTimeout(`${DISCORD_API}/users/@me/guilds?limit=200`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    }, 8000);

    const allGuilds: Guild[] = guildsRes.ok ? await guildsRes.json() : [];

    // Filter guilds where the bot is present by checking each one individually
    // Use limited concurrency to avoid overwhelming Discord's API
    const MAX_CONCURRENT_CHECKS = 5;
    const botsGuilds: Guild[] = [];

    for (let i = 0; i < allGuilds.length; i += MAX_CONCURRENT_CHECKS) {
      const batch = allGuilds.slice(i, i + MAX_CONCURRENT_CHECKS);
      const batchResults = await Promise.all(
        batch.map(async (guild) => {
          try {
            const botPresent = await isBotInGuild(guild.id);
            return botPresent ? guild : null;
          } catch (error) {
            console.error(`Error checking bot presence in guild ${guild.id}:`, error);
            return null;
          }
        })
      );

      // Add successful results to the list
      botsGuilds.push(...batchResults.filter((g): g is Guild => g !== null));

      // Small delay between batches to be respectful
      if (i + MAX_CONCURRENT_CHECKS < allGuilds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

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