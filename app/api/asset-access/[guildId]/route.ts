import { NextRequest, NextResponse } from 'next/server';
import { getPublicDiscoverableAssets } from '@/lib/asset-access';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;

  if (!guildId) {
    return NextResponse.json({ error: 'Guild ID required' }, { status: 400 });
  }

  try {
    const result = await getPublicDiscoverableAssets(guildId);
    if (!result) {
      return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
    }

    const minimalAssets = Array.isArray(result.assets)
      ? result.assets.map((asset) => ({
          asset_id: asset.asset_id,
          name: asset.name,
          description: asset.description,
          asset_type: asset.asset_type,
          required_hours: asset.required_hours,
        }))
      : [];

    return NextResponse.json(
      {
        success: true,
        guild: result.guild,
        assets: minimalAssets,
        assetAccessEnabled: result.assetAccessEnabled,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[api/asset-access/[guildId]]', error);
    return NextResponse.json({ error: 'Unable to load public asset data' }, { status: 500 });
  }
}
