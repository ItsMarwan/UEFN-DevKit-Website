'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { ASSET_TYPES, type Asset } from './asset-types';

function parseBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

const DESCRIPTION_MAX_LENGTH = 300;

const DEFAULT_ASSET_DRAFT: Partial<Asset> = {
  asset_type: 'full',
  name: '',
  description: '',
  enabled: true,
  required_hours: 72,
  cooldown_hours: 24,
  asset_channel_id: '',
  info_channel_id: '',
  required_role_id: '',
  storage_enabled: false,
  storage_mode: 'external',
  storage_url: '',
  discoverable: false,
};

function normalizeAsset(raw: any): Asset {
  const rawType = typeof raw.asset_type === 'string' ? raw.asset_type.toLowerCase().trim() : '';
  const assetType = rawType === 'full' || rawType === 'semi' || rawType === 'web' ? rawType : 'full';

  return {
    id: String(raw.asset_id ?? raw.id ?? ''),
    asset_type: assetType as Asset['asset_type'],
    name: raw.name ?? '',
    description: raw.description ?? '',
    enabled: raw.enabled == null ? true : parseBoolean(raw.enabled),
    required_hours: Number(raw.required_hours ?? 0),
    cooldown_hours: Number(raw.cooldown_hours ?? 0),
    asset_channel_id: raw.asset_channel_id ?? '',
    info_channel_id: raw.info_channel_id ?? '',
    required_role_id: raw.required_role_id ?? '',
    storage_enabled: parseBoolean(raw.storage_enabled),
    storage_mode: raw.storage_url?.toString().startsWith('storage://') ? 'hosted' : 'external',
    storage_url: raw.storage_url ?? '',
    storage_size: raw.storage_size != null ? Number(raw.storage_size) : undefined,
    download_count: raw.download_count != null ? Number(raw.download_count) : undefined,
    discoverable: parseBoolean(raw.discoverable),
    guild_id: raw.guild_id ?? '',
    created_at: raw.created_at ?? '',
  };
}

function fieldLabel(key: string) {
  switch (key) {
    case 'asset_channel_id': return 'Asset Channel ID';
    case 'info_channel_id': return 'Info Channel ID';
    case 'required_role_id': return 'Required Role ID';
    case 'required_hours': return 'Required Hours';
    case 'cooldown_hours': return 'Cooldown Hours';
    case 'storage_enabled': return 'Enable Storage';
    default: return key;
  }
}

