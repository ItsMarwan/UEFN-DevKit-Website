'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="bg-black text-white min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-96 h-96 bg-blue-500 rounded-full filter blur-3xl top-10 left-10 animate-float"></div>
          <div className="absolute w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl bottom-10 right-10 animate-pulse-glow"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-slideInLeft">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent animate-fadeIn">
                Take Your Server to the Next Level
              </h1>
              <p className="text-xl text-white/70 mb-8">
                Experience the most powerful Discord bot for UEFN island builders with advanced moderation, customer management, and development tools.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="https://discord.gg/uefnhelper"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105"
                >
                  Join Discord
                </a>
                <Link
                  href="/commands"
                  className="inline-block px-8 py-4 border-2 border-blue-500 text-blue-400 font-bold rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                >
                  View Commands
                </Link>
              </div>
            </div>

            <div className="hidden md:flex justify-center items-center animate-slideInRight relative">
              <div className="absolute w-96 h-96 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 opacity-20 blur-3xl animate-pulse-glow"></div>
              <div className="relative z-10 animate-float">
                <Image
                  src="/logo.png"
                  alt="UEFN Helper Bot Logo"
                  width={280}
                  height={280}
                  className="rounded-2xl shadow-2xl shadow-blue-500/50"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Packed with Powerful Features
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '👥',
                title: 'Customer Management',
                description: 'Track customers, manage roles, and bulk import members with ease.',
              },
              {
                icon: '🎟️',
                title: 'Coupon System',
                description: 'Create, manage, and track coupon codes with expiry and usage limits.',
              },
              {
                icon: '📦',
                title: 'Development Tools',
                description: 'Build logs, task management, and Verse script uploads for island devs.',
              },
              {
                icon: '🏝️',
                title: 'Island Analytics',
                description: 'Live Fortnite island stats, tracking, and performance monitoring.',
              },
              {
                icon: '🤝',
                title: 'Session System',
                description: 'Automated session channels for secure service delivery.',
              },
              {
                icon: '🏪',
                title: 'Seller Profiles',
                description: 'Public directory, ratings, and professional seller management.',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="feature-card p-8 rounded-xl border border-white/10 bg-black/50 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 animate-scaleIn"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-white">
                  {feature.title}
                </h3>
                <p className="text-white/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-white/60 mb-16 text-lg">
            Choose the plan that fits your community
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Free',
                price: '€0',
                description: 'Perfect for small communities',
                features: [
                  'Basic customer management',
                  'Coupon system',
                  'Basic commands',
                  'Community support',
                  '10 customers max',
                ],
              },
              {
                name: 'Premium',
                price: '€9.99',
                period: '/month',
                description: 'For growing communities',
                highlight: true,
                features: [
                  'Unlimited customers',
                  'Advanced analytics',
                  'Session system',
                  'Verse script uploads',
                  'Priority support',
                  'All Free features',
                ],
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                description: 'For large-scale operations',
                features: [
                  'Unlimited everything',
                  'Dedicated support',
                  'Custom integrations',
                  'API access',
                  'SLA guarantee',
                ],
              },
            ].map((tier, idx) => (
              <div
                key={idx}
                className={`rounded-xl transition-all feature-card ${
                  tier.highlight
                    ? 'border-2 border-blue-500 scale-105 shadow-xl shadow-blue-500/20 bg-black/50'
                    : 'border border-white/10 bg-black/30'
                }`}
              >
                <div className="p-8">
                  {tier.highlight && (
                    <div className="mb-4 inline-block px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold rounded">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2 text-white">
                    {tier.name}
                  </h3>
                  <p className="text-white/60 text-sm mb-6">
                    {tier.description}
                  </p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className="text-white/60 ml-2">
                        {tier.period}
                      </span>
                    )}
                  </div>
                  <button
                    className={`w-full py-3 rounded-lg font-bold transition-all mb-8 ${
                      tier.highlight
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/50'
                        : 'border-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    Get Started
                  </button>
                  <ul className="space-y-3">
                    {tier.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-center text-white/70">
                        <span className="w-5 h-5 mr-3 text-blue-500">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of communities already using UEFN Helper
          </p>
          <a
            href="https://discord.gg/uefnhelper"
            className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Join Discord Now
          </a>
        </div>
      </section>
    </div>
  );
}
