// app/server/config/page.tsx
'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface ConfigPageProps {}

function ServerConfigContent() {
  const searchParams = useSearchParams();
  const guildId = searchParams.get('guildId');
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!guildId) {
      setError('No guild ID provided');
      setLoading(false);
      return;
    }

    const fetchConfig = async () => {
      try {
        const res = await fetch(`/api/dashboard/server-config?guildId=${guildId}`);
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || 'Failed to load configuration');
        }
        const json = await res.json();
        
        // Extract config from nested structure
        let configData;
        if (json?.data?.endpoint === 'guild_settings' && json?.data?.data) {
          configData = json.data.data;
        } else if (json?.data?.[0]) {
          configData = json.data[0];
        } else if (json?.data?.data) {
          configData = json.data.data;
        } else {
          configData = json.data || json;
        }

        // Warn if guild IDs do not match, but continue to show data if available
        if (configData?.guild_id && String(configData.guild_id) !== guildId) {
          setWarning(`Received data for wrong guild (${configData.guild_id}). Expected ${guildId}.`);
        }

        // Normalize admin_allowed_roles string -> array
        if (typeof configData.admin_allowed_roles === 'string') {
          try {
            configData.admin_allowed_roles = JSON.parse(configData.admin_allowed_roles);
          } catch {
            configData.admin_allowed_roles = [];
          }
        }

        setConfig(configData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [guildId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-400 mb-2">Error</h1>
          <p className="text-white/60">{error}</p>
          <Link href="/" className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {warning && (
        <div className="px-4 py-3 rounded-lg border border-yellow-300 bg-yellow-500/10 text-yellow-200 text-sm">
          ⚠️ {warning}
        </div>
      )}
      {!config ? (
        <div className="text-center text-white/60">No configuration available</div>
      ) : (
        <>
          {/* General Settings */}
          <div className="bg-black/40 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">General Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-white/40 text-sm uppercase tracking-wide">Guild ID</p>
                <p className="text-white font-mono">{config.guild_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-white/40 text-sm uppercase tracking-wide">Server Tier</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${
                  config.server_tier === 'enterprise' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : config.server_tier === 'premium' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : 'bg-white/5 text-white/30 border-white/10'
                }`}>
                  {config.server_tier ? config.server_tier.charAt(0).toUpperCase() + config.server_tier.slice(1) : 'Free'}
                </span>
              </div>
            </div>
          </div>

          {/* Log Channel */}
          <div className="bg-black/40 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Logging</h2>
            <div>
              <p className="text-white/40 text-sm uppercase tracking-wide">Log Channel ID</p>
              <p className="text-white font-mono">{config.log_channel_id || 'Not configured'}</p>
            </div>
          </div>

          {/* Roles */}
          <div className="bg-black/40 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Roles</h2>
            <div className="space-y-4">
              <div>
                <p className="text-white/40 text-sm uppercase tracking-wide mb-2">Default Customer Role</p>
                <p className="text-white font-mono">{config.default_customer_role_id || 'Not configured'}</p>
              </div>
              <div>
                <p className="text-white/40 text-sm uppercase tracking-wide mb-2">Admin Allowed Roles</p>
                {Array.isArray(config.admin_allowed_roles) && config.admin_allowed_roles.length > 0 ? (
                  <div className="space-y-1">
                    {config.admin_allowed_roles.map((role: string) => (
                      <p key={role} className="text-white font-mono text-sm">{role}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60">None configured</p>
                )}
              </div>
            </div>
          </div>

          {/* Encryption */}
          <div className="bg-black/40 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Encryption</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-white/40 text-sm uppercase tracking-wide">Encryption Enabled</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${
                  config.encryption_enabled ? 'bg-green-500/20 text-green-300 border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border-red-500/30'
                }`}>
                  {config.encryption_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div>
                <p className="text-white/40 text-sm uppercase tracking-wide">Key Stored on Server</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${
                  config.key_stored_on_server ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                }`}>
                  {config.key_stored_on_server ? 'Server-Side' : 'User-Provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-black/40 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Metadata</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/40 uppercase tracking-wide">Created At</p>
                <p className="text-white/80">{config.created_at ? new Date(config.created_at).toLocaleString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-white/40 uppercase tracking-wide">Updated At</p>
                <p className="text-white/80">{config.updated_at ? new Date(config.updated_at).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* JSON View */}
          <div className="bg-black/40 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Raw JSON</h2>
            <pre className="bg-black/60 border border-white/10 rounded p-4 overflow-x-auto text-white/80 text-xs max-h-64">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}

export default function ServerConfigPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Server Configuration</h1>
          <Link href="/" className="text-white/60 hover:text-white transition">
            ← Back
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <ServerConfigContent />
        </Suspense>
      </div>
    </div>
  );
}
