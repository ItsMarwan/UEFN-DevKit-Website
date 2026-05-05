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

// Interfaces
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
  const fetched = useRef(false);

  // Session fetch logic
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
          router.replace('/api/login?next=/me');
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

  // UI Helper functions
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

  const getRoleBadgeClasses = (guild: Guild) => {
    if (guild.owner) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (guild.hasPerms) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    return 'bg-neutral-800 text-neutral-400 border-neutral-700';
  };

  // Loading skeleton
  if (loadState === 'loading') {
    return (
      <div className="min-h-screen text-white selection:bg-blue-500/30">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-neutral-800/50 animate-pulse ring-1 ring-white/5" />
              <div className="space-y-4">
                <div className="h-8 w-56 bg-neutral-800/50 rounded-lg animate-pulse" />
                <div className="h-4 w-40 bg-neutral-800/50 rounded-lg animate-pulse" />
                <div className="h-4 w-48 bg-neutral-800/50 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="w-24 h-10 bg-neutral-800/50 rounded-xl animate-pulse" />
          </div>

          <div className="flex gap-2 mb-8">
            <div className="w-32 h-10 bg-neutral-800/50 rounded-lg animate-pulse" />
            <div className="w-48 h-10 bg-neutral-800/50 rounded-lg animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/5 bg-neutral-900/20 h-40 flex flex-col justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-neutral-800/50 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-3 pt-1">
                    <div className="h-5 w-3/4 bg-neutral-800/50 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-neutral-800/50 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                  <div className="h-6 w-16 bg-neutral-800/50 rounded-full animate-pulse" />
                  <div className="h-8 w-20 bg-neutral-800/50 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (loadState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 text-center backdrop-blur-sm">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-neutral-400 mb-8">{errorMsg}</p>
          <a
            href="/api/login?next=/me"
            className="inline-flex items-center justify-center w-full px-4 py-3 bg-white text-black hover:bg-neutral-200 transition-colors rounded-xl font-medium"
          >
            Log in again
          </a>
        </div>
      </div>
    );
  }

  const guildIcon = (guild: Guild) => getGuildIcon(guild.icon, guild.id);
  const authServerIcon = (server: AuthenticatedServer) => 
    getGuildIcon(server.guild_icon, server.guild_id);

  return (
    <div className="min-h-screen text-neutral-200 selection:bg-blue-500/30 font-sans">
      <OfflineBanner health={botHealth} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        
        {/* Profile Header */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          {user && (
            <div className="flex items-center gap-6">
              <div className="relative">
                <Image
                  src={getAvatarUrl(user)}
                  alt={user.username}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full ring-4 ring-neutral-900 border border-neutral-800 object-cover bg-neutral-900"
                />
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#0a0a0a]"></div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {user.username}
                </h1>
                <p className="text-sm text-neutral-500 mt-1 font-mono">
                  ID: {user.id}
                </p>
                {user.email && (
                  <div className="mt-2 text-sm text-neutral-400">
                    <MaskedEmail email={user.email} />
                  </div>
                )}
              </div>
            </div>
          )}
          <a
            href="/api/dashboard/logout"
            className="px-5 py-2.5 text-sm font-medium bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 rounded-xl transition-all text-neutral-300 hover:text-white flex-shrink-0"
          >
            Sign out
          </a>
        </section>

        {/* Navigation Tabs */}
        <div className="flex p-1.5 space-x-1 bg-neutral-900/40 border border-neutral-800 rounded-2xl w-fit mb-8 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('servers')}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
              activeTab === 'servers'
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/50'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 border border-transparent'
            }`}
          >
            Your Servers
            <span className={`ml-2.5 px-2 py-0.5 rounded-full text-xs ${activeTab === 'servers' ? 'bg-neutral-700 text-neutral-100' : 'bg-neutral-800 text-neutral-400'}`}>
              {guilds.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('authenticated')}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
              activeTab === 'authenticated'
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/50'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 border border-transparent'
            }`}
          >
            Authenticated
            <span className={`ml-2.5 px-2 py-0.5 rounded-full text-xs ${activeTab === 'authenticated' ? 'bg-neutral-700 text-neutral-100' : 'bg-neutral-800 text-neutral-400'}`}>
              {authenticatedServers.length}
            </span>
          </button>
        </div>

        {/* Servers View */}
        {activeTab === 'servers' && (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {guilds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-4 text-center border border-dashed border-neutral-800 rounded-3xl bg-neutral-900/20">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-blue-500/20">
                  <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No servers found</h3>
                <p className="text-neutral-400 mb-8 max-w-md">
                  It looks like the bot isn't present in any of your servers yet. Invite it to get started.
                </p>
                <a
                  href="/invite"
                  className="px-6 py-3 bg-white text-black hover:bg-neutral-200 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Invite Bot
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {guilds.map((guild) => (
                  <div
                    key={guild.id}
                    className="group relative p-5 rounded-2xl bg-neutral-900/30 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60 transition-all duration-300 flex flex-col h-full"
                  >
                    <div className="flex items-start gap-4">
                      {guildIcon(guild) ? (
                        <Image
                          src={guildIcon(guild)!}
                          alt={guild.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-800 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-neutral-300 font-semibold text-lg uppercase">
                            {guild.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="font-medium text-neutral-100 truncate group-hover:text-white transition-colors">
                          {guild.name}
                        </h3>
                        <p className="text-xs text-neutral-500 font-mono mt-1">
                          {guild.id}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-6 flex items-center justify-between">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${getRoleBadgeClasses(guild)}`}>
                        {getRoleText(guild)}
                      </span>
                      
                      {guild.hasPerms && (
                        <Link
                          href={`/dashboard/${guild.id}`}
                          className="text-sm px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/5"
                        >
                          Manage
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Authenticated Servers View */}
        {activeTab === 'authenticated' && (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {authenticatedServers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-4 text-center border border-dashed border-neutral-800 rounded-3xl bg-neutral-900/20">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-emerald-500/20">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No authenticated servers</h3>
                <p className="text-neutral-400 mb-2 max-w-md">
                  You haven't authenticated with any servers yet. 
                </p>
                <p className="text-sm text-neutral-500">
                  Visit a server's verification page to get started.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {authenticatedServers.map((server) => (
                  <div
                    key={server.guild_id}
                    className="p-5 rounded-2xl bg-neutral-900/30 border border-neutral-800 hover:border-emerald-500/30 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      {authServerIcon(server) ? (
                        <Image
                          src={authServerIcon(server)!}
                          alt={server.guild_name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-800 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-neutral-300 font-semibold text-lg uppercase">
                            {server.guild_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-medium text-neutral-100 truncate">
                            {server.guild_name}
                          </h3>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md text-xs font-medium flex-shrink-0">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                            </svg>
                            Verified
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          {server.role_names.length > 0 ? (
                            server.role_names.map((role, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2.5 py-1 bg-neutral-800/80 text-neutral-300 rounded-md border border-neutral-700"
                              >
                                {role}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-neutral-500 italic">No roles assigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}