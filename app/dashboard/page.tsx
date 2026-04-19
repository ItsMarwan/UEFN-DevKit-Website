// app/dashboard/page.tsx
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

interface User {
  id: string;
  username: string;
  avatar: string | null;
  email: string;
}

type LoadState = 'loading' | 'ready' | 'error';

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const botHealth = useBotHealth();
  const [user, setUser] = useState<User | null>(null);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
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
          setUser(null);
          setGuilds([]);
          setLoadState('ready');
          showToast('error', 'Session Failed', errorMsg);
          router.replace('/api/dashboard/login');
          return;
        }
        const data = await res.json();
        
        if (!data) {
          setUser(null);
          setGuilds([]);
          setLoadState('ready');
          showToast('error', 'Session Error', 'Failed to retrieve your session data. Please try logging in again.');
          router.replace('/api/dashboard/login');
          return;
        }

        setUser(data.user);
        setGuilds(data.guilds || []);
        setLoadState('ready');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setUser(null);
        setGuilds([]);
        setLoadState('ready');
        showToast('error', 'Connection Error', `Could not connect to the server: ${errorMessage}`);
        router.replace('/api/dashboard/login');
      }
    };

    fetchSession();
  }, [router, showToast]);

  const getAvatarUrl = (u: User) =>
    u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(u.id) % 5}.png`;

  const getGuildIcon = (g: Guild) =>
    g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;

  if (loadState === 'loading') {
    return (
      <div className="bg-black text-white min-h-screen p-8">
        <div className="mx-auto w-full max-w-6xl animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-8 w-2/5" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="h-28 rounded-xl bg-white/10" />
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="h-44 rounded-xl bg-white/10" />
            ))}
          </div>
          <p className="mt-6 text-white/60">Loading your servers…</p>
        </div>
      </div>
    );
  }

  const manageableGuilds = guilds.filter((g) => g.hasPerms);
  const viewOnlyGuilds = guilds.filter((g) => !g.hasPerms);

  const GuildCard = ({ guild, disabled }: { guild: Guild; disabled?: boolean }) => {
    const icon = getGuildIcon(guild);
    const inner = (
      <div
        className={`group p-5 rounded-xl border transition-all ${
          disabled
            ? 'border-white/5 bg-black/20 cursor-not-allowed'
            : 'border-white/10 bg-black/40 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer'
        }`}
        style={{ opacity: disabled ? 0.4 : 1 }}
      >
        <div className="flex items-center gap-4">
          {icon ? (
            <Image src={icon} alt={guild.name} width={48} height={48} className="w-12 h-12 rounded-xl flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">{guild.name.charAt(0)}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3
              className={`font-semibold truncate ${
                disabled
                  ? 'text-white/50'
                  : 'text-white group-hover:text-blue-400 transition-colors'
              }`}
            >
              {guild.name}
            </h3>
            <p className="text-xs mt-0.5">
              {disabled ? (
                <span className="text-red-400/70">No permission</span>
              ) : (
                <span className="text-white/40">{guild.owner ? 'Owner' : 'Manager'}</span>
              )}
            </p>
          </div>
        </div>
      </div>
    );

    if (disabled) return inner;
    return <Link href={`/dashboard/${guild.id}`}>{inner}</Link>;
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <OfflineBanner health={botHealth} />
      {/* Header */}
      <section className="py-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-white/60 mt-1">
              {guilds.length === 0
                ? 'No servers with UEFN DevKit found'
                : `${guilds.length} server${guilds.length !== 1 ? 's' : ''} with UEFN DevKit`}
            </p>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <Image
                src={getAvatarUrl(user)}
                alt={user.username}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full border-2 border-blue-500/50"
              />
              <div className="hidden sm:block">
                <p className="text-white font-semibold text-sm">{user.username}</p>
                <MaskedEmail email={user.email} className="text-white/40 text-xs" />
              </div>
              <a
                href="/api/dashboard/logout"
                className="ml-2 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/70 hover:text-white"
              >
                Logout
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Server grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!user ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
              <p className="text-white/60 mb-6">
                You are not authenticated. Please log in to access your dashboard.
              </p>
              <a
                href="/api/dashboard/login"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all"
              >
                Log In
              </a>
            </div>
          ) : guilds.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🏝️</div>
              <h2 className="text-2xl font-bold text-white mb-2">No servers found</h2>
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
            <>
              {/* Servers with manage permission */}
              {manageableGuilds.length > 0 && (
                <div className="mb-10">
                  <p className="text-white/50 text-sm mb-4">
                    {manageableGuilds.length} server{manageableGuilds.length !== 1 ? 's' : ''} you can manage
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {manageableGuilds.map((g) => (
                      <GuildCard key={g.id} guild={g} />
                    ))}
                  </div>
                </div>
              )}

              {/* Servers without permission */}
              {viewOnlyGuilds.length > 0 && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-white/10" />
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500/70">🔒</span>
                      <span className="text-white/30 text-xs font-medium uppercase tracking-widest">
                        No manage access
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  <p className="text-white/40 text-xs mb-4 ml-1">
                    You&apos;re in these servers with UEFN DevKit, but you need to be a server owner or manager to access the dashboard.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {viewOnlyGuilds.map((g) => (
                      <GuildCard key={g.id} guild={g} disabled />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}