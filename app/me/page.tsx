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

interface User {
  id: string;
  username: string;
  avatar: string | null;
  email?: string;
}

type LoadState = 'loading' | 'ready' | 'error';

export default function MePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const botHealth = useBotHealth();
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

  const getGuildIcon = (g: Guild) =>
    g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;

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
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading your profile...</p>
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

      {/* Servers Section */}
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
                    {getGuildIcon(guild) ? (
                      <Image
                        src={getGuildIcon(guild)!}
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
    </div>
  );
}