import { getPublicAssetMetadata } from '@/lib/asset-access';

interface HeadProps {
  params: {
    guildId: string;
    assetId: string;
  };
}

export default async function Head({ params }: HeadProps) {
  const { guildId, assetId } = params;
  let title = 'Asset details | UEFN DevKit';
  let description = 'Access asset details for this server.';

  try {
    const result = await getPublicAssetMetadata(guildId, assetId);
    if (result) {
      const assetTitle = result.asset.name || `${result.asset.asset_id} asset`;
      title = `${assetTitle} from ${result.guild.name} | UEFN DevKit`;
      description = result.asset.description
        ? result.asset.description
        : `View hosted web asset details for ${result.guild.name}.`;
    }
  } catch (error) {
    console.error(`[AssetHead] route=/asset-access/${guildId}/${assetId}`, error);
  }

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </>
  );
}
