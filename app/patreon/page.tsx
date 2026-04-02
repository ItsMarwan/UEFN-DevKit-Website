'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

interface GuildInfo {
  id: string;
  name: string;
  icon: string | null;
}

interface PatreonSetup {
  setup: boolean;
  roles: Array<{ tier_name: string; role_id: string; role_name?: string }>;
  item_roles: Array<{ item_name: string; role_id: string; role_name?: string }>;
  patreon_page: string;
}

interface SessionUser {
  id: string;
  username: string;
  avatar: string | null;
}

type PageState =
  | 'loading'
  | 'no_server'
  | 'bot_not_in_server'
  | 'patreon_not_setup'
  | 'ready'
  | 'granting'
  | 'success'
  | 'error'
  | 'not_subscribed'
  | 'email_mismatch'
  | 'subscription_inactive'
  | 'no_tiers'
  | 'no_role_mappings'
  | 'role_grant_failed';

function PatreonPageContent() {
  const searchParams = useSearchParams();
  const serverId = searchParams.get('s');

  const [pageState, setPageState] = useState<PageState>('loading');
  const [guild, setGuild] = useState<GuildInfo | null>(null);
  const [patreonSetup, setPatreonSetup] = useState<PatreonSetup | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [grantedRoles, setGrantedRoles] = useState<string[]>([]);
  const [patronName, setPatronName] = useState('');
  const [alreadyAuthenticated, setAlreadyAuthenticated] = useState(false);
  const [patreonStatus, setPatreonStatus] = useState<'not_linked' | 'verifying' | 'verified' | null>(null);
  const [patreonName, setPatreonName] = useState('');
  const [patreonError, setPatreonError] = useState('');
  const [verificationCountdown, setVerificationCountdown] = useState(0);

  const grantRoles = useCallback(async () => {
    if (!serverId) return;
    setPageState('granting');
    try {
      const res = await fetch('/api/patreon/grant-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId: serverId }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Determine error type from the error message
        const errorMsg = data.error || 'Failed to grant roles.';
        if (errorMsg.includes('No active Patreon subscription found')) {
          setErrorMsg('We couldn\'t find an active Patreon subscription linked to your Discord account. Make sure you\'re subscribed to this creator and using the same email address on both Patreon and Discord.');
          setPageState('not_subscribed');
        } else if (errorMsg.includes('does not have a verified email address')) {
          setErrorMsg('Your Discord account needs a verified email address to link with Patreon. Please verify your email in Discord settings and try again.');
          setPageState('email_mismatch');
        } else if (errorMsg.includes('subscription is not currently active')) {
          setErrorMsg('Your Patreon subscription appears to be paused or inactive. Please check your Patreon account and resume your subscription if needed.');
          setPageState('subscription_inactive');
        } else if (errorMsg.includes('does not include any tiers')) {
          setErrorMsg('Your Patreon subscription doesn\'t include any tiers that can be mapped to Discord roles. Please contact the server admin for assistance.');
          setPageState('no_tiers');
        } else if (errorMsg.includes('No Discord roles are configured')) {
          setErrorMsg('The server admin hasn\'t configured Discord roles for your Patreon tier yet. Please ask them to run the Patreon setup commands.');
          setPageState('no_role_mappings');
        } else if (errorMsg.includes('Failed to grant roles') || errorMsg.includes('Could not grant any roles')) {
          setErrorMsg('We couldn\'t assign your roles due to a permission issue. The bot may not have the "Manage Roles" permission, or its role position may be too low. Please contact the server admin.');
          setPageState('role_grant_failed');
        } else {
          setErrorMsg(errorMsg);
          setPageState('error');
        }
        return;
      }
      // Check if user was already authenticated
      if (data.already_authenticated) {
        setGrantedRoles(data.grantedRoles || []);
        setPatronName(data.patronName || '');
        setAlreadyAuthenticated(true);
        // Show the success state but with "already authenticated" message
        setPageState('success');
      } else {
        setGrantedRoles(data.grantedRoles || []);
        setPatronName(data.patronName || '');
        setAlreadyAuthenticated(false);
        setPageState('success');
      }
    } catch {
      setErrorMsg('Connection error. Please try again.');
      setPageState('error');
    }
  }, [serverId]);

  const startPatreonOAuth = useCallback(async () => {
    if (!serverId || !sessionUser) return;
    if (patreonStatus === 'verifying') return; // Prevent duplicate clicks while already in progress

    try {
      setPatreonStatus('verifying');
      setPatreonError('');

      // Call Next.js API route which forwards to Flask
      const response = await fetch(
        `/api/patreon/login?discord_user_id=${sessionUser.id}&guild_id=${serverId}`
      );

      if (!response.ok) {
        const error = await response.json();
        setPatreonError(error.error || 'Failed to start Patreon OAuth');
        setPatreonStatus(null);
        return;
      }

      const data = await response.json();

      if (!data.auth_url) {
        setPatreonError('No auth URL returned');
        setPatreonStatus(null);
        return;
      }

      // Redirect to Patreon OAuth
      window.location.href = data.auth_url;
    } catch (err) {
      setPatreonError(err instanceof Error ? err.message : 'Failed to start Patreon OAuth');
      setPatreonStatus(null);
    }
  }, [serverId, sessionUser]);

  const verifyPatreonMembership = useCallback(async () => {
    if (!serverId || !sessionUser) return;

    try {
      setPatreonStatus('verifying');
      setPatreonError('');

      // Call Next.js API route which forwards to Flask
      const response = await fetch('/api/patreon/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discord_user_id: sessionUser.id,
          guild_id: serverId,
        }),
      });

      const data = await response.json();

      if (data.status === 'verified') {
        setPatreonStatus('verified');
        setPatreonName(data.message || 'Verified');
        // Auto-grant roles after verification
        grantRoles();
      } else {
        setPatreonError(data.error || 'Verification failed');
        setPatreonStatus('not_linked');
      }
    } catch (err) {
      setPatreonError(err instanceof Error ? err.message : 'Verification error');
      setPatreonStatus('not_linked');
    }
  }, [serverId, sessionUser, grantRoles]);

  useEffect(() => {
    if (!serverId) {
      setPageState('no_server');
      return;
    }

    const init = async () => {
      try {
        // 1. Check bot in server
        const botCheck = await fetch(`/api/guilds/${serverId}`);
        if (!botCheck.ok) {
          setPageState('bot_not_in_server');
          return;
        }

        // 2. Fetch guild info + patreon setup
        const infoRes = await fetch(`/api/patreon/guild-info?guildId=${serverId}`);
        if (!infoRes.ok) {
          setPageState('bot_not_in_server');
          return;
        }
        const infoData = await infoRes.json();
        setGuild(infoData.guild);
        setPatreonSetup(infoData.patreonSetup);

        if (!infoData.patreonSetup?.setup) {
          setPageState('patreon_not_setup');
          return;
        }

        setPageState('ready');

        // 3. Check if already logged in (non-blocking)
        fetch('/api/dashboard/session?lightweight=true')
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.user) setSessionUser(data.user);
          })
          .catch(() => {
            // Ignore session fetch errors for initial load
          });
      } catch {
        setErrorMsg('Failed to load page. Please try again.');
        setPageState('error');
      }
    };

    init();
  }, [serverId]);

  // Handle return from Discord OAuth
  useEffect(() => {
    const discordAuth = searchParams.get('discord_auth');
    if (!discordAuth || pageState !== 'ready') return;

    if (discordAuth === 'error') {
      setErrorMsg('Discord authentication failed. Please try again.');
      setPageState('error');
      return;
    }

    if (discordAuth === 'success') {
      // Refresh session then prompt for Patreon auth
      fetch('/api/dashboard/session?lightweight=true')
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (data?.user) {
            setSessionUser(data.user);
            setPatreonStatus('not_linked');
          } else {
            setErrorMsg('Could not load session after login. Please try again.');
            setPageState('error');
          }
        })
        .catch(() => {
          setErrorMsg('Connection error after login. Please try again.');
          setPageState('error');
        });
    }
  }, [pageState, searchParams, grantRoles]);

  // Handle return from Patreon OAuth callback
  useEffect(() => {
    const patreonAuth = searchParams.get('patreon_auth');
    if (!patreonAuth || pageState !== 'ready' || !sessionUser) return;

    if (patreonAuth === 'success') {
      // Start verification immediately
      setPatreonStatus('verifying');
      setVerificationCountdown(0);
    } else if (patreonAuth === 'error') {
      setPatreonError('Patreon authentication failed. Please try again.');
      setPatreonStatus('not_linked');
    }
  }, [pageState, searchParams, sessionUser]);

  function handleAuthenticate() {
    if (sessionUser) {
      // Already logged in with Discord — show Patreon link option
      setPatreonStatus('not_linked');
    } else {
      // Redirect to Discord OAuth
      const returnUrl = encodeURIComponent(`/patreon?s=${serverId}`);
      window.location.href = `/api/patreon/discord-auth?return=${returnUrl}&guildId=${serverId}`;
    }
  }

  function guildIcon(g: GuildInfo) {
    return g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;
  }

  function avatarUrl(u: SessionUser) {
    return u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(u.id) % 5}.png`;
  }

  // ── Error / loading states ─────────────────────────────────────────────────

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full">

          {/* Guild card skeleton */}
          <div className="flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/3 mb-6">
            <div className="w-14 h-14 rounded-xl bg-white/10 animate-pulse flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="h-3 bg-white/10 rounded animate-pulse mb-1 w-20" />
              <div className="h-5 bg-white/10 rounded animate-pulse mb-1 w-32" />
              <div className="h-3 bg-white/10 rounded animate-pulse w-24" />
            </div>
          </div>

          {/* Tier role list skeleton */}
          <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/3">
            <div className="h-3 bg-white/10 rounded animate-pulse mb-3 w-16" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
                    <div className="h-3 bg-white/10 rounded animate-pulse flex-1" />
                  </div>
                  <div className="h-3 bg-white/10 rounded animate-pulse w-16 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Main auth card skeleton */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/3 mb-4">
            <div className="h-6 bg-white/10 rounded animate-pulse mb-2 w-48" />
            <div className="space-y-1.5 mb-5">
              <div className="h-3 bg-white/10 rounded animate-pulse w-full" />
              <div className="h-3 bg-white/10 rounded animate-pulse w-3/4" />
            </div>

            {/* Warning skeleton */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-5">
              <div className="flex gap-2.5">
                <div className="w-4 h-4 rounded bg-white/10 animate-pulse flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-white/10 rounded animate-pulse w-full" />
                  <div className="h-3 bg-white/10 rounded animate-pulse w-5/6" />
                </div>
              </div>
            </div>

            {/* Auth button skeleton */}
            <div className="w-full h-12 bg-white/10 rounded-xl animate-pulse" />
          </div>

          <div className="text-center">
            <div className="h-3 bg-white/10 rounded animate-pulse w-48 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'no_server') {
    return (
      <ErrorState
        icon="🔗"
        title="Missing Server ID"
        desc="No server ID was provided in the link. Please ask your server admin for the correct link."
      />
    );
  }

  if (pageState === 'bot_not_in_server') {
    return (
      <ErrorState
        icon="🤖"
        title="Bot Not Found"
        desc="UEFN DevKit is not in this server. Ask your server admin to invite the bot first."
        action={{ label: 'Invite Bot', href: '/invite' }}
      />
    );
  }

  if (pageState === 'patreon_not_setup') {
    return (
      <ErrorState
        icon="🔌"
        title="Patreon Not Configured"
        desc="This server has not set up Patreon integration yet. Ask your server admin to run /patreon setup in Discord."
        guild={guild}
      />
    );
  }

  if (pageState === 'error') {
    return (
      <ErrorState
        icon="⚠️"
        title="Something Went Wrong"
        desc={errorMsg || 'An unexpected error occurred.'}
        action={{ label: 'Try Again', href: `/patreon?s=${serverId}` }}
        guild={guild}
      />
    );
  }

  if (pageState === 'not_subscribed') {
    return (
      <ErrorState
        icon="💳"
        title="No Patreon Subscription Found"
        desc={errorMsg}
        action={{ label: 'Visit Patreon', href: patreonSetup?.patreon_page || 'https://patreon.com' }}
        guild={guild}
      />
    );
  }

  if (pageState === 'email_mismatch') {
    return (
      <ErrorState
        icon="📧"
        title="Email Verification Needed"
        desc={errorMsg}
        action={{ label: 'Open Discord Settings', href: 'https://discord.com/channels/@me' }}
        guild={guild}
      />
    );
  }

  if (pageState === 'subscription_inactive') {
    return (
      <ErrorState
        icon="⏸️"
        title="Subscription Inactive"
        desc={errorMsg}
        action={{ label: 'Manage Subscription', href: patreonSetup?.patreon_page || 'https://patreon.com' }}
        guild={guild}
      />
    );
  }

  if (pageState === 'no_tiers') {
    return (
      <ErrorState
        icon="🏷️"
        title="No Eligible Tiers"
        desc={errorMsg}
        action={{ label: 'Contact Admin', href: '/contact' }}
        guild={guild}
      />
    );
  }

  if (pageState === 'no_role_mappings') {
    return (
      <ErrorState
        icon="🔧"
        title="Server Setup Incomplete"
        desc={errorMsg}
        action={{ label: 'Contact Admin', href: '/contact' }}
        guild={guild}
      />
    );
  }

  if (pageState === 'role_grant_failed') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="mb-4 p-4 text-left bg-yellow-400/15 border border-yellow-500/30 rounded-xl text-yellow-100">
            <p className="font-semibold">⚠️ Role grant requires bot role &gt; target role + Manage Roles</p>
            <p className="text-sm text-yellow-100/90 mt-1">If the message says "top role too low" or "bot lacks Manage Roles", raise the bot role above the Patreon role and try again.</p>
          </div>
          <ErrorState
            icon="🚫"
            title="Permission Error"
            desc={errorMsg}
            action={{ label: 'Try Again', href: `/patreon?s=${serverId}` }}
            guild={guild}
          />
        </div>
      </div>
    );
  }

  if (pageState === 'granting') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse w-full max-w-md p-6 text-center bg-white/5 rounded-xl border border-white/10">
          <div className="h-4 bg-white/10 rounded w-60 mx-auto mb-4" />
          <div className="h-3 bg-white/10 rounded w-52 mx-auto mb-3" />
          <div className="h-3 bg-white/10 rounded w-40 mx-auto" />
          <p className="text-white/40 text-sm mt-4">Verifying your subscription…</p>
          <p className="text-white/40 text-sm">Checking Patreon data & granting roles</p>
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    const icon = guild ? guildIcon(guild) : null;
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Success icon */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            {alreadyAuthenticated ? 'Already Verified ✓' : 'You\'re all set!'}
          </h1>
          <p className="text-white/60 mb-2">
            {alreadyAuthenticated ? (
              <>
                <span className="text-white">Hey {patronName}! </span>
                You already have the Patreon roles in this server.
              </>
            ) : (
              <>
                {patronName && <span className="text-white">Hey {patronName}! </span>}
                Your Patreon subscription has been verified.
              </>
            )}
          </p>
          {guild && (
            <p className="text-white/60 mb-8">
              {alreadyAuthenticated ? 'Your roles in ' : 'Roles granted in '}
              {icon ? (
                <span className="inline-flex items-center gap-1.5">
                  <Image src={icon} alt={guild.name} width={18} height={18} className="rounded-full" />
                  <span className="text-white font-semibold">{guild.name}</span>
                </span>
              ) : (
                <span className="text-white font-semibold">{guild.name}</span>
              )}
            </p>
          )}

          {/* Granted roles */}
          {grantedRoles.length > 0 && (
            <div className="mb-8 p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-left">
              <p className="text-green-400 text-xs font-semibold uppercase tracking-wide mb-3">
                ✓ {alreadyAuthenticated ? 'Current roles' : 'Roles granted'}
              </p>
              <div className="space-y-2">
                {grantedRoles.map((role, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                    <span className="text-white/80 text-sm font-medium">{role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User info */}
          {sessionUser && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-6 text-left">
              <Image
                src={avatarUrl(sessionUser)}
                alt={sessionUser.username}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{sessionUser.username}</p>
                <p className="text-white/40 text-xs">Authenticated via Discord</p>
              </div>
              <span className="text-green-400 text-sm flex-shrink-0">✓ Verified</span>
            </div>
          )}

          <p className="text-white/30 text-xs">
            {alreadyAuthenticated
              ? 'Your roles should be visible in Discord. Refresh if needed.'
              : 'Roles may take a few seconds to appear in Discord. You may need to refresh your member list.'}
          </p>
        </div>
      </div>
    );
  }

  // ── Ready state (main page) ────────────────────────────────────────────────
  const totalRoles = (patreonSetup?.roles.length ?? 0) + (patreonSetup?.item_roles.length ?? 0);
  const icon = guild ? guildIcon(guild) : null;

  // If Discord user is logged in but hasn't linked Patreon yet
  if (pageState === 'ready' && sessionUser && patreonStatus === 'not_linked') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full">
          {/* Guild card */}
          <div className="flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/3 mb-6">
            {icon ? (
              <Image
                src={icon}
                alt={guild!.name}
                width={56}
                height={56}
                className="w-14 h-14 rounded-xl flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">{guild?.name?.charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white/40 text-xs mb-0.5">Patreon Role Sync</p>
              <h2 className="text-white font-bold text-lg leading-tight truncate">{guild?.name}</h2>
              {totalRoles > 0 && (
                <p className="text-white/40 text-xs mt-0.5">
                  {totalRoles} role mapping{totalRoles !== 1 ? 's' : ''} configured
                </p>
              )}
            </div>
          </div>

          {/* Tier role list */}
          {((patreonSetup?.roles.length ?? 0) > 0 || (patreonSetup?.item_roles.length ?? 0) > 0) && (
            <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/3">
              {(patreonSetup?.roles.length ?? 0) > 0 && (
                <>
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">
                    Tier Roles
                  </p>
                  <div className="space-y-2 mb-4">
                    {patreonSetup!.roles.map((role, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                          <span className="text-white/80 text-sm truncate">{role.tier_name}</span>
                        </div>
                        <span className="text-white/40 text-xs font-mono flex-shrink-0 truncate max-w-[120px]">
                          → {role.role_name || role.role_id}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {(patreonSetup?.item_roles.length ?? 0) > 0 && (
                <>
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">
                    Item Roles
                  </p>
                  <div className="space-y-2">
                    {patreonSetup!.item_roles.map((role, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                          <span className="text-white/80 text-sm truncate">{role.item_name}</span>
                        </div>
                        <span className="text-white/40 text-xs font-mono flex-shrink-0 truncate max-w-[120px]">
                          → {role.role_name || role.role_id}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Patreon linking card */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/3 mb-4">
            <h1 className="text-white font-bold text-xl mb-2">Link Your Patreon Account</h1>
            <p className="text-white/60 text-sm mb-5 leading-relaxed">
              You're logged in as{' '}
              <span className="text-white font-medium">{sessionUser.username}</span>. Now connect your
              Patreon account to verify your subscription and get your roles.
            </p>

            {/* Info box */}
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 mb-5">
              <div className="flex gap-2.5">
                <span className="text-blue-400 flex-shrink-0 mt-0.5">ℹ️</span>
                <div className="text-xs text-blue-200/80 leading-relaxed">
                  <p>
                    <strong className="text-blue-300">We'll verify your Patreon subscription</strong> by
                    checking your account status on Patreon.
                  </p>
                  <p className="mt-1.5">
                    If you have an active subscription for this creator, your roles will be granted
                    automatically.
                  </p>
                </div>
              </div>
            </div>

            {/* Error message */}
            {patreonError && (
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 mb-5">
                <div className="flex gap-2.5">
                  <span className="text-red-400 flex-shrink-0 mt-0.5">❌</span>
                  <p className="text-xs text-red-200/80">{patreonError}</p>
                </div>
              </div>
            )}

            {/* Patreon button */}
            <button
              onClick={startPatreonOAuth}
              disabled={patreonStatus !== 'not_linked'}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-black hover:bg-gray-900 disabled:opacity-50 text-white font-semibold rounded-xl transition-all border border-white/20 hover:border-white/40 active:scale-[0.98]"
            >
              <svg width="20" height="20" viewBox="0 0 640 640" fill="none" className="flex-shrink-0">
                <path fill="white" d="M554 217.8C553.9 152.4 503 98.8 443.3 79.5C369.1 55.5 271.3 59 200.4 92.4C114.6 132.9 87.6 221.7 86.6 310.2C85.8 383 93 574.6 201.2 576C281.5 577 293.5 473.5 330.7 423.7C357.1 388.2 391.2 378.2 433.1 367.8C505.1 350 554.2 293.1 554.1 217.8L554 217.8z"/>
              </svg>
              <span>Connect Patreon Account</span>
            </button>

            {/* Different Discord user hint */}
            <button
              onClick={() => {
                const returnUrl = encodeURIComponent(`/patreon?s=${serverId}`);
                window.location.href = `/api/patreon/discord-auth?return=${returnUrl}&guildId=${serverId}`;
              }}
              className="mt-2 w-full text-xs text-white/30 hover:text-white/60 transition-colors py-1"
            >
              Not {sessionUser.username}? Login with a different account →
            </button>
          </div>

          <p className="text-center text-white/20 text-xs">
            Powered by{' '}
            <a href="/" className="text-white/40 hover:text-white/60 transition-colors">
              UEFN DevKit
            </a>{' '}
            · Your data is used only to verify your subscription
          </p>
        </div>
      </div>
    );
  }

  // Patreon verification state
  if (patreonStatus === 'verifying') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 p-4 text-left bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <p className="text-sm text-blue-100 font-medium">
              Logged in as <span className="text-white font-semibold">{sessionUser?.username}</span>
            </p>
          </div>
          <div className="animate-pulse w-full p-6 bg-white/5 rounded-xl border border-white/10 mb-4">
            <div className="h-4 bg-white/10 rounded w-60 mx-auto mb-4" />
            <div className="h-3 bg-white/10 rounded w-52 mx-auto mb-3" />
            <div className="h-3 bg-white/10 rounded w-40 mx-auto" />
          </div>
          <p className="text-white/40 text-sm font-medium">Verifying your subscription</p>
          {verificationCountdown > 0 && (
            <p className="text-white/60 text-sm mt-3">Checking Patreon in {verificationCountdown}s...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full">

        {/* Guild card */}
        <div className="flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/3 mb-6">
          {icon ? (
            <Image
              src={icon}
              alt={guild!.name}
              width={56}
              height={56}
              className="w-14 h-14 rounded-xl flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">{guild?.name?.charAt(0)}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white/40 text-xs mb-0.5">Patreon Role Sync</p>
            <h2 className="text-white font-bold text-lg leading-tight truncate">{guild?.name}</h2>
            {totalRoles > 0 && (
              <p className="text-white/40 text-xs mt-0.5">
                {totalRoles} role mapping{totalRoles !== 1 ? 's' : ''} configured
              </p>
            )}
          </div>
        </div>

        {/* Tier role list */}
        {((patreonSetup?.roles.length ?? 0) > 0 || (patreonSetup?.item_roles.length ?? 0) > 0) && (
          <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/3">
            {(patreonSetup?.roles.length ?? 0) > 0 && (
              <>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">
                  Tier Roles
                </p>
                <div className="space-y-2 mb-4">
                  {patreonSetup!.roles.map((role, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                        <span className="text-white/80 text-sm truncate">{role.tier_name}</span>
                      </div>
                      <span className="text-white/40 text-xs font-mono flex-shrink-0 truncate max-w-[120px]">
                        → {role.role_name || role.role_id}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {(patreonSetup?.item_roles.length ?? 0) > 0 && (
              <>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">
                  Item Roles
                </p>
                <div className="space-y-2">
                  {patreonSetup!.item_roles.map((role, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                        <span className="text-white/80 text-sm truncate">{role.item_name}</span>
                      </div>
                      <span className="text-white/40 text-xs font-mono flex-shrink-0 truncate max-w-[120px]">
                        → {role.role_name || role.role_id}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Main auth card */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/3 mb-4">
          <h1 className="text-white font-bold text-xl mb-2">Get Your Patreon Role</h1>
          <p className="text-white/60 text-sm mb-5 leading-relaxed">
            Authenticate with Discord to verify your Patreon subscription and automatically receive your
            supporter role(s) in{' '}
            <span className="text-white font-medium">{guild?.name}</span>.
          </p>

          {/* Warning */}
          <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 mb-5">
            <div className="flex gap-2.5">
              <span className="text-yellow-400 flex-shrink-0 mt-0.5">⚠️</span>
              <div className="text-xs text-yellow-200/80 leading-relaxed space-y-1.5">
                <p>
                  <strong className="text-yellow-300">Your Discord email will be checked</strong> against
                  your Patreon subscription.
                </p>
                <p>
                  Make sure you log in with the{' '}
                  <strong className="text-yellow-300">same email</strong> you use on Patreon, or it won't
                  match.
                </p>
              </div>
            </div>
          </div>

          {/* Auth button */}
          <button
            onClick={handleAuthenticate}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-[#5865F2]/30 active:scale-[0.98]"
          >
            {sessionUser ? (
              <>
                <Image
                  src={avatarUrl(sessionUser)}
                  alt={sessionUser.username}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full flex-shrink-0"
                />
                <span>Authenticate as {sessionUser.username}</span>
              </>
            ) : (
              <>
                <DiscordLogo />
                <span>Authenticate with Discord</span>
              </>
            )}
          </button>

          {/* Already logged in — different user hint */}
          {sessionUser && (
            <button
              onClick={() => {
                const returnUrl = encodeURIComponent(`/patreon?s=${serverId}`);
                window.location.href = `/api/patreon/discord-auth?return=${returnUrl}&guildId=${serverId}`;
              }}
              className="mt-2 w-full text-xs text-white/30 hover:text-white/60 transition-colors py-1"
            >
              Not {sessionUser.username}? Login with a different account →
            </button>
          )}
        </div>

        <p className="text-center text-white/20 text-xs">
          Powered by{' '}
          <a href="/" className="text-white/40 hover:text-white/60 transition-colors">
            UEFN DevKit
          </a>{' '}
          · Your data is used only to verify your subscription
        </p>
      </div>
    </div>
  );
}

function DiscordLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 71 55" fill="none" className="flex-shrink-0">
      <path
        d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a.2.2 0 0 0-.2.1c-.6 1.1-1.3 2.6-1.8 3.7a54 54 0 0 0-16.3 0A37 37 0 0 0 25.4.5a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.5 4.9a.2.2 0 0 0-.1.1C1.5 18.1-.9 31 .3 43.7c0 .1.1.1.1.2a58.8 58.8 0 0 0 17.7 9 .2.2 0 0 0 .2-.1 42 42 0 0 0 3.6-5.9.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4l1.1-.9a.2.2 0 0 1 .2 0c11.5 5.3 24 5.3 35.4 0a.2.2 0 0 1 .2 0l1.1.9a.2.2 0 0 1 0 .4 36 36 0 0 1-5.5 2.6.2.2 0 0 0-.1.3 47 47 0 0 0 3.6 5.9.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.7-9 .2.2 0 0 0 .1-.2C72.9 29.3 69.2 16.5 60.2 5a.2.2 0 0 0-.1-.1ZM23.7 36.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 3.9-2.8 7.2-6.4 7.2Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 3.9-2.8 7.2-6.4 7.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ErrorState({
  icon,
  title,
  desc,
  action,
  guild,
}: {
  icon: string;
  title: string;
  desc: string;
  action?: { label: string; href: string };
  guild?: GuildInfo | null;
}) {
  function guildIcon(g: GuildInfo) {
    return g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        {guild && (
          <div className="flex items-center justify-center gap-3 mb-8">
            {guildIcon(guild) ? (
              <Image
                src={guildIcon(guild)!}
                alt={guild.name}
                width={36}
                height={36}
                className="w-9 h-9 rounded-lg"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{guild.name.charAt(0)}</span>
              </div>
            )}
            <span className="text-white/60 text-sm font-medium">{guild.name}</span>
          </div>
        )}
        <div className="text-5xl mb-4">{icon}</div>
        <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
        <p className="text-white/60 mb-8 leading-relaxed whitespace-pre-line">{desc}</p>
        {action && (
          <a
            href={action.href}
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            {action.label}
          </a>
        )}
      </div>
    </div>
  );
}

export default function PatreonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-full max-w-md p-6 animate-pulse bg-white/5 rounded-xl border border-white/10">
            <div className="h-4 bg-white/10 rounded w-40 mb-3" />
            <div className="h-4 bg-white/10 rounded w-56 mb-3" />
            <div className="h-4 bg-white/10 rounded w-32" />
          </div>
        </div>
      }
    >
      <PatreonPageContent />
    </Suspense>
  );
}