export default function AssetAccessTab({ guildId }: { guildId: string }) {
  const { showToast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Asset>>(DEFAULT_ASSET_DRAFT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [serverTier, setServerTier] = useState<string | null>(null);
  const [serverAssetAccessEnabled, setServerAssetAccessEnabled] = useState(true);
  const [serverToggleLoading, setServerToggleLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [infoSending, setInfoSending] = useState(false);
  const skipAutoSelectRef = useRef(false);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [assets, selectedAssetId]
  );

  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement | null>(null);

  const activeAssetType = (draft.asset_type ?? 'full') as Asset['asset_type'];
  const activeTypeConfig = ASSET_TYPES[activeAssetType];

  const descriptionLength = draft.description?.length ?? 0;
  const descriptionOverLimit = descriptionLength > DESCRIPTION_MAX_LENGTH;

  const createDraftFromAsset = useCallback((asset: Asset): Partial<Asset> => ({
    id: asset.id,
    asset_type: asset.asset_type,
    name: asset.name,
    description: asset.description,
    enabled: asset.enabled,
    required_hours: asset.required_hours,
    cooldown_hours: asset.cooldown_hours,
    asset_channel_id: asset.asset_channel_id,
    info_channel_id: asset.info_channel_id,
    required_role_id: asset.required_role_id,
    storage_enabled: asset.storage_enabled,
    storage_mode: asset.storage_url?.toString().startsWith('storage://') ? 'hosted' : 'external',
    storage_url: asset.storage_url,
    storage_size: asset.storage_size,
    download_count: asset.download_count,
    discoverable: asset.discoverable,
  }), []);

  const resetDraft = useCallback(() => {
    skipAutoSelectRef.current = true;
    setDraft({ ...DEFAULT_ASSET_DRAFT });
    setSelectedAssetId(null);
    setSaveMsg(null);
    setUploadError(null);
    setUploading(false);
    setSelectedFile(null);
  }, []);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/dashboard/assets?guildId=${encodeURIComponent(guildId)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to load assets');
      }
      const rawAssets = Array.isArray(json.assets) ? json.assets : [];
      const normalized = rawAssets.map(normalizeAsset);
      setAssets(normalized);
      if (normalized.length === 0) {
        resetDraft();
      } else if (!selectedAssetId && !skipAutoSelectRef.current) {
        setSelectedAssetId(normalized[0].id);
        setDraft(createDraftFromAsset(normalized[0]));
      }
      skipAutoSelectRef.current = false;
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to fetch assets');
      showToast('error', 'Load Failed', err instanceof Error ? err.message : 'Unable to fetch assets');
    } finally {
      setLoading(false);
    }
  }, [createDraftFromAsset, guildId, resetDraft, selectedAssetId, showToast]);

  const fetchServerTier = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/server-config?guildId=${encodeURIComponent(guildId)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      const data = json?.data?.data ?? json?.data ?? json;
      if (typeof data?.server_tier === 'string') {
        setServerTier(data.server_tier);
      }
      if (data?.enabled !== undefined) {
        setServerAssetAccessEnabled(parseBoolean(data.enabled));
      }
    } catch (err) {
      console.warn('Failed to load server tier', err);
    }
  }, [guildId]);

  useEffect(() => {
    fetchAssets();
    fetchServerTier();
  }, [fetchAssets, fetchServerTier]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
        setTypeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAssetId(asset.id);
    setDraft(createDraftFromAsset(asset));
    setSaveMsg(null);
    setUploadError(null);
    setSelectedFile(null);
  };

  useEffect(() => {
    if (!selectedAsset) return;
    setDraft(createDraftFromAsset(selectedAsset));
    setSaveMsg(null);
    setUploadError(null);
    setSelectedFile(null);
  }, [selectedAsset, createDraftFromAsset]);

  const handleFieldChange = (key: keyof Asset, value: string | boolean | number) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const fileSizeLimit = serverTier === 'enterprise'
    ? 50 * 1024 * 1024
    : serverTier === 'premium'
      ? 20 * 1024 * 1024
      : 0;

  const handleFileSelection = (file: File | null) => {
    const hasExistingHostedFile = Boolean(selectedAsset && draft.storage_mode === 'hosted' && Boolean(draft.storage_url?.trim()));

    if (hasExistingHostedFile) {
      setUploadError('A hosted file is already attached. Create a new asset to upload a different file.');
      return;
    }

    if (!file) {
      setSelectedFile(null);
      setUploadError(null);
      return;
    }

    if (!fileUploadAllowed) {
      setSelectedFile(null);
      setUploadError('File uploads require a premium or enterprise server tier.');
      return;
    }

    if (fileSizeLimit && file.size > fileSizeLimit) {
      setSelectedFile(null);
      setUploadError(`File exceeds the ${fileSizeLimit / 1024 / 1024}MB limit.`);
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setDraft((current) => {
      const currentName = current.name?.trim() ?? '';
      const incomingBaseName = file.name.replace(/\.[^/.]+$/, '');
      if (!currentName || currentName === selectedAsset?.name) {
        return { ...current, name: incomingBaseName };
      }
      return current;
    });
  };

  const handleToggleServerAssetAccess = async () => {
    const nextValue = !serverAssetAccessEnabled;
    setServerToggleLoading(true);

    try {
      const res = await fetch(`/api/dashboard/server-config?guildId=${encodeURIComponent(guildId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextValue }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to update server asset access');
      }
      setServerAssetAccessEnabled(nextValue);
      showToast('success', 'Updated', `Server public asset access is now ${nextValue ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      showToast('error', 'Update Failed', err instanceof Error ? err.message : 'Unable to update server public discovery');
    } finally {
      setServerToggleLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    setUploadError(null);

    const name = draft.name?.trim() ?? '';
    if (!name) {
      const errorText = 'Asset name is required.';
      setSaveMsg({ type: 'error', text: errorText });
      showToast('error', 'Save Failed', errorText);
      setSaving(false);
      return;
    }

    const description = draft.description?.trim() ?? '';
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      const errorText = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`;
      setSaveMsg({ type: 'error', text: errorText });
      showToast('error', 'Save Failed', errorText);
      setSaving(false);
      return;
    }

    let storageUrl = draft.storage_url?.trim() ?? '';
    const requiresStorageUrl = showStorageField && draft.storage_mode === 'external';

    if (requiresStorageUrl) {
      if (!storageUrl) {
        const errorText = 'External URL is required for this asset type.';
        setSaveMsg({ type: 'error', text: errorText });
        showToast('error', 'Save Failed', errorText);
        setSaving(false);
        return;
      }
    }

    if (draft.storage_mode === 'hosted') {
      if (!storageUrl && !selectedFile) {
        const errorText = 'Please select a file before saving hosted storage.';
        setSaveMsg({ type: 'error', text: errorText });
        showToast('error', 'Save Failed', errorText);
        setSaving(false);
        return;
      }

      if (selectedFile) {
        setUploading(true);
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          const res = await fetch(`/api/dashboard/upload?guildId=${encodeURIComponent(guildId)}`, {
            method: 'POST',
            body: formData,
          });
          const json = await res.json();
          if (!res.ok) {
            throw new Error(json?.error || 'File upload failed');
          }
          storageUrl = json.storage_url ?? '';
          if (!storageUrl) {
            throw new Error('Upload completed without a storage URL');
          }
        } catch (err) {
          const errorText = err instanceof Error ? err.message : 'Unable to upload file';
          setUploadError(errorText);
          setSaveMsg({ type: 'error', text: errorText });
          showToast('error', 'Upload Failed', errorText);
          setSaving(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }
    }

    const basePayload: Record<string, unknown> = {
      asset_type: activeAssetType,
      name,
      description,
      enabled: Boolean(draft.enabled),
      required_hours: Number(draft.required_hours ?? 0),
      cooldown_hours: Number(draft.cooldown_hours ?? 0),
    };

    const payload: Record<string, unknown> = { ...basePayload };

    if (activeAssetType === 'full') {
      payload.asset_channel_id = draft.asset_channel_id?.trim() ?? '';
      payload.info_channel_id = draft.info_channel_id?.trim() ?? '';
      payload.required_role_id = draft.required_role_id?.trim() ?? '';
      payload.storage_enabled = draft.storage_mode === 'hosted';
      payload.storage_url = (storageUrl || draft.storage_url?.trim()) ?? '';
      payload.discoverable = Boolean(draft.discoverable);
    }

    if (activeAssetType === 'semi') {
      payload.info_channel_id = draft.info_channel_id?.trim() ?? '';
      payload.required_role_id = draft.required_role_id?.trim() ?? '';
    }

    if (activeAssetType === 'web') {
      payload.storage_enabled = draft.storage_mode === 'hosted';
      payload.storage_url = (storageUrl || draft.storage_url?.trim()) ?? '';
      payload.discoverable = Boolean(draft.discoverable);
    }

    const isEditing = Boolean(selectedAsset && selectedAsset.id);
    const url = `/api/dashboard/assets?guildId=${encodeURIComponent(guildId)}${isEditing ? `&assetId=${encodeURIComponent(selectedAsset!.id)}` : ''}`;
    const method = isEditing ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to save asset');
      }
      const saved = normalizeAsset(json.asset ?? json.data ?? {});
      const successMessage = isEditing ? 'Asset updated successfully' : 'Asset created successfully';
      setSaveMsg({ type: 'success', text: successMessage });
      showToast('success', 'Saved', successMessage);

      await fetchAssets();
      setSelectedAssetId(saved.id);
      setDraft(createDraftFromAsset(saved));
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Failed to save asset';
      setSaveMsg({ type: 'error', text: errorText });
      showToast('error', 'Save Failed', errorText);
    } finally {
      setSaving(false);
    }
  };

  const selectedLink = selectedAsset
    ? `/asset-access/${guildId}/${selectedAsset.id}`
    : `/asset-access/${guildId}`;
  const selectedLinkAbsolute = typeof window !== 'undefined'
    ? `${window.location.origin}${selectedLink}`
    : selectedLink;

  const showStorageField = activeTypeConfig.fields.includes('storage_enabled');
  const fileUploadAllowed = serverTier === 'premium' || serverTier === 'enterprise';
  const storageUrlExists = Boolean(draft.storage_url?.trim());
  const hasExistingHostedFile = Boolean(selectedAsset && draft.storage_mode === 'hosted' && storageUrlExists);
  const showDiscoverableToggle = activeAssetType === 'web' || activeAssetType === 'full';
  const canSendInfoMessage = Boolean(activeAssetType === 'semi' && draft.info_channel_id?.trim());

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-xl shadow-black/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-white text-2xl font-semibold">Asset Management</h3>
              <p className="mt-2 text-sm text-white/40">Create and manage asset access links with the correct settings for each type.</p>
            </div>
            <button
              type="button"
              onClick={resetDraft}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
            >
              + New asset
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div ref={typeMenuRef} className="relative">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-2">Asset Type</label>
              <button
                type="button"
                onClick={() => setTypeMenuOpen((open) => !open)}
                aria-expanded={typeMenuOpen}
                className="w-full flex items-center justify-between rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-left text-white text-sm backdrop-blur-xl focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                <span>{activeTypeConfig.name}</span>
                <span className="text-white/60">▾</span>
              </button>
              {typeMenuOpen && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-xl shadow-black/40">
                  {Object.entries(ASSET_TYPES).map(([key, typeConfig]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        handleFieldChange('asset_type', key as Asset['asset_type']);
                        setTypeMenuOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition ${activeAssetType === key ? 'bg-cyan-500/15 text-white' : 'text-white/70 hover:bg-white/5'}`}
                    >
                      <div className="font-medium">{typeConfig.name}</div>
                      <div className="mt-1 text-xs text-white/40">{typeConfig.description}</div>
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-white/40">
                {activeTypeConfig.description} {activeTypeConfig.availableTo.includes('free') ? 'Available to free, premium, and enterprise servers.' : 'Available to premium and enterprise servers only.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-2">Server discovery</label>
              <div className="inline-flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleServerAssetAccess}
                  disabled={serverToggleLoading}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${serverAssetAccessEnabled ? 'bg-cyan-500' : 'bg-white/10'} ${serverToggleLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${serverAssetAccessEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <span className="text-white/70 text-sm">{serverAssetAccessEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <p className="mt-2 text-xs text-white/40">When enabled, the server's public asset profile is active and will display all hosted web assets. Turn it off to disable the entire public asset page.</p>
            </div>
          </div>

          <div className="grid gap-4 mt-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-2">Asset Name</label>
              <input
                type="text"
                value={draft.name ?? ''}
                onChange={(event) => handleFieldChange('name', event.target.value)}
                placeholder="A short asset name"
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Asset Description</label>
                <span className={`text-xs tabular-nums ${descriptionOverLimit ? 'text-red-400 font-semibold' : descriptionLength > DESCRIPTION_MAX_LENGTH * 0.85 ? 'text-orange-400' : 'text-white/30'}`}>
                  {descriptionLength}/{DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
              <textarea
                value={draft.description ?? ''}
                onChange={(event) => {
                  const val = event.target.value;
                  if (val.length <= DESCRIPTION_MAX_LENGTH) {
                    handleFieldChange('description', val);
                  }
                }}
                placeholder="Optional description for the asset page"
                rows={3}
                maxLength={DESCRIPTION_MAX_LENGTH}
                className={`w-full rounded-3xl border bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:outline-none text-sm resize-none transition-colors ${descriptionOverLimit ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-cyan-500'}`}
              />
              {descriptionOverLimit && (
                <p className="mt-1 text-xs text-red-400">Description cannot exceed {DESCRIPTION_MAX_LENGTH} characters.</p>
              )}
            </div>

            {activeTypeConfig.fields.includes('asset_channel_id') && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-2">Asset Channel ID</label>
                <input
                  type="text"
                  value={draft.asset_channel_id ?? ''}
                  onChange={(event) => handleFieldChange('asset_channel_id', event.target.value.replace(/\D/g, ''))}
                  placeholder="Discord channel snowflake"
                  className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500 focus:outline-none text-sm font-mono"
                />
                <p className="mt-2 text-xs text-white/40">Channel where the asset will be granted upon approval.</p>
              </div>
            )}

            {activeTypeConfig.fields.includes('info_channel_id') && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-2">Info Channel ID</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={draft.info_channel_id ?? ''}
                    onChange={(event) => handleFieldChange('info_channel_id', event.target.value.replace(/\D/g, ''))}
                    placeholder="Visible info channel for users"
                    className="flex-1 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500 focus:outline-none text-sm font-mono"
                  />
                  {canSendInfoMessage && (
                    <button
                      type="button"
                      onClick={async () => {
                        setInfoSending(true);
                        try {
                          const channelId = draft.info_channel_id?.trim();
                          if (!channelId) throw new Error('Info channel is required');
                          const roleMention = draft.required_role_id ? `\nYou will receive the role <@&${draft.required_role_id}> when you activate the asset.` : '';
                          const message = `Go to this link to activate your asset and gain access:\n${selectedLinkAbsolute}${roleMention}`;

                          const res = await fetch('/api/dashboard/send-message', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ guildId, channelId, assetUrl: selectedLinkAbsolute, assetId: selectedAsset?.id, assetName: selectedAsset?.name, roleId: draft.required_role_id }),
                          });
                          const json = await res.json();
                          if (!res.ok) {
                            throw new Error(json?.error || 'Failed to send info message');
                          }
                          showToast('success', 'Message Sent', 'Info message sent to the info channel.');
                        } catch (err) {
                          showToast('error', 'Send Failed', err instanceof Error ? err.message : 'Unable to send info message');
                        } finally {
                          setInfoSending(false);
                        }
                      }}
                      disabled={infoSending}
                      className="rounded-3xl border border-white/10 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-200 hover:bg-blue-500/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {infoSending ? 'Sending…' : 'Send'}
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-white/40">Set a channel that users see before they gain access.</p>
              </div>
            )}

            {activeTypeConfig.fields.includes('required_role_id') && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-2">Required Role ID</label>
                <input
                  type="text"
                  value={draft.required_role_id ?? ''}
                  onChange={(event) => handleFieldChange('required_role_id', event.target.value.replace(/\D/g, ''))}
                  placeholder="Discord role snowflake"
                  className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500 focus:outline-none text-sm font-mono"
                />
                <p className="mt-2 text-xs text-white/40">Optional role required before users can request access.</p>
              </div>
            )}

            {activeTypeConfig.fields.includes('required_hours') && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-2">Required Hours</label>
                <input
                  type="number"
                  min={0}
                  value={draft.required_hours ?? 0}
                  onChange={(event) => handleFieldChange('required_hours', Number(event.target.value))}
                  className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500 focus:outline-none text-sm font-mono"
                />
                <p className="mt-2 text-xs text-white/40">Minimum time a user must be in the server before the asset is available.</p>
              </div>
            )}

            {activeTypeConfig.fields.includes('cooldown_hours') && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-2">Cooldown Hours</label>
                <input
                  type="number"
                  min={0}
                  value={draft.cooldown_hours ?? 0}
                  onChange={(event) => handleFieldChange('cooldown_hours', Number(event.target.value))}
                  className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500 focus:outline-none text-sm font-mono"
                />
                <p className="mt-2 text-xs text-white/40">Delay between repeated access checks for the same user.</p>
              </div>
            )}

            {showStorageField && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('storage_mode', 'external');
                      handleFieldChange('storage_enabled', false);
                    }}
                    disabled={hasExistingHostedFile}
                    className={`rounded-3xl border p-4 text-left transition ${draft.storage_mode === 'external' ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'} ${hasExistingHostedFile ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <p className="font-semibold text-white">External link</p>
                    <p className="mt-1 text-xs text-white/50">Send users directly to an outside URL.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('storage_mode', 'hosted')}
                    disabled={hasExistingHostedFile}
                    className={`rounded-3xl border p-4 text-left transition ${draft.storage_mode === 'hosted' ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'} ${hasExistingHostedFile ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <p className="font-semibold text-white">Host upload</p>
                    <p className="mt-1 text-xs text-white/50">Upload a file to Supabase storage and use a secure proxy download.</p>
                  </button>
                </div>

                {draft.storage_mode === 'external' ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-2">External URL</label>
                    <input
                      type="url"
                      value={draft.storage_url ?? ''}
                      onChange={(event) => handleFieldChange('storage_url', event.target.value)}
                      placeholder="https://example.com/download.zip"
                      className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500 focus:outline-none text-sm"
                    />
                    <p className="mt-2 text-xs text-white/40">Users will be redirected directly to this URL when the asset unlocks.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                      <p className="text-sm font-semibold text-white">Hosted file upload</p>
                      <p className="mt-2 text-xs text-white/40">
                        {fileUploadAllowed
                          ? 'Premium and enterprise servers can upload hosted files directly.'
                          : 'File uploads require a premium or enterprise server tier.'}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      <input
                        type="file"
                        accept="*/*"
                        disabled={!fileUploadAllowed || uploading || hasExistingHostedFile}
                        onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
                        className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
                      />
                      <div className="flex flex-wrap gap-3 items-center">
                        {selectedFile ? (
                          <>
                            <span className="text-sm text-white">{selectedFile.name}</span>
                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                              File selected; it will upload when you save.
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-white/70">Select a file to upload and save the asset to complete the upload.</span>
                        )}
                      </div>
                      {uploadError && (
                        <p className="text-xs text-red-300">{uploadError}</p>
                      )}
                      {storageUrlExists && draft.storage_mode === 'hosted' && (
                        <div className="rounded-3xl border border-green-500/20 bg-green-500/10 p-3 text-xs text-green-200">
                          Hosted file is already attached. Create a new asset to upload a different file.
                        </div>
                      )}
                    </div>

                  </div>
                )}
                {showDiscoverableToggle && (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">Enable public discovery</p>
                        <p className="mt-2 text-xs text-white/40">
                          When enabled, this asset can appear on the public discovery page for your server.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFieldChange('discoverable', !Boolean(draft.discoverable))}
                        aria-pressed={Boolean(draft.discoverable)}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${draft.discoverable ? 'bg-cyan-500' : 'bg-white/10'}`}
                      >
                        <span className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${draft.discoverable ? 'translate-x-6' : 'translate-x-0'}`} />
                        <span className="sr-only">Toggle public discovery</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={saving || descriptionOverLimit}
              onClick={handleSave}
              className="w-full sm:w-auto rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : selectedAsset ? 'Save changes' : 'Create asset'}
            </button>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <a
                href={selectedLinkAbsolute}
                target="_blank"
                rel="noreferrer"
                className="flex-1 rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 text-center hover:bg-white/10"
              >
                Open asset link
              </a>
              {selectedAsset && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedAsset) return;
                    if (!window.confirm('Delete this asset? This cannot be undone.')) return;
                    try {
                      const res = await fetch(
                        `/api/dashboard/assets?guildId=${encodeURIComponent(guildId)}&assetId=${encodeURIComponent(selectedAsset.id)}`,
                        { method: 'DELETE' }
                      );
                      const json = await res.json();
                      if (!res.ok) throw new Error(json?.error || 'Failed to delete asset');
                      showToast('success', 'Deleted', 'Asset removed successfully.');
                      resetDraft();
                      await fetchAssets();
                    } catch (err) {
                      showToast('error', 'Delete Failed', err instanceof Error ? err.message : 'Unable to remove asset');
                    }
                  }}
                  className="flex-1 rounded-3xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/20 transition"
                >
                  Delete asset
                </button>
              )}
            </div>
          </div>

          {saveMsg && (
            <div className={`rounded-3xl px-4 py-3 text-sm ${saveMsg.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'} mt-4`}>
              {saveMsg.text}
            </div>
          )}
        </div>

        {loadError && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200">
            <p className="font-semibold">Unable to load assets</p>
            <p className="mt-2 text-white/80">{loadError}</p>
            <button
              type="button"
              onClick={fetchAssets}
              className="mt-4 rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400 transition"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <aside className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Saved assets</p>
            <h4 className="text-white text-lg font-semibold">Asset list</h4>
          </div>
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
            {assets.length} asset{assets.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="h-16 rounded-3xl bg-white/10" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-black/30 p-5 text-center text-white/60">
            <p>No assets configured yet.</p>
            <p className="mt-2 text-xs">Create an asset type and share the generated link with your members.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => handleSelectAsset(asset)}
                className={`w-full text-left rounded-3xl border px-4 py-4 transition ${selectedAsset?.id === asset.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{asset.name || `Asset ${asset.id.slice(0, 8)}`}</p>
                    <p className="mt-1 text-xs text-white/50 truncate">{asset.description || ASSET_TYPES[asset.asset_type]?.description}</p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${asset.enabled ? 'bg-emerald-500/10 text-emerald-200' : 'bg-white/10 text-white/60'}`}>
                    {asset.asset_type}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/50">
                  <span>{asset.required_hours}h required</span>
                  <span>{asset.cooldown_hours}h cooldown</span>
                  {asset.storage_enabled ? <span>storage</span> : null}
                  {typeof asset.download_count === 'number' ? <span>{asset.download_count} downloads</span> : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}