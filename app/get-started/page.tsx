'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

interface User {
  id: string;
  username: string;
  discriminator?: string;
  avatar: string | null;
}

interface GuildData {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: number;
  botPresent: boolean;
  hasManagePerms: boolean;
}

const DISCORD_LOGIN_URL = '/api/dashboard/login?next=/get-started';
const INVITE_PAGE_URL = '/invite';

function getGuildIconUrl(guild: GuildData) {
  if (!guild.icon) return null;
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
}

function buildDiscordName(user: User) {
  if (user.discriminator && user.discriminator !== '0') {
    return `${user.username}#${user.discriminator}`;
  }
  return user.username;
}

function ServerIcon({ guild }: { guild: GuildData }) {
  const iconUrl = getGuildIconUrl(guild);
  return iconUrl ? (
    <Image
      src={iconUrl}
      alt={`${guild.name} icon`}
      width={64}
      height={64}
      className="rounded-lg"
    />
  ) : (
    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold text-white/80">
      {guild.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 w-2/3 rounded-lg bg-white/10" />
      <div className="h-4 w-full rounded-lg bg-white/10" />
      <div className="h-4 w-5/6 rounded-lg bg-white/10" />
      <div className="mt-8 space-y-3">
        <div className="h-12 rounded-lg bg-white/10" />
        <div className="h-12 rounded-lg bg-white/10" />
      </div>
    </div>
  );
}

type Step = 'login' | 'welcome' | 'recommended' | 'alternatives' | 'verify' | 'dashboard';

interface ErrorState {
  visible: boolean;
  message: string;
}

export default function GetStartedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [guilds, setGuilds] = useState<GuildData[]>([]);
  const [guildsLoading, setGuildsLoading] = useState(false);
  const [step, setStep] = useState<Step>('login');
  const [selectedGuild, setSelectedGuild] = useState<GuildData | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<ErrorState>({ visible: false, message: '' });

  const recommendedGuild = useMemo(() => {
    const manageable = guilds.filter((guild) => guild.hasManagePerms);
    if (manageable.length === 0) return null;
    return manageable.find((guild) => !guild.botPresent) ?? manageable[0];
  }, [guilds]);

  const alternativeGuilds = useMemo(() => {
    if (!recommendedGuild) return guilds.filter((guild) => guild.hasManagePerms).slice(0, 3);
    return guilds.filter((guild) => guild.id !== recommendedGuild.id && guild.hasManagePerms).slice(0, 3);
  }, [guilds, recommendedGuild]);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/dashboard/session?lightweight=true', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user ?? null);
          setStep('welcome');
        } else {
          setStep('login');
        }
      } catch {
        setStep('login');
      } finally {
        setSessionLoading(false);
      }
    }

    loadSession();
  }, []);

  useEffect(() => {
    if (step !== 'welcome' || guildsLoading || guilds.length > 0) return;

    setGuildsLoading(true);

    async function loadGuilds() {
      try {
        const res = await fetch('/api/dashboard/guilds', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setGuilds(data.guilds ?? []);
        } else {
          const payload = await res.json().catch(() => ({}));
          showError(payload?.error || 'Unable to load your servers.');
        }
      } catch {
        showError('Unable to load your servers.');
      } finally {
        setGuildsLoading(false);
      }
    }

    loadGuilds();
  }, [step, guildsLoading, guilds.length]);

  useEffect(() => {
    if (step !== 'welcome') return;
    if (!guildsLoading && guilds.length > 0 && recommendedGuild) {
      setSelectedGuild(recommendedGuild);
      setTimeout(() => setStep('recommended'), 240);
    }
  }, [step, guildsLoading, guilds.length, recommendedGuild]);

  const showError = (message: string) => {
    setError({ visible: true, message });
    setTimeout(() => setError({ visible: false, message: '' }), 4200);
  };

  const handleLogin = () => {
    window.location.href = DISCORD_LOGIN_URL;
  };

  const handleSelectAlternative = (guild: GuildData) => {
    setSelectedGuild(guild);
    setStep('verify');
  };

  const handleVerifyBot = async () => {
    if (!selectedGuild) return;
    setVerifying(true);

    try {
      const res = await fetch(`/api/dashboard/verify-access?guildId=${encodeURIComponent(selectedGuild.id)}`, {
        cache: 'no-store',
      });
      const payload = await res.json();

      if (!res.ok) {
        let message = 'Something went wrong. Please try again.';
        if (payload.reason === 'bot_not_in_guild') {
          message = 'The bot is not in this server yet. Add it and verify again.';
        } else if (payload.reason === 'no_permission') {
          message = 'Verify failed: you need Manage Server or Administrator permissions.';
        } else if (payload.reason === 'not_in_guild') {
          message = 'You are no longer in that server. Pick another one.';
        } else if (payload.reason === 'not_authenticated' || payload.reason === 'session_expired') {
          message = 'Your session expired. Please sign in again.';
          setStep('login');
        }
        showError(message);
        return;
      }

      setStep('dashboard');
    } catch {
      showError('Unable to verify the bot. Try again in a moment.');
    } finally {
      setVerifying(false);
    }
  };

  const handleGoToDashboard = () => {
    if (!selectedGuild) return;
    window.location.href = `/dashboard/${encodeURIComponent(selectedGuild.id)}`;
  };

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <div className="mx-auto max-w-md">
        {error.visible && (
          <div className="mb-4 rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100 shadow-lg shadow-red-500/10 animate-in fade-in slide-in-from-top-2 duration-300">
            {error.message}
          </div>
        )}

        {step === 'login' && (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-cyan-300/80">Get started</p>
                <h1 className="mt-4 text-3xl font-semibold">Welcome to UEFN DevKit</h1>
                <p className="mt-3 text-white/70">
                  Connect your Discord account and we’ll guide you through setting up the best server for your team.
                </p>
              </div>
              <button
                onClick={handleLogin}
                className="w-full rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-500 py-3 text-base font-semibold text-white shadow-lg shadow-cyan-500/10 transition hover:opacity-90"
              >
                Sign in with Discord
              </button>
            </div>
          </div>
        )}

        {step === 'welcome' && (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-cyan-300/80">Welcome</p>
                <h1 className="mt-4 text-3xl font-semibold">Hello, {user ? buildDiscordName(user) : 'friend'}.</h1>
                <p className="mt-3 text-white/70">
                  We’re finding the server with the right access for UEFN DevKit. This only takes a moment.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
                {guildsLoading ? (
                  <SkeletonLoader />
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-white/60">Loading recommended servers…</p>
                    <div className="h-4 w-3/4 rounded-lg bg-white/10" />
                    <div className="h-4 w-2/3 rounded-lg bg-white/10" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'recommended' && selectedGuild && (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-cyan-300/80">Recommended server</p>
                <h1 className="mt-4 text-3xl font-semibold">This server is a great fit.</h1>
                <p className="mt-3 text-white/70">
                  We selected the server you can manage with the best access. If the bot isn't there yet, add it and keep going.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
                <div className="flex items-center gap-4">
                  <ServerIcon guild={selectedGuild} />
                  <div>
                    <p className="text-sm uppercase text-cyan-300/80">Best match</p>
                    <p className="mt-2 text-xl font-semibold text-white">{selectedGuild.name}</p>
                    <p className="mt-2 text-white/70">
                      {selectedGuild.botPresent ? 'The bot is already installed.' : 'The bot is not installed yet.'}
                    </p>
                  </div>
                </div>
              </div>

              {!selectedGuild.botPresent ? (
                <>
                  <a
                    href={`${INVITE_PAGE_URL}?guild_id=${encodeURIComponent(selectedGuild.id)}`}
                    className="block w-full rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-500 py-3 text-center font-semibold text-white shadow-lg shadow-cyan-500/10 transition hover:opacity-90"
                  >
                    Add bot to server
                  </a>
                  <button
                    onClick={() => setStep('alternatives')}
                    className="w-full rounded-3xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10"
                  >
                    Choose another server
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setStep('verify')}
                    className="block w-full rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-500 py-3 text-center font-semibold text-white shadow-lg shadow-cyan-500/10 transition hover:opacity-90"
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => setStep('alternatives')}
                    className="w-full rounded-3xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10"
                  >
                    Choose another server
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {step === 'alternatives' && (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-cyan-300/80">Other servers</p>
                <h1 className="mt-4 text-3xl font-semibold">Pick the next best option.</h1>
                <p className="mt-3 text-white/70">
                  Here are more servers you can manage. Select one and continue.
                </p>
              </div>

              <div className="space-y-3">
                {alternativeGuilds.map((guild) => (
                  <button
                    key={guild.id}
                    onClick={() => handleSelectAlternative(guild)}
                    className="w-full rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <ServerIcon guild={guild} />
                        <div>
                          <p className="font-semibold text-white">{guild.name}</p>
                          <p className="text-sm text-white/60">
                            {guild.botPresent ? 'Bot installed' : 'Needs bot'}
                          </p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        guild.botPresent ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-white/70'
                      }`}>
                        {guild.botPresent ? 'Installed' : 'Invite'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep('recommended')}
                className="w-full rounded-3xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10"
              >
                Back to recommendation
              </button>
            </div>
          </div>
        )}

        {step === 'verify' && selectedGuild && (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-cyan-300/80">Verify bot</p>
                <h1 className="mt-4 text-3xl font-semibold">Confirm the server setup.</h1>
                <p className="mt-3 text-white/70">
                  Once the bot is in the server, we’ll check access and move you to the dashboard.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
                <div className="flex items-center gap-4">
                  <ServerIcon guild={selectedGuild} />
                  <div>
                    <p className="font-semibold text-white">{selectedGuild.name}</p>
                    <p className="text-sm text-white/60 mt-1">
                      {selectedGuild.botPresent ? 'Bot already present' : 'Bot not installed yet'}
                    </p>
                  </div>
                </div>
              </div>

              {!selectedGuild.botPresent && (
                <a
                  href={`${INVITE_PAGE_URL}?guild_id=${encodeURIComponent(selectedGuild.id)}`}
                  className="block w-full rounded-3xl bg-white/10 py-3 text-center font-semibold text-white transition hover:bg-white/20"
                >
                  Add bot to server
                </a>
              )}

              <button
                onClick={handleVerifyBot}
                disabled={verifying}
                className="w-full rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-500 py-3 text-center font-semibold text-white shadow-lg shadow-cyan-500/10 transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {verifying ? 'Checking...' : 'I have added the bot'}
              </button>

              <button
                onClick={() => setStep('alternatives')}
                className="w-full rounded-3xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10"
              >
                Choose another server
              </button>
            </div>
          </div>
        )}

        {step === 'dashboard' && selectedGuild && (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-cyan-300/80">Finished</p>
                <h1 className="mt-4 text-3xl font-semibold">You’re all set.</h1>
                <p className="mt-3 text-white/70">
                  {selectedGuild.name} is ready. Open the dashboard to manage access, sessions, and island analytics.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
                <div className="space-y-3 text-sm text-white/60">
                  <p>• Configure who can join your sessions</p>
                  <p>• View island analytics and traffic</p>
                  <p>• Manage clients, assets, and access</p>
                </div>
              </div>

              <button
                onClick={handleGoToDashboard}
                className="w-full rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-500 py-3 text-center font-semibold text-white shadow-lg shadow-cyan-500/10 transition hover:opacity-90"
              >
                Open dashboard
              </button>

              <button
                onClick={() => setStep('alternatives')}
                className="w-full rounded-3xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10"
              >
                Set up another server
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
