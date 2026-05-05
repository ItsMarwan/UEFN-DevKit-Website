/*
  © 2026 UEFN DevKit.

  This file is part of the UEFN DevKit project and is intended
  for use only within uefndevkit.rweb.site and its official services.

  Unauthorized use, copying, modification, or redistribution
  of this file or its contents is strictly prohibited.
*/
import { NextRequest, NextResponse } from 'next/server';
import { getPublicDiscoverableAssets } from '@/lib/asset-access';
import { requireWebsiteOnlyRequest } from '@/lib/website-only';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const forbiddenResponse = requireWebsiteOnlyRequest(req);
  if (forbiddenResponse) return forbiddenResponse;

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
