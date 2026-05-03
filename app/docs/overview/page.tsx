'use client';

import Link from 'next/link';
import { commands, getAllCategories } from '@/lib/commands';
import { apiEndpoints } from '@/lib/api';

export default function DocsOverviewPage() {
  const allCommands = Object.values(commands).sort((a, b) => a.name.localeCompare(b.name));
  const categories = getAllCategories();
  const premiumCommands = allCommands.filter((cmd) => cmd.premium);
  const allEndpoints = Object.values(apiEndpoints).sort((a, b) => a.path.localeCompare(b.path));
  const premiumEndpoints = allEndpoints.filter((endpoint) => endpoint.premium);

  return (
    <div className="bg-black text-white min-h-screen">
      <section className="py-12 md:py-16 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              UEFN DevKit Feature Overview
            </h1>
            <p className="text-lg text-white/70 max-w-3xl">
              Everything this bot and dashboard can do, including the premium-only commands, API endpoints, and asset hosting tools.
              Use this reference to understand which features are available immediately and which require a Premium or Enterprise tier.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-white/50 mb-3">Scope</p>
              <p className="text-white/70 leading-relaxed">Discord bot commands, dashboard controls, and API endpoints implemented in this repository.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-white/50 mb-3">Commands</p>
              <p className="text-white/70 leading-relaxed">{allCommands.length} total command definitions, {premiumCommands.length} premium commands.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-white/50 mb-3">API Endpoints</p>
              <p className="text-white/70 leading-relaxed">{allEndpoints.length} documented endpoints, {premiumEndpoints.length} premium-only REST APIs.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-3xl font-bold mb-4">What UEFN DevKit can do</h2>
                <ul className="space-y-3 text-white/70">
                  <li>Manage customers, members, and service records inside Discord.</li>
                  <li>Track Fortnite islands and surface analytics through Island Tools.</li>
                  <li>Publish asset access rules and public asset discovery pages.</li>
                  <li>Upload hosted asset files from the dashboard (Premium/Enterprise only).</li>
                  <li>Sync Patreon membership tiers and roles for premium access.</li>
                  <li>Offer API access for customer and report data, island analysis, and file management.</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-3xl font-bold mb-4">Premium & Enterprise highlights</h2>
                <ul className="space-y-3 text-white/70">
                  <li>Premium servers unlock Island Lookup, Discovery Prediction, and premium API endpoints.</li>
                  <li>Hosted asset uploads are gated by tier: 20MB for Premium, 50MB for Enterprise.</li>
                  <li>Patreon integration and premium role sync are available only to premium servers.</li>
                  <li>Customers, reports, and coupons APIs are restricted to premium/enterprise tiers.</li>
                  <li>Enterprise adds custom API access, increased upload quotas, and priority service support.</li>
                </ul>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-3xl font-bold mb-4">Documentation links</h2>
              <div className="space-y-4">
                <Link href="/docs" className="block rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-4 text-white transition hover:bg-blue-500/15">
                  View command documentation
                </Link>
                <Link href="/docs/api" className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white/70 transition hover:bg-white/10">
                  View API documentation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Discord Commands</h2>
          <div className="space-y-8">
            {categories.map((category) => {
              const commandsByCategory = allCommands.filter((command) => command.category === category);
              return (
                <div key={category} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <h3 className="text-2xl font-semibold text-white">{category}</h3>
                    <span className="text-xs uppercase tracking-[0.3em] text-white/50">{commandsByCategory.length} commands</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {commandsByCategory.map((command) => (
                      <div key={command.name} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div>
                            <p className="font-semibold text-white">/{command.name}</p>
                            <p className="text-sm text-white/50">{command.usage}</p>
                          </div>
                          {command.premium && (
                            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-200 border border-blue-500/30">
                              Premium
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/70">{command.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">API Endpoints</h2>
            <span className="text-sm uppercase tracking-[0.3em] text-white/50">{premiumEndpoints.length} premium endpoints</span>
          </div>
          <div className="grid gap-4">
            {allEndpoints.map((endpoint) => (
              <div key={endpoint.path} className="rounded-3xl border border-white/10 bg-black/40 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">{endpoint.method}</span>
                    <code className="text-sm text-cyan-300">{endpoint.path}</code>
                  </div>
                  {endpoint.premium ? (
                    <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-200 border border-purple-500/30">
                      Premium
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200 border border-red-500/20">
                      Free
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/70 mb-2">{endpoint.description}</p>
                <p className="text-xs text-white/50">Auth required: {endpoint.auth ? 'Yes' : 'No'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
