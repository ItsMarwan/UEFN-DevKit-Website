// app/dashboard/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const [user, setUser] = useState<User | null>(null);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  // Prevent double-fetch from React StrictMode double-invoking effects
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchSession = async () => {
      try {
        const res = await fetch('/api/dashboard/session');
        if (!res.ok) {
          router.replace('/api/dashboard/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setGuilds(data.guilds || []);
        setLoadState('ready');
      } catch {
        setErrorMsg('Failed to load session.');
        setLoadState('error');
      }
    };

    fetchSession();
  }, [router]);

  const getAvatarUrl = (u: User) =>
    u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(u.id) % 5}.png`;

  const getGuildIcon = (g: Guild) =>
    g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;

  const manageableGuilds = guilds.filter((g) => g.hasPerms);
  const viewOnlyGuilds = guilds.filter((g) => !g.hasPerms);

  if (loadState === 'loading') {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading your servers...</p>
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
            <img src={icon} alt={guild.name} className="w-12 h-12 rounded-xl flex-shrink-0" />
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
    <div className="bg-black text-white min-h-screen pt-16">
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
              <img
                src={getAvatarUrl(user)}
                alt={user.username}
                className="w-10 h-10 rounded-full border-2 border-blue-500/50"
              />
              <div className="hidden sm:block">
                <p className="text-white font-semibold text-sm">{user.username}</p>
                <p className="text-white/40 text-xs">{user.email}</p>
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
          {guilds.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🏝️</div>
              <h2 className="text-2xl font-bold text-white mb-2">No servers found</h2>
              <p className="text-white/60 mb-6">
                UEFN DevKit isn't in any of your servers yet.
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
                    <span className="text-white/30 text-xs font-medium uppercase tracking-widest">
                      No manage permission
                    </span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
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