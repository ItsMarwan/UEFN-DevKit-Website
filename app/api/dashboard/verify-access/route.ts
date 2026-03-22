// app/api/dashboard/verify-access/route.ts
// Checks if the logged-in user has manage perms for a specific guild.
// Also verifies that the bot is in the guild.
// Called before loading the guild dashboard to prevent URL-guessing attacks.
import { NextRequest, NextResponse } from 'next/server';
import { isBotInGuild } from '@/lib/discord-bot-guilds';

export const dynamic = 'force-dynamic';
const DISCORD_API = 'https://discord.com/api/v10';

export async function GET(req: NextRequest) {
  const raw = req.cookies.get('dashboard_session')?.value;
  if (!raw) return NextResponse.json({ hasAccess: false, reason: 'not_authenticated' }, { status: 401 });

  let session: { access_token: string; expires_at: number };
  try { session = JSON.parse(raw); } catch { return NextResponse.json({ hasAccess: false }, { status: 401 }); }
  if (!session.access_token || Date.now() > session.expires_at)
    return NextResponse.json({ hasAccess: false, reason: 'session_expired' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const guildId = searchParams.get('guildId');
  if (!guildId) return NextResponse.json({ hasAccess: false, reason: 'missing_guild' }, { status: 400 });

  try {
    const guildsRes = await fetch(`${DISCORD_API}/users/@me/guilds?limit=200`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    });
    if (!guildsRes.ok) return NextResponse.json({ hasAccess: false, reason: 'discord_error' }, { status: 401 });

    interface Guild {
      id: string;
      owner: boolean;
      permissions: number;
      name: string;
      icon: string | null;
    }

    const guilds: Guild[] = await guildsRes.json();
    const guild = guilds.find(g => g.id === guildId);
    if (!guild) return NextResponse.json({ hasAccess: false, reason: 'not_in_guild' }, { status: 403 });

    // Check if bot is in the guild
    const botInGuild = await isBotInGuild(guildId);
    if (!botInGuild) {
      return NextResponse.json({
        hasAccess: false,
        reason: 'bot_not_in_guild',
        guild: { name: guild.name, icon: guild.icon }
      }, { status: 403 });
    }

    const perms = typeof guild.permissions === 'string' ? parseInt(guild.permissions) : guild.permissions;
    const hasPerms = guild.owner || (perms & 0x8) !== 0 || (perms & 0x20) !== 0;
    if (!hasPerms) {
      return NextResponse.json({
        hasAccess: false,
        reason: 'no_permission',
        guild: { name: guild.name, icon: guild.icon }
      }, { status: 403 });
    }

    return NextResponse.json({ hasAccess: true, guild: { id: guild.id, name: guild.name, icon: guild.icon } });
  } catch (err) {
    console.error('[verify-access] Error:', err);
    return NextResponse.json({ hasAccess: false, reason: 'internal_error' }, { status: 500 });
  }
}