// app/api/guilds/[id]/route.ts
// Protected route: Checks if the bot is in the requested guild
// Returns 403 if bot is not invited
import { NextRequest, NextResponse } from 'next/server';
import { isBotInGuild } from '@/lib/discord-bot-guilds';

export const dynamic = 'force-dynamic';

interface Params {
  id: string;
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const guildId = params?.id;
    if (!guildId) {
      return NextResponse.json({ error: 'Guild ID required' }, { status: 400 });
    }

    // Check if bot is in the guild
    const botInGuild = await isBotInGuild(guildId);

    if (!botInGuild) {
      return NextResponse.json({ error: 'Bot not invited' }, { status: 403 });
    }

    return NextResponse.json({ success: true, guildId, botPresent: true });
  } catch (err) {
    console.error('[guilds/:id] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
