import { Metadata } from 'next';
import { getPublicDiscoverableAssets } from '@/lib/asset-access';

export const dynamic = 'force-dynamic';

interface MetadataParams {
  params: {
    guildId: string;
  };
}

export async function generateMetadata({ params }: MetadataParams): Promise<Metadata> {
  const { guildId } = params;

  try {
    const result = await getPublicDiscoverableAssets(guildId);
    if (!result || !result.guild) {
      return {
        title: 'Discover public assets',
        description: 'Browse hosted assets published by a Discord server.',
      };
    }

    const title = result.guild.name
      ? `Discover hosted assets for ${result.guild.name}`
      : 'Discover hosted assets';
    const description = result.assetAccessEnabled === false
      ? `Public discovery is disabled for ${result.guild.name || 'this server'}.`
      : result.assets?.length
        ? `Browse hosted web assets for ${result.guild.name}.`
        : `No hosted web assets are available for ${result.guild.name || 'this server'} at the moment.`;

    return {
      title,
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
  } catch {
    return {
      title: 'Discover public assets',
      description: 'Browse hosted assets published by a Discord server.',
    };
  }
}
