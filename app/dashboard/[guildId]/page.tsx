// app/dashboard/[guildId]/page.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

interface User { id: string; username: string; email: string; avatar: string | null }
interface GuildInfo { id: string; name: string; icon: string | null }
interface Stats { customers: number; coupons: number; verse_scripts: number; members: number; trackers: number }

type TabId = 'overview' | 'customers' | 'coupons' | 'members' | 'verse_scripts' | 'trackers' | 'editor';
type LoadState = 'checking' | 'loading' | 'ready' | 'forbidden' | 'error';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function guildIcon(g: GuildInfo) {
  return g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;
}
function avatarUrl(u: User) {
  return u.avatar
    ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(u.id) % 5}.png`;
}
function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className={`p-5 rounded-xl border ${color} bg-black/40`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white tabular-nums">{fmt(value)}</div>
      <div className="text-white/50 text-xs mt-1">{label}</div>
    </div>
  );
}

function DataTable({ data, loading }: { data: Record<string, unknown>[] | null; loading: boolean }) {
  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data || data.length === 0) return (
    <div className="text-center py-16 text-white/30">No records found</div>
  );

  // Derive columns from first row, skip deeply nested objects
  const cols = Object.keys(data[0]).filter(k => {
    const v = data[0][k];
    return typeof v !== 'object' || v === null;
  });

  const allCols = cols.length > 0 ? cols : Object.keys(data[0]).slice(0, 6);

  function renderCell(val: unknown): string {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'object') return JSON.stringify(val).slice(0, 60) + '…';
    const s = String(val);
    // Format ISO dates
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return new Date(s).toLocaleDateString();
    return s.length > 60 ? s.slice(0, 60) + '…' : s;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            {allCols.map(col => (
              <th key={col} className="px-4 py-3 text-left text-white/50 font-medium text-xs uppercase tracking-wide whitespace-nowrap">
                {col.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              {allCols.map(col => (
                <td key={col} className="px-4 py-3 text-white/80 whitespace-nowrap font-mono text-xs">
                  {renderCell(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomerDetail({ row }: { row: Record<string, unknown> }) {
  const cd = (row.customer_data ?? {}) as Record<string, unknown>;
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
        {String(cd.display_name ?? cd.username ?? '?').charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-white font-medium text-sm">{String(cd.display_name ?? cd.username ?? 'Unknown')}</p>
        <p className="text-white/40 text-xs">@{String(cd.username ?? '—')}</p>
        <p className="text-white/50 text-xs mt-0.5">{String(cd.reason ?? '—')}</p>
      </div>
      <div className="ml-auto text-right flex-shrink-0">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
          {String(row.status ?? 'manual')}
        </span>
        <p className="text-white/30 text-xs mt-1">{String(cd.added_by ?? '—')}</p>
      </div>
    </div>
  );
}

function CouponDetail({ row }: { row: Record<string, unknown> }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
      <div className="font-mono text-sm bg-black/50 px-3 py-1.5 rounded border border-white/10 text-cyan-300 flex-shrink-0">
        {String(row.code ?? row.coupon_code ?? '—')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm truncate">{String(row.description ?? row.name ?? '—')}</p>
        <p className="text-white/40 text-xs">
          Uses: {String(row.uses ?? row.use_count ?? '0')}
          {row.max_uses ? ` / ${row.max_uses}` : ''}
          {row.expires_at ? ` · Expires ${new Date(String(row.expires_at)).toLocaleDateString()}` : ''}
        </p>
      </div>
      <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${row.is_active !== false ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
        {row.is_active !== false ? 'Active' : 'Inactive'}
      </span>
    </div>
  );
}

function EditorSoon() {
  return (
    <div className="relative">
      {/* Blur overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-black/70 backdrop-blur-sm">
        <div className="text-center px-6 max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚡</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold mb-3">
            COMING SOON
          </div>
          <h3 className="text-white font-bold text-xl mb-2">Dashboard Editor</h3>
          <p className="text-white/60 text-sm leading-relaxed mb-5">
            Run bot commands, manage data, and edit server settings directly from the dashboard — no Discord required.
            This is a <span className="text-blue-400 font-semibold">Premium</span> feature.
          </p>
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            ⭐ Upgrade to Premium
          </Link>
          <p className="text-white/30 text-xs mt-3">Unlock early access + all future dashboard features</p>
        </div>
      </div>

      {/* Blurred preview behind */}
      <div className="rounded-xl border border-white/10 bg-black/40 p-5 select-none pointer-events-none" aria-hidden>
        <div className="mb-4 flex gap-2">
          {['Add Customer', 'Create Coupon', 'Upload Script', 'Start Session'].map(label => (
            <div key={label} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/20 text-xs font-medium">{label}</div>
          ))}
        </div>
        <div className="h-10 bg-white/5 border border-white/10 rounded-lg mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-white/5 border border-white/10 rounded-lg" />
          <div className="h-24 bg-white/5 border border-white/10 rounded-lg" />
        </div>
        <div className="mt-3 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GuildDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const guildId = params?.guildId as string;

  const [user, setUser] = useState<User | null>(null);
  const [guild, setGuild] = useState<GuildInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('checking');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Per-tab data
  const [tabData, setTabData] = useState<Record<string, Record<string, unknown>[] | null>>({});
  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({});

  const fetched = useRef(false);

  // Access check + session load
  useEffect(() => {
    if (!guildId || fetched.current) return;
    fetched.current = true;

    const load = async () => {
      try {
        // 1. Check permission before loading anything
        const accessRes = await fetch(`/api/dashboard/verify-access?guildId=${guildId}`);
        if (accessRes.status === 401) { router.replace('/api/dashboard/login'); return; }
        if (!accessRes.ok) {
          const err = await accessRes.json();
          setErrorMsg(err.reason === 'no_permission'
            ? `You don't have Manage Server permission in this server.`
            : err.reason === 'not_in_guild'
              ? `You're not a member of this server.`
              : err.reason === 'bot_not_in_guild'
                ? `Bot is not in this server. Please invite the bot first.`
                : 'Access denied.');
          setLoadState('forbidden');
          return;
        }
        const accessData = await accessRes.json();
        setGuild(accessData.guild);

        setLoadState('loading');

        // 2. Load session for user info
        const sessionRes = await fetch('/api/dashboard/session');
        if (!sessionRes.ok) { router.replace('/api/dashboard/login'); return; }
        const sessionData = await sessionRes.json();
        setUser(sessionData.user);

        // 3. Load stats
        const statsRes = await fetch(`/api/dashboard/stats?guildId=${guildId}`);
        if (statsRes.ok) setStats(await statsRes.json());

        setLoadState('ready');
      } catch {
        setErrorMsg('Failed to load server dashboard.');
        setLoadState('error');
      }
    };
    load();
  }, [guildId, router]);

  // Fetch tab data on tab switch
  const fetchTabData = useCallback(async (tab: TabId) => {
    if (tab === 'overview' || tab === 'editor') return;
    if (tabData[tab] !== undefined) return; // already loaded

    setTabLoading(p => ({ ...p, [tab]: true }));
    try {
      const res = await fetch(`/api/dashboard/data?guildId=${guildId}&endpoint=${tab}`);
      if (res.ok) {
        const json = await res.json();
        const rows = json?.data?.data ?? json?.data ?? [];
        setTabData(p => ({ ...p, [tab]: Array.isArray(rows) ? rows : [] }));
      } else {
        setTabData(p => ({ ...p, [tab]: [] }));
      }
    } catch {
      setTabData(p => ({ ...p, [tab]: [] }));
    } finally {
      setTabLoading(p => ({ ...p, [tab]: false }));
    }
  }, [guildId, tabData]);

  useEffect(() => {
    if (loadState === 'ready') fetchTabData(activeTab);
  }, [activeTab, loadState, fetchTabData]);

  // ── Render states ──────────────────────────────────────────────────────────

  if (loadState === 'checking' || loadState === 'loading') {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">{loadState === 'checking' ? 'Verifying access…' : 'Loading dashboard…'}</p>
        </div>
      </div>
    );
  }

  if (loadState === 'forbidden') {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center pt-16">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/60 mb-6">{errorMsg}</p>
          <Link href="/dashboard" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold text-white">
            Back to Servers
          </Link>
        </div>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center pt-16">
        <div className="text-center">
          <p className="text-red-400 mb-4">{errorMsg}</p>
          <Link href="/dashboard" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold">
            Back to Servers
          </Link>
        </div>
      </div>
    );
  }

  // ── Tabs config ───────────────────────────────────────────────────────────

  const tabs: { id: TabId; label: string; icon: string; soon?: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'coupons', label: 'Coupons', icon: '🎟️' },
    { id: 'members', label: 'Members', icon: '🤝' },
    { id: 'verse_scripts', label: 'Verse Scripts', icon: '📦' },
    { id: 'trackers', label: 'Trackers', icon: '🏝️' },
    { id: 'editor', label: 'Editor', icon: '⚡', soon: true },
  ];

  const icon = guild ? guildIcon(guild) : null;

  // ── Tab content ────────────────────────────────────────────────────────────

  function renderTabContent() {
    if (activeTab === 'editor') return <EditorSoon />;

    if (activeTab === 'overview') {
      return (
        <div className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">Server Stats</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard icon="👥" label="Customers" value={stats?.customers ?? 0} color="border-blue-500/30" />
              <StatCard icon="🎟️" label="Coupons" value={stats?.coupons ?? 0} color="border-cyan-500/30" />
              <StatCard icon="📦" label="Verse Scripts" value={stats?.verse_scripts ?? 0} color="border-purple-500/30" />
              <StatCard icon="🤝" label="Members" value={stats?.members ?? 0} color="border-green-500/30" />
              <StatCard icon="🏝️" label="Trackers" value={stats?.trackers ?? 0} color="border-orange-500/30" />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: 'View Customers', tab: 'customers' as TabId, icon: '👥', desc: `${fmt(stats?.customers)} total records` },
                { label: 'View Coupons', tab: 'coupons' as TabId, icon: '🎟️', desc: `${fmt(stats?.coupons)} codes` },
                { label: 'Verse Scripts', tab: 'verse_scripts' as TabId, icon: '📦', desc: `${fmt(stats?.verse_scripts)} uploads` },
              ].map(a => (
                <button
                  key={a.tab}
                  onClick={() => setActiveTab(a.tab)}
                  className="p-4 rounded-xl border border-white/10 bg-black/40 hover:border-blue-500/50 transition-all text-left group"
                >
                  <div className="text-xl mb-2">{a.icon}</div>
                  <p className="text-white font-semibold text-sm group-hover:text-blue-400 transition-colors">{a.label}</p>
                  <p className="text-white/40 text-xs mt-0.5">{a.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">Bot Commands Reference</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                { cmd: '/customer add', desc: 'Register a new customer' },
                { cmd: '/coupon add', desc: 'Create a coupon code' },
                { cmd: '/verse', desc: 'Upload a Verse script' },
                { cmd: '/start begin', desc: 'Start a service session' },
                { cmd: '/seller create', desc: 'Create your seller profile' },
                { cmd: '/island', desc: 'Look up island stats by code' },
                { cmd: '/stats', desc: 'View server dashboard metrics' },
                { cmd: '/export data', desc: 'Export all server data' },
              ].map(c => (
                <div key={c.cmd} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <code className="text-cyan-400 font-mono text-xs bg-black/40 px-2 py-1 rounded flex-shrink-0">{c.cmd}</code>
                  <span className="text-white/60 text-xs">{c.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-center">
              <Link href="/commands" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                View all {50}+ commands →
              </Link>
            </div>
          </div>
        </div>
      );
    }

    const rows = tabData[activeTab];
    const loading = tabLoading[activeTab] ?? false;

    if (activeTab === 'customers') {
      return (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold">Customers <span className="text-white/30 font-normal text-sm ml-1">{rows ? `(${rows.length})` : ''}</span></h2>
            <button onClick={() => { setTabData(p => { const n = {...p}; delete n.customers; return n; }); fetchTabData('customers'); }}
              className="text-white/40 hover:text-white text-xs transition-colors">↻ Refresh</button>
          </div>
          {loading || !rows ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 text-white/30">No customers yet</div>
          ) : (
            <div className="space-y-2">
              {rows.map((row, i) => <CustomerDetail key={i} row={row} />)}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'coupons') {
      return (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold">Coupons <span className="text-white/30 font-normal text-sm ml-1">{rows ? `(${rows.length})` : ''}</span></h2>
            <button onClick={() => { setTabData(p => { const n = {...p}; delete n.coupons; return n; }); fetchTabData('coupons'); }}
              className="text-white/40 hover:text-white text-xs transition-colors">↻ Refresh</button>
          </div>
          {loading || !rows ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 text-white/30">No coupons yet</div>
          ) : (
            <div className="space-y-2">
              {rows.map((row, i) => <CouponDetail key={i} row={row} />)}
            </div>
          )}
        </div>
      );
    }

    // Generic table for members, verse_scripts, trackers
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold capitalize">{activeTab.replace('_', ' ')} <span className="text-white/30 font-normal text-sm ml-1">{rows ? `(${rows.length})` : ''}</span></h2>
          <button onClick={() => { setTabData(p => { const n = {...p}; delete n[activeTab]; return n; }); fetchTabData(activeTab); }}
            className="text-white/40 hover:text-white text-xs transition-colors">↻ Refresh</button>
        </div>
        <DataTable data={rows ?? null} loading={loading} />
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="bg-black text-white min-h-screen pt-16">
      {/* Header */}
      <section className="py-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="text-white/50 hover:text-blue-400 transition-colors text-sm inline-block mb-4">
            ← Back to Servers
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {icon ? (
                <img src={icon} alt={guild!.name} className="w-12 h-12 rounded-xl" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{guild?.name?.charAt(0)}</span>
                </div>
              )}
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">{guild?.name}</h1>
                <p className="text-white/40 text-xs font-mono mt-0.5">ID: {guildId}</p>
              </div>
            </div>
            {user && (
              <div className="hidden sm:flex items-center gap-3">
                <img src={avatarUrl(user)} alt={user.username} className="w-8 h-8 rounded-full border-2 border-blue-500/50" />
                <div>
                  <p className="text-white text-sm font-medium">{user.username}</p>
                  <p className="text-white/40 text-xs">{user.email}</p>
                </div>
                <a href="/api/dashboard/logout" className="ml-2 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/70 hover:text-white">
                  Logout
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-white/10 sticky top-16 z-40 bg-black/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.soon && (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 leading-none">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderTabContent()}
        </div>
      </section>
    </div>
  );
}