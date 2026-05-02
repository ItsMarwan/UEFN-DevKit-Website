import { Metadata } from 'next';
import { getPublicAssetMetadata } from '@/lib/asset-access';

export const dynamic = 'force-dynamic';

interface MetadataParams {
  params: {
    guildId: string;
    assetId: string;
  };
}

export async function generateMetadata({ params }: MetadataParams): Promise<Metadata> {
  const { guildId, assetId } = params;

  try {
    const result = await getPublicAssetMetadata(guildId, assetId);
    if (!result) {
      return {
        title: 'Asset not found',
        description: 'This asset could not be found or is not available for public display.',
      };
    }

    const assetTitle = result.asset.name || `${result.asset.asset_id} asset`;
    const title = `${assetTitle} — ${result.guild.name}`;
    const description = result.asset.description
      ? result.asset.description
      : `View hosted web asset details for ${result.guild.name}.`;

    // console.log(
    //   `[AssetMetadata] route=/asset-access/${guildId}/${assetId} title=${JSON.stringify(title)} description=${JSON.stringify(description)}`
    // );

    return {
      title: {
        default: title,
        template: '%s | UEFN DevKit',
      },
      description,
      openGraph: {
        title,
        description,
      },
      twitter: {
        title,
        description,
      },
    };
  } catch (error) {
    console.error(`[AssetMetadata] failed for /asset-access/${guildId}/${assetId}`, error);
    return {
      title: 'Asset details',
      description: 'Access asset details for this server.',
    };
  }
}
