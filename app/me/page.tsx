// app/me/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/components/ToastProvider';
import { useBotHealth } from '@/hooks/useBotHealth';
import { OfflineBanner } from '@/components/OfflineBanner';
import MaskedEmail from '@/components/MaskedEmail';
import { extractErrorMessage } from '@/lib/api-error';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: number;
  hasPerms: boolean;
}

interface AuthenticatedServer {
  guild_id: string;
  guild_name: string;
  guild_icon: string | null;
  role_names: string[];
  patreon_setup: boolean;
}

interface User {
  id: string;
  username: string;
  avatar: string | null;
  email?: string;
}

type LoadState = 'loading' | 'ready' | 'error';
type Tab = 'servers' | 'authenticated';

export default function MePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const botHealth = useBotHealth();
  const [user, setUser] = useState<User | null>(null);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [authenticatedServers, setAuthenticatedServers] = useState<AuthenticatedServer[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('servers');
  // Prevent double-fetch from React StrictMode double-invoking effects
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchSession = async () => {
      try {
        const res = await fetch('/api/dashboard/session');
        if (!res.ok) {
          const errorMsg = await extractErrorMessage(res);
          setErrorMsg(errorMsg);
          setLoadState('error');
          showToast('error', 'Session Failed', errorMsg);
          router.replace('/api/dashboard/login');
          return;
        }
        const data = await res.json();

        if (!data) {
          setErrorMsg('No session data received from server');
          setLoadState('error');
          showToast('error', 'Session Error', 'Failed to retrieve your session data. Please try logging in again.');
          return;
        }

        setUser(data.user);
        setGuilds(data.guilds || []);
        setLoadState('ready');

        // Fetch authenticated servers
        if (data.user?.id) {
          try {
            const authRes = await fetch('/api/me/authenticated-servers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ discord_user_id: data.user.id }),
            });

            if (authRes.ok) {
              const authData = await authRes.json();
              setAuthenticatedServers(authData.servers || []);
            }
          } catch (error) {
            // Fail silently for authenticated servers fetch
            console.debug('Failed to fetch authenticated servers');
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setErrorMsg('Failed to load session.');
        setLoadState('error');
        showToast('error', 'Connection Error', `Could not connect to the server: ${errorMessage}`);
      }
    };

    fetchSession();
  }, [router, showToast]);

  const getAvatarUrl = (u: User) =>
    u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(u.id) % 5}.png`;

  const getGuildIcon = (icon: string | null, id: string) =>
    icon ? `https://cdn.discordapp.com/icons/${id}/${icon}.png` : null;

  const getRoleText = (guild: Guild) => {
    if (guild.owner) return 'Owner';
    if (guild.hasPerms) return 'Manager';
    return 'Member';
  };

  const getRoleColor = (guild: Guild) => {
    if (guild.owner) return 'text-green-400';
    if (guild.hasPerms) return 'text-blue-400';
    return 'text-yellow-400';
  };

  if (loadState === 'loading') {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="animate-pulse max-w-4xl w-full p-6 rounded-xl border border-white/10 bg-black/40">
          <div className="h-6 rounded bg-white/10 w-48 mb-4" />
          <div className="h-4 rounded bg-white/10 w-64 mb-6" />
          <div className="flex flex-col md:flex-row gap-4">
            <div className="h-28 w-28 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-5 rounded bg-white/10 w-40" />
              <div className="h-4 rounded bg-white/10 w-56" />
              <div className="h-4 rounded bg-white/10 w-52" />
              <div className="h-4 rounded bg-white/10 w-28" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white/10" />
            ))}
          </div>
          <p className="text-white/60 mt-4">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{errorMsg}</p>
          <a
            href="/api/dashboard/login"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold"
          >
            Login Again
          </a>
        </div>
      </div>
    );
  }

  const guildIcon = (guild: Guild) => getGuildIcon(guild.icon, guild.id);
  const authServerIcon = (server: AuthenticatedServer) => 
    getGuildIcon(server.guild_icon, server.guild_id);

  return (
    <div className="bg-black text-white min-h-screen">
      <OfflineBanner health={botHealth} />

      {/* Header with User Info */}
      <section className="py-10 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-white/60 mt-1">
                Your Discord account and server access
              </p>
            </div>
            <a
              href="/api/dashboard/logout"
              className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/70 hover:text-white"
            >
              Logout
            </a>
          </div>

          {user && (
            <div className="mt-8 p-6 rounded-xl border border-white/10 bg-black/40">
              <div className="flex items-center gap-4">
                <Image
                  src={getAvatarUrl(user)}
                  alt={user.username}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full border-2 border-blue-500/50"
                />
                <div>
                  <h2 className="text-xl font-semibold text-white">{user.username}</h2>
                  <p className="text-white/60 text-sm">Discord ID: {user.id}</p>
                  {user.email && (
                    <MaskedEmail email={user.email} className="text-white/40 text-sm" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tabs */}
      <section className="py-6 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('servers')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'servers'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                  : 'text-white/60 hover:text-white border border-transparent'
              }`}
            >
              Your Servers ({guilds.length})
            </button>
            <button
              onClick={() => setActiveTab('authenticated')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'authenticated'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'text-white/60 hover:text-white border border-transparent'
              }`}
            >
              Authenticated Servers ({authenticatedServers.length})
            </button>
          </div>
        </div>
      </section>

      {/* Servers Tab */}
      {activeTab === 'servers' && (
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Your Servers ({guilds.length})
            </h2>

            {guilds.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🏝️</div>
                <h3 className="text-xl font-bold text-white mb-2">No servers found</h3>
                <p className="text-white/60 mb-6">
                  UEFN DevKit isn&apos;t in any of your servers yet.
                </p>
                <a
                  href="/invite"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                  Invite UEFN DevKit
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {guilds.map((guild) => (
                  <div
                    key={guild.id}
                    className="p-5 rounded-xl border border-white/10 bg-black/40 hover:border-blue-500/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {guildIcon(guild) ? (
                        <Image
                          src={guildIcon(guild)!}
                          alt={guild.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-xl flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">{guild.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{guild.name}</h3>
                        <p className="text-sm text-white/60">Server ID: {guild.id}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${getRoleColor(guild)}`}>
                          {getRoleText(guild)}
                        </span>
                        {guild.hasPerms && (
                          <div className="mt-1">
                            <Link
                              href={`/dashboard/${guild.id}`}
                              className="text-xs px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                            >
                              Manage
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Authenticated Servers Tab */}
      {activeTab === 'authenticated' && (
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Authenticated Servers ({authenticatedServers.length})
            </h2>

            {authenticatedServers.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔐</div>
                <h3 className="text-xl font-bold text-white mb-2">No authenticated servers</h3>
                <p className="text-white/60 mb-6">
                  You haven&apos;t authenticated with any servers yet. Visit a server&apos;s Patreon verification page to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {authenticatedServers.map((server) => (
                  <div
                    key={server.guild_id}
                    className="p-5 rounded-xl border border-white/10 bg-black/40 hover:border-green-500/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {authServerIcon(server) ? (
                        <Image
                          src={authServerIcon(server)!}
                          alt={server.guild_name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-xl flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">{server.guild_name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{server.guild_name}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {server.role_names.map((role, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-medium text-green-400">✓ Verified</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}