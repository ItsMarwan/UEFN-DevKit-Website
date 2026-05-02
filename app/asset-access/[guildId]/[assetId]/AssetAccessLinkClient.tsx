'use client';

import { useEffect, useMemo, useState } from 'react';
import { CookieDisabledPopup } from '@/components/CookieDisabledPopup';
import { useCookieConsent } from '@/components/CookieProvider';

interface Asset {
  asset_id: string;
  guild_id?: string;
  name?: string;
  description?: string;
  asset_type?: string;
  required_hours?: number;
  required_role_id?: string;
  required_role_name?: string;
  join_url?: string;
  invite_url?: string;
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
  asset?: Asset & { storage_url?: string };
}

interface EligibilityResponse {
  eligible?: boolean;
  error?: string;
  reason?: string;
  hoursRemaining?: number;
}

function formatCountdown(hoursRemaining: number) {
  if (hoursRemaining <= 0) return 'less than an hour';
  const days = Math.floor(hoursRemaining / 24);
  const hours = hoursRemaining % 24;
  if (days > 1) return `${days} days${hours ? ` ${hours}h` : ''}`;
  if (days === 1) return `1 day${hours ? ` ${hours}h` : ''}`;
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

function isNotMemberReason(reason?: string) {
  return typeof reason === 'string' && reason.toLowerCase().includes('not a member');
}

// ─── Role claim result modal ──────────────────────────────────────────────────
function RoleClaimModal({
  type,
  roleName,
  errorMessage,
  onClose,
}: {
  type: 'success' | 'error';
  roleName?: string;
  errorMessage?: string;
  onClose: () => void;
}) {
  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-950 p-8 text-white shadow-2xl shadow-black/60">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className={`flex h-20 w-20 items-center justify-center rounded-full border-2 ${isSuccess ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-red-400/40 bg-red-500/10'}`}>
            {isSuccess ? (
              <svg viewBox="0 0 64 64" className="h-12 w-12 text-emerald-300">
                <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                <path
                  d="M18 34 L28 44 L46 22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="checkmark-path"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 64 64" className="h-12 w-12 text-red-400">
                <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                <path
                  d="M22 22 L42 42 M42 22 L22 42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>

          {/* Title */}
          <h2 className={`mt-5 text-2xl font-semibold ${isSuccess ? 'text-white' : 'text-red-300'}`}>
            {isSuccess ? 'Role claimed!' : 'Claim failed'}
          </h2>

          {/* Body */}
          <p className="mt-3 text-sm text-white/60">
            {isSuccess
              ? `The role ${roleName ? `"${roleName}" ` : ''}has been granted to your Discord account. Check your server roles to confirm.`
              : errorMessage ?? 'Something went wrong while claiming the role. Please try again.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`mt-8 w-full rounded-3xl px-5 py-3 text-sm font-semibold transition ${isSuccess ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          {isSuccess ? 'Done' : 'Dismiss'}
        </button>
      </div>
    </div>
  );
}

export default function AssetAccessLinkClient({ guildId, assetId }: { guildId: string; assetId: string }) {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [guild, setGuild] = useState<Guild>({ id: guildId, name: 'Discord Server', iconUrl: null });
  const [hasHostedStorage, setHasHostedStorage] = useState(false);
  const [eligibility, setEligibility] = useState<EligibilityResponse | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [processingDownload, setProcessingDownload] = useState(false);
  const [processingClaim, setProcessingClaim] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [roleClaimModal, setRoleClaimModal] = useState<{ type: 'success' | 'error'; errorMessage?: string } | null>(null);
  const [showCookiePopup, setShowCookiePopup] = useState(false);
  const [showDownloadWarning, setShowDownloadWarning] = useState(false);
  const [browserCookiesSupported, setBrowserCookiesSupported] = useState(true);
  const { consent, setConsent } = useCookieConsent();

  const cookieRequired = consent?.essential !== true;
  const loginDisabled = cookieRequired || !browserCookiesSupported;
  const isRoleAsset = Boolean(asset?.required_role_id);

  useEffect(() => {
    setBrowserCookiesSupported(typeof navigator !== 'undefined' ? navigator.cookieEnabled !== false : true);
  }, []);

  useEffect(() => {
    async function loadAsset() {
      setLoading(true);
      setFetchError(null);
      setEligibility(null);
      setAuthRequired(false);
      setDownloadError(null);

      try {
        const res = await fetch(`/api/asset-access/${encodeURIComponent(guildId)}/${encodeURIComponent(assetId)}`, {
          cache: 'no-store',
        });
        const data = (await res.json()) as PublicAssetApiResponse;

        if (!res.ok || data.error) {
          setFetchError(data.error ?? 'Unable to load asset details');
          setLoading(false);
          return;
        }

        if (data.guild) setGuild(data.guild);
        if (data.asset) {
          const { storage_url, ...assetWithoutStorage } = data.asset;
          setAsset(assetWithoutStorage);
        } else {
          setAsset(null);
        }
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Unable to load asset details');
      } finally {
        setLoading(false);
      }
    }

    loadAsset();
  }, [guildId, assetId]);

  useEffect(() => {
    async function loadEligibility() {
      if (!asset) return;

      try {
        const res = await fetch('/api/asset-link/check-eligibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guildId, assetId, requiredHours: asset.required_hours ?? 0 }),
          cache: 'no-store',
        });

        if (res.status === 401) {
          setAuthRequired(true);
          setEligibility(null);
          return;
        }

        const data = (await res.json()) as EligibilityResponse;
        setEligibility(data);
      } catch (err) {
        setEligibility({ error: err instanceof Error ? err.message : 'Unable to verify access status.' });
      }
    }

    loadEligibility();
  }, [asset, guildId, assetId, cookieRequired]);

  useEffect(() => {
    async function loadHostedDetails() {
      if (!asset || !eligibility?.eligible || isRoleAsset) return;

      try {
        const res = await fetch(`/api/asset-access/${encodeURIComponent(guildId)}/${encodeURIComponent(assetId)}?include_storage=true`, {
          cache: 'no-store',
        });
        const data = (await res.json()) as PublicAssetApiResponse;
        setHasHostedStorage(Boolean(data.asset?.storage_url));
      } catch {
        setHasHostedStorage(false);
      }
    }

    loadHostedDetails();
  }, [asset, eligibility, guildId, assetId, isRoleAsset]);

  useEffect(() => {
    if (!asset) return;

    const assetTitle = asset.name ?? `${asset.asset_id} asset`;
    const title = `${assetTitle} from ${guild.name} | UEFN DevKit`;
    const description = asset.description ?? `Access hosted asset details for ${guild.name}.`;

    if (typeof document !== 'undefined') {
      document.title = title;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = description;
        document.head.appendChild(meta);
      }
    }
  }, [asset, guild.name]);

  const joinLink = useMemo(() => asset?.join_url ?? asset?.invite_url, [asset]);
  const notMember = isNotMemberReason(eligibility?.reason);
  const waitingHours = eligibility?.hoursRemaining;
  const countdown = waitingHours != null ? formatCountdown(waitingHours) : undefined;

  const statusText = useMemo(() => {
    if (fetchError || !asset) return 'Asset unavailable';
    if (eligibility?.eligible) return isRoleAsset ? 'You are eligible to claim this role.' : 'You are eligible to download this asset.';
    if (authRequired) return 'Sign in with Discord to confirm eligibility.';
    if (notMember) return 'You are not a member of this Discord server.';
    if (waitingHours != null) return `Unlocks in ${countdown}.`;
    if (eligibility?.error) return eligibility.error;
    return 'Checking access status…';
  }, [asset, authRequired, countdown, eligibility, fetchError, isRoleAsset, notMember, waitingHours]);

  const statusState = useMemo<'checking' | 'eligible' | 'ineligible' | 'unauthenticated' | 'error'>(() => {
    if (fetchError || !asset) return 'error';
    if (authRequired) return 'unauthenticated';
    if (!eligibility) return 'checking';
    if (eligibility.eligible) return 'eligible';
    return 'ineligible';
  }, [asset, authRequired, eligibility, fetchError]);

  const handleLoginClick = () => {
    if (loginDisabled) {
      setShowCookiePopup(true);
      return;
    }
    window.location.href = `/api/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
  };

  const handleEnableCookies = () => {
    setConsent({ analytics: true, essential: true });
    setShowCookiePopup(false);
  };

  const handleDownloadClick = () => {
    if (!eligibility?.eligible || processingDownload) return;
    setShowDownloadWarning(true);
  };

  const handleConfirmDownload = async () => {
    setShowDownloadWarning(false);
    if (!asset) return;

    setDownloadError(null);
    setProcessingDownload(true);

    try {
      const res = await fetch(`/api/download/${encodeURIComponent(guildId)}/${encodeURIComponent(assetId)}/token`, {
        cache: 'no-store',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Unable to create a download link');
      if (!data?.downloadUrl) throw new Error('Download link not available');

      window.location.href = data.downloadUrl;
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed');
      setProcessingDownload(false);
    }
  };

  const handleClaimRole = async () => {
    if (!asset || !asset.asset_id || processingClaim) return;

    setProcessingClaim(true);

    try {
      const roleId = (asset as any).required_role_id;
      if (!roleId) throw new Error('This asset does not have an associated role');

      const res = await fetch('/api/asset-link/grant-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId, assetId: asset.asset_id, roleId }),
        cache: 'no-store',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to grant role');

      setRoleClaimModal({ type: 'success' });
    } catch (err) {
      setRoleClaimModal({
        type: 'error',
        errorMessage: err instanceof Error ? err.message : 'Role claim failed',
      });
    } finally {
      setProcessingClaim(false);
    }
  };

  // Storage sidebar label
  const storageLabel = useMemo(() => {
    if (isRoleAsset) return asset?.required_role_name ? `Role: ${asset.required_role_name}` : 'Discord role';
    if (!eligibility?.eligible) return 'Awaiting access check';
    return hasHostedStorage ? (asset?.name ?? 'Hosted file') : 'External host';
  }, [isRoleAsset, asset, eligibility, hasHostedStorage]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-8 shadow-xl shadow-black/30">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-3xl bg-white/10 animate-pulse" />
              <div className="space-y-3 flex-1">
                <div className="h-8 w-3/4 rounded-2xl bg-white/10 animate-pulse" />
                <div className="h-4 w-1/2 rounded-2xl bg-white/10 animate-pulse" />
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.75fr,320px]">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
                <div className="h-48 rounded-3xl bg-white/10 animate-pulse" />
                <div className="h-12 rounded-3xl bg-white/10 animate-pulse" />
                <div className="h-12 rounded-3xl bg-white/10 animate-pulse" />
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
                <div className="h-6 w-1/3 rounded-2xl bg-white/10 animate-pulse" />
                <div className="space-y-3">
                  <div className="h-14 rounded-3xl bg-white/10 animate-pulse" />
                  <div className="h-14 rounded-3xl bg-white/10 animate-pulse" />
                  <div className="h-14 rounded-3xl bg-white/10 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError || !asset) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-8 text-center">
          <h1 className="text-3xl font-semibold text-white">Asset unavailable</h1>
          <p className="mt-3 text-sm text-white/60">{fetchError ?? 'This asset is not available for public access.'}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href={`/asset-access/${encodeURIComponent(guildId)}`}
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

  return (
    <>
      {showCookiePopup && <CookieDisabledPopup onClose={() => setShowCookiePopup(false)} />}

      {showDownloadWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-neutral-950 p-8 text-white shadow-2xl shadow-black/60">
            <h2 className="text-2xl font-semibold">Download warning</h2>
            <p className="mt-4 text-sm text-white/70">
              You&apos;re about to download a file from this asset. Make sure you understand the risks, verify the source, and only proceed if you trust the asset.
            </p>
            <div className="mt-6 space-y-4 rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-white/90">
              <p className="font-semibold">Safety reminders</p>
              <ul className="list-disc space-y-2 pl-5 text-white/70">
                <li>Check that you are downloading the right asset.</li>
                <li>Do not run untrusted files without inspection.</li>
                <li>If the asset is from an external source, confirm it is safe before opening.</li>
              </ul>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDownloadWarning(false)}
                className="rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDownload}
                className="rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black hover:bg-emerald-400 transition"
              >
                Continue to download
              </button>
            </div>
          </div>
        </div>
      )}

      {roleClaimModal && (
        <RoleClaimModal
          type={roleClaimModal.type}
          roleName={asset.required_role_name}
          errorMessage={roleClaimModal.errorMessage}
          onClose={() => setRoleClaimModal(null)}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-8 shadow-xl shadow-black/30">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/5">
                {guild.iconUrl ? (
                  <img src={guild.iconUrl} alt={`${guild.name} icon`} className="h-12 w-12 rounded-2xl object-cover" />
                ) : (
                  <span className="text-xl font-semibold text-white/80">{guild.name?.charAt(0) ?? 'S'}</span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-white">{asset.name || 'Public asset'}</h1>
                <p className="text-sm text-white/60">Published by {guild.name}. Access requires Discord eligibility checks.</p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.75fr,320px]">
            <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="rounded-3xl border border-white/10 bg-neutral-950/70 p-6 shadow-inner shadow-black/20">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-black/40 shadow-md shadow-black/20">
                    {statusState === 'checking' ? (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-orange-400/40">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
                      </div>
                    ) : statusState === 'eligible' ? (
                      <svg viewBox="0 0 64 64" className="h-12 w-12 text-emerald-300">
                        <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                        <path d="M18 34 L28 44 L46 22" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="checkmark-path" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 64 64" className="h-12 w-12 text-red-400">
                        <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                        <path d="M22 22 L42 42 M42 22 L22 42" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="checkmark-path" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/50">Access status</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{statusText}</h2>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-5 text-sm text-white/90 animate-warning">
                <p className="font-semibold">Warning</p>
                <p className="mt-2 text-white/70">Only proceed if you are eligible. The button will show processing while the download link is created, and then it will reactivate if the request fails.</p>
                <p className="mt-2 text-xs text-white/60">The warning will animate once to draw your attention and then stay in place.</p>
              </div>

              {(authRequired || cookieRequired || !browserCookiesSupported) ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleLoginClick}
                    disabled={processingDownload || processingClaim}
                    className="w-full rounded-3xl bg-blue-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cookieRequired ? 'Enable cookies to login' : !browserCookiesSupported ? 'Enable browser cookies' : 'Login with Discord'}
                  </button>
                  <p className="text-xs text-white/50">Essential cookies are required for the Discord login flow.</p>
                  {cookieRequired && (
                    <button
                      type="button"
                      onClick={handleEnableCookies}
                      className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
                    >
                      Turn cookies on
                    </button>
                  )}
                </div>
              ) : isRoleAsset ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleClaimRole}
                    disabled={processingClaim || !eligibility?.eligible}
                    className="w-full rounded-3xl bg-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {processingClaim ? 'Processing…' : eligibility?.eligible ? `Claim ${asset.required_role_name || 'role'}` : 'Login to verify access'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleDownloadClick}
                    disabled={processingDownload || !eligibility?.eligible}
                    className="w-full rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {processingDownload ? 'Processing…' : eligibility?.eligible ? 'Continue to download' : 'Login to verify access'}
                  </button>
                  {downloadError && <p className="text-xs text-red-300">{downloadError}</p>}
                  {notMember && joinLink && (
                    <a
                      href={joinLink}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-white/10 transition"
                    >
                      Join the Discord server
                    </a>
                  )}
                  {notMember && !joinLink && (
                    <p className="text-xs text-white/50">The server owner has not provided a join link for this asset. Ask them for an invite.</p>
                  )}
                  {waitingHours != null && !eligibility?.eligible && (
                    <p className="text-sm text-white/60">Remaining wait time: <span className="font-semibold text-white">{countdown}</span></p>
                  )}
                </div>
              )}
            </section>

            <aside className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/50">Quick facts</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-black/40 p-4 text-sm text-white/70">
                      <p className="text-xs uppercase tracking-[0.25em] text-white/50">Asset type</p>
                      <p className="mt-2 font-semibold text-white">{asset.asset_type ?? 'web'}</p>
                    </div>
                    <div className="rounded-3xl bg-black/40 p-4 text-sm text-white/70">
                      <p className="text-xs uppercase tracking-[0.25em] text-white/50">Required hours</p>
                      <p className="mt-2 font-semibold text-white">{asset.required_hours ?? 0}h</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/50">Server name</p>
                  <p className="mt-2 font-semibold text-white">{guild.name}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/50">{isRoleAsset ? 'Role' : 'Storage'}</p>
                  <p className="mt-2 font-semibold text-white">{storageLabel}</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes drawCheckmark {
          from { stroke-dashoffset: 100; opacity: 0; }
          to { stroke-dashoffset: 0; opacity: 1; }
        }
        .checkmark-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: drawCheckmark 0.9s ease forwards;
        }
        @keyframes pulseWarning {
          0% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(-2px); opacity: 0.96; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-warning {
          animation: pulseWarning 2.5s ease-in-out 1;
        }
      `}</style>
    </>
  );
}