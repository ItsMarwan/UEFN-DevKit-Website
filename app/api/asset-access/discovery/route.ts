import { NextRequest, NextResponse } from 'next/server';
import { getPublicDiscoverableAssets } from '@/lib/asset-access';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const guildId = new URL(req.url).searchParams.get('guildId');

  if (!guildId) {
    return NextResponse.json({ error: 'Guild ID required' }, { status: 400 });
  }

  try {
    const result = await getPublicDiscoverableAssets(guildId);
    if (!result) {
      return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        guild: result.guild,
        assets: result.assets,
        assetAccessEnabled: result.assetAccessEnabled,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[api/asset-access/discovery]', error);
    return NextResponse.json({ error: 'Unable to load discovery data' }, { status: 500 });
  }
}
