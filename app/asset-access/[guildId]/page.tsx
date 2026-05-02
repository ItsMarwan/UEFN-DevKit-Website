import type { Metadata } from 'next';
import AssetAccessClient from '../AssetAccessClient';
import { getPublicDiscoverableAssets } from '@/lib/asset-access';

export const dynamic = 'force-dynamic';

interface MetadataParams {
  params: {
    guildId: string;
  };
}

interface AssetAccessPageProps {
  params: {
    guildId: string;
  };
}

export async function generateMetadata({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const result = await getPublicDiscoverableAssets(guildId);
  const title = result?.guild?.name
    ? `Discover hosted assets for ${result.guild.name}`
    : 'Discover hosted assets';
  const description = result
    ? result.assetAccessEnabled === false
      ? `Public discovery is disabled for ${result.guild.name || 'this server'}.`
      : result.assets?.length
        ? `Browse hosted web assets for ${result.guild.name}.`
        : `No hosted web assets are available for ${result.guild.name || 'this server'} at the moment.`
    : `Public asset discovery is disabled or unavailable for ${result?.guild?.name || 'this server'}.`;

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
}

export default async function AssetAccessPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  if (!guildId) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-8 text-center">
          <h1 className="text-3xl font-semibold text-white">Invalid server</h1>
          <p className="mt-3 text-sm text-white/60">A valid Discord server ID is required to view public assets.</p>
        </div>
      </div>
    );
  }

  return <AssetAccessClient guildId={guildId} />;
}
