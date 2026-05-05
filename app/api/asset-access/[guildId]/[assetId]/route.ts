/*
  © 2026 UEFN DevKit.

  This file is part of the UEFN DevKit project and is intended
  for use only within uefndevkit.rweb.site and its official services.

  Unauthorized use, copying, modification, or redistribution
  of this file or its contents is strictly prohibited.
*/
import { NextRequest, NextResponse } from 'next/server';
import { getPublicAssetMetadata } from '@/lib/asset-access';
import { requireWebsiteOnlyRequest } from '@/lib/website-only';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ guildId: string; assetId: string }> }
) {
  const forbiddenResponse = requireWebsiteOnlyRequest(req);
  if (forbiddenResponse) return forbiddenResponse;

  const { guildId, assetId } = await params;

  if (!guildId || !assetId) {
    return NextResponse.json({ error: 'Guild ID and asset ID required' }, { status: 400 });
  }

  try {
    const result = await getPublicAssetMetadata(guildId, assetId);
    if (!result) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const includeStorage = req.nextUrl.searchParams.get('include_storage') === 'true';
    const responseAsset = includeStorage ? result.asset : { ...result.asset };
    if (!includeStorage) {
      delete (responseAsset as any).storage_url;
    }

    return NextResponse.json(
      { success: true, guild: result.guild, asset: responseAsset },
      { status: 200 }
    );
  } catch (error) {
    console.error('[api/asset-access/[guildId]/[assetId]]', error);
    return NextResponse.json({ error: 'Unable to load asset details' }, { status: 500 });
  }
}