'use client';

import { useEffect, useState } from 'react';

interface Asset {
  asset_id: string;
  guild_id?: string;
  name?: string;
  description?: string;
  asset_type?: string;
  required_hours?: number;
  storage_url?: string;
}

interface Guild {
  id: string;
  name: string;
  iconUrl: string | null;
}

interface PublicAssetApiResponse {
  success?: boolean;
  error?: string;
  guild?: Guild;
  assets?: Asset[];
  assetAccessEnabled?: boolean;
}

function getAssetId(asset: Asset): string | undefined {
  const candidate = asset.asset_id?.toString().trim();
  if (!candidate || candidate === 'undefined' || candidate === 'null') return undefined;
  return candidate;
}

export default function AssetAccessClient({ guildId }: { guildId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guild, setGuild] = useState<Guild>({ id: guildId, name: 'Discord Server', iconUrl: null });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetAccessEnabled, setAssetAccessEnabled] = useState(true);
  const [assetStatuses, setAssetStatuses] = useState<Record<string, 'checking' | 'eligible' | 'ineligible' | 'unauthenticated'>>({});

  const getAssetStatus = (assetId?: string) => {
    if (!assetId) return 'ineligible' as const;
    return assetStatuses[assetId] ?? 'checking';
  };

  useEffect(() => {
    async function loadAssets() {
      setLoading(true);
      setError(null);

      try {
        const assetsRes = await fetch(`/api/asset-access/${encodeURIComponent(guildId)}`, {
          cache: 'no-store',
        });
        const assetsData = (await assetsRes.json()) as PublicAssetApiResponse;

        if (!assetsRes.ok || assetsData.error) {
          setError(assetsData.error ?? 'Unable to load public assets');
          setLoading(false);
          return;
        }

        setGuild(assetsData.guild ?? { id: guildId, name: 'Discord Server', iconUrl: null });
        setAssets(Array.isArray(assetsData.assets) ? assetsData.assets : []);
        setAssetAccessEnabled(assetsData.assetAccessEnabled ?? true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load public assets');
      } finally {
        setLoading(false);
      }
    }

    loadAssets();
  }, [guildId]);

  useEffect(() => {
    async function loadAssetStatuses() {
      if (!assets.length) return;

      // Mark all as checking upfront
      const initialStatuses: Record<string, 'checking'> = {};
      const validAssets = assets.filter((a) => getAssetId(a));
      validAssets.forEach((asset) => {
        initialStatuses[getAssetId(asset)!] = 'checking';
      });
      setAssetStatuses(initialStatuses);

      try {
        // Single batch request — avoids race conditions and extra Discord API calls
        const res = await fetch('/api/asset-link/check-eligibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guildId,
            assetIds: validAssets.map((a) => ({
              id: getAssetId(a)!,
              requiredHours: a.required_hours ?? 0,
            })),
          }),
          cache: 'no-store',
        });

        if (res.status === 401) {
          const unauthed: Record<string, 'unauthenticated'> = {};
          validAssets.forEach((a) => { unauthed[getAssetId(a)!] = 'unauthenticated'; });
          setAssetStatuses(unauthed);
          return;
        }

        const data = await res.json();
        const results: Array<{ assetId: string; eligible: boolean }> = data?.results ?? [];

        const nextStatuses: Record<string, 'eligible' | 'ineligible'> = {};
        results.forEach((r) => {
          nextStatuses[r.assetId] = r.eligible ? 'eligible' : 'ineligible';
        });
        setAssetStatuses(nextStatuses);
      } catch {
        const failed: Record<string, 'ineligible'> = {};
        validAssets.forEach((a) => { failed[getAssetId(a)!] = 'ineligible'; });
        setAssetStatuses(failed);
      }
    }

    loadAssetStatuses();
  }, [assets, guildId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-8 shadow-xl shadow-black/30">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-3xl bg-white/10 animate-pulse" />
              <div className="flex-1 space-y-3">
                <div className="h-8 w-3/4 rounded-2xl bg-white/10 animate-pulse" />
                <div className="h-4 w-1/2 rounded-2xl bg-white/10 animate-pulse" />
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
                  <div className="h-5 w-2/3 rounded-2xl bg-white/10 animate-pulse" />
                  <div className="h-16 rounded-3xl bg-white/10 animate-pulse" />
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
                    <div className="h-4 w-1/3 rounded-2xl bg-white/10 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-8 text-center">
          <h1 className="text-3xl font-semibold text-white">Unable to load assets</h1>
          <p className="mt-3 text-sm text-white/60">{error}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="rounded-3xl border border-white/10 bg-black/60 p-8 shadow-xl shadow-black/30">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/5">
                {guild?.iconUrl ? (
                  <img src={guild.iconUrl} alt={`${guild.name} icon`} className="h-12 w-12 rounded-2xl object-cover" />
                ) : (
                  <span className="text-xl font-semibold text-white/80">{guild?.name?.charAt(0) ?? 'S'}</span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-white">{guild?.name ?? 'Discord Server'}</h1>
                <p className="text-sm text-white/60">Browse this server's publicly discoverable hosted assets.</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
            <p className="font-semibold text-white/90">Server ID</p>
            <p className="font-mono text-xs text-white/60 break-all">{guildId}</p>
          </div>
        </div>

        {assetAccessEnabled ? (
          assets.length > 0 ? (
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {assets.map((asset) => {
                const assetId = getAssetId(asset);
                if (!assetId) return null;
                const status = getAssetStatus(assetId);
                const statusCircleClass =
                  status === 'checking'
                    ? 'border-orange-400 bg-orange-500/10 text-orange-300'
                    : status === 'eligible'
                    ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
                    : 'border-red-400 bg-red-500/10 text-red-300';

                return (
                  <a
                    key={assetId}
                    href={`/asset-access/${encodeURIComponent(guildId)}/${encodeURIComponent(assetId)}`}
                    className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-cyan-500/30 hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-white">{asset.name || 'Untitled asset'}</p>
                        {asset.description && (
                          <p className="mt-2 text-sm text-white/60 line-clamp-2 overflow-hidden">
                            {asset.description}
                          </p>
                        )}
                      </div>
                      <div className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full border-2 ${statusCircleClass}`}>
                        {status === 'checking' ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : status === 'eligible' ? (
                          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                            <path d="M20.285 6.707a1 1 0 0 0-1.414-1.414L9 15.164 5.129 11.293a1 1 0 1 0-1.414 1.414l4.95 4.95a1 1 0 0 0 1.414 0l10.206-10.206z" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                            <path d="M18.364 18.364a1 1 0 0 1-1.414 0L12 13.414l-4.95 4.95a1 1 0 1 1-1.414-1.414l4.95-4.95-4.95-4.95a1 1 0 1 1 1.414-1.414L12 10.586l4.95-4.95a1 1 0 1 1 1.414 1.414l-4.95 4.95 4.95 4.95a1 1 0 0 1 0 1.414z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/60">
                      <span className={`rounded-full px-3 py-2 ${
                        status === 'eligible'
                          ? 'bg-emerald-500/10 text-emerald-200'
                          : status === 'checking'
                          ? 'bg-orange-500/10 text-orange-200'
                          : 'bg-red-500/10 text-red-200'
                      }`}>
                        {status === 'checking'
                          ? 'Checking access'
                          : status === 'eligible'
                          ? 'Eligible'
                          : asset.required_hours != null
                          ? `${asset.required_hours}h wait`
                          : 'Unavailable'}
                      </span>
                      <span className="rounded-full bg-white/5 px-3 py-2">{asset.asset_type || 'web'}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="text-sm uppercase tracking-[0.25em] text-white/50">No public assets</p>
              <h2 className="mt-4 text-2xl font-semibold text-white">Nothing public yet</h2>
              <p className="mt-3 text-sm text-white/60 leading-7">
                This server currently has no hosted web assets available for public discovery. The server owner can enable hosted assets in the asset dashboard to publish them here.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <a
                  href={`https://discord.com/channels/${guildId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-black hover:bg-cyan-400 transition"
                >
                  Open Discord server
                </a>
                <a
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
                >
                  Return home
                </a>
              </div>
            </div>
          )
        ) : (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-white/50">Discovery disabled</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">Public asset discovery is turned off</h2>
            <p className="mt-3 text-sm text-white/60 leading-7">
              The server owner has disabled public asset access. Enable the asset access system in the dashboard to make hosted web assets visible here.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href={`https://discord.com/channels/${guildId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-black hover:bg-cyan-400 transition"
              >
                Open Discord server
              </a>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                Return home
              </a>
            </div>
          </div>
        )}

        <div className="mt-10 rounded-3xl border border-white/10 bg-black/40 p-6 text-sm text-white/60">
          <p>
            This page only displays publicly discoverable hosted web assets that the server owner enabled in the asset dashboard. Assets with private or command-based access are not listed here.
          </p>
        </div>
      </div>
    </div>
  );
}