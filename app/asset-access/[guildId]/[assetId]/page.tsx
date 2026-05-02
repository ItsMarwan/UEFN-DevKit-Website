import AssetAccessLinkClient from './AssetAccessLinkClient.tsx';

export const dynamic = 'force-dynamic';

interface AssetAccessPageProps {
  params: Promise<{
    guildId: string;
    assetId: string;
  }>;
}

export default async function AssetAccessPage({ params }: AssetAccessPageProps) {
  const { guildId, assetId } = await params;
  const invalidId = (value: string | undefined) => !value || value === 'undefined' || value === 'null';

  if (invalidId(guildId) || invalidId(assetId)) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-8 text-center">
          <h1 className="text-3xl font-semibold text-white">Invalid asset URL</h1>
          <p className="mt-3 text-sm text-white/60">The requested asset page is not valid. Please navigate from the server's public asset list.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href={`/asset-access/${encodeURIComponent(guildId || '')}`}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Back to asset list
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Return home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <AssetAccessLinkClient guildId={guildId} assetId={assetId} />;
}
