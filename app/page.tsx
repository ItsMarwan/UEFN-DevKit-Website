'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLegal } from '@/components/LegalProvider';

// Separated into its own component because useSearchParams requires Suspense
function LegalParamHandler() {
  const searchParams = useSearchParams();
  const { openLegal } = useLegal();

  useEffect(() => {
    const legal = searchParams.get('legal');
    if (legal === 'tos' || legal === 'privacy') {
      // Small delay so the page renders before the modal opens
      const t = setTimeout(() => openLegal(legal), 50);
      return () => clearTimeout(t);
    }
  }, [searchParams, openLegal]);

  return null;
}

export default function Home() {
  return (
    <div className="bg-black text-white min-h-screen">
      {/* Reads ?legal=tos or ?legal=privacy and opens the modal */}
      <Suspense fallback={null}>
        <LegalParamHandler />
      </Suspense>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-96 h-96 bg-blue-500 rounded-full filter blur-3xl top-10 left-10 animate-float"></div>
          <div className="absolute w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl bottom-10 right-10 animate-pulse-glow"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left – copy */}
            <div className="animate-slideInLeft">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent animate-fadeIn">
                UEFN Discord Bot for Island Builders
              </h1>
              <p className="text-xl text-white/70 mb-8">
                Streamline your Fortnite island development with powerful tools for customer management, session handling, island analytics, and more. All within Discord.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/invite"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105"
                >
                  Invite Bot to Discord
                </a>
                <Link
                  href="/commands"
                  className="inline-block px-8 py-4 border-2 border-blue-500 text-blue-400 font-bold rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                >
                  View All Commands
                </Link>
              </div>
            </div>

            {/* Right – logo */}
            <div className="hidden md:flex justify-center items-center animate-slideInRight relative">
              <div className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 opacity-30 blur-3xl animate-pulse-glow" />
              <div className="relative z-10 animate-float">
                <Image
                  src="/images/logo.png"
                  alt="UEFN DevKit Bot Logo"
                  width={300}
                  height={300}
                  className="rounded-2xl"
                  style={{ mixBlendMode: 'screen' }}
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
              { icon: '👥', title: 'Customer Management', description: 'Track customers, manage roles, and bulk import members with ease.' },
              { icon: '📦', title: 'Development Tools', description: 'Verse script uploads and management for island developers.' },
              { icon: '🏝️', title: 'Island Analytics', description: 'Live Fortnite island stats, tracking, and performance monitoring.' },
              { icon: '🤝', title: 'Session System', description: 'Automated session channels for secure service delivery.' },
              { icon: '🏪', title: 'Seller Profiles', description: 'Public directory, ratings, and professional seller management.' },
              { icon: '🎮', title: 'Fortnite Integration', description: 'Tracker support, map code validation, and UEFN utilities.' },
            ].map((feature, idx) => (
              <div key={idx} className="feature-card p-8 rounded-xl border border-white/10 bg-black/50 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 animate-scaleIn">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why UEFN DevKit Section */}
      <section className="py-20 bg-black/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Why Choose UEFN DevKit?
          </h2>
          <div className="space-y-6 text-white/80 text-lg leading-relaxed">
            <p>
              UEFN DevKit is the ultimate solution for Fortnite island builders and community managers. Whether you&apos;re running a small creative community or managing a large-scale operation, UEFN DevKit provides the tools you need to streamline workflow, engage customers, and scale your services efficiently. Our Discord bot integrates seamlessly into your existing Discord server, enabling powerful automation without complex setup.
            </p>
            <p>
              The customer management system allows you to organize and track community members with ease. Bulk import features, role management, and customer profiles keep your community organized and accessible. The session system creates dedicated channels for service delivery, ensuring privacy and professionalism when working with clients.
            </p>
            <p>
              For creative developers, UEFN DevKit offers Verse script uploads and version tracking directly in Discord. Island analytics provide real-time insights into your Fortnite creation's performance and player engagement metrics.
            </p>
            <p>
              The seller profile directory helps service providers build credibility and reputation within the Fortnite creative community. Track your professional reputation and manage your services efficiently.
            </p>
            <p>
              Available in both free and premium tiers, UEFN DevKit scales with your needs. Start free with core features, or upgrade to premium for advanced capabilities including higher file upload limits, additional tracker slots, and priority support.
            </p>
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
              { name: 'Free', price: 'FREE', description: 'Perfect for small communities', features: ['99% of total commands', '256KB Verse File upload limit', '1 Max fortnite tracker', 'Community support', '1000 customers max'] },
              { name: 'Premium', price: '€9.99', period: '/month', description: 'For growing communities', highlight: true, features: ['5000 customers', '10 Max fortnite trackers', 'Higher Fortnite map pulling rate', '512KB Verse File upload limit', 'Priority support', 'All features'] },
              { name: 'Enterprise', price: 'Custom', description: 'For large-scale operations', features: ['Unlimited everything', '30 Max fortnite trackers', 'Highest Fortnite map pulling rate', 'Dedicated support', 'Custom integrations', 'API access', 'SLA guarantee'] },
            ].map((tier, idx) => (
              <div key={idx} className={`rounded-xl transition-all feature-card ${tier.highlight ? 'border-2 border-blue-500 scale-105 shadow-xl shadow-blue-500/20 bg-black/50' : 'border border-white/10 bg-black/30'}`}>
                <div className="p-8">
                  {tier.highlight && <div className="mb-4 inline-block px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold rounded">Most Popular</div>}
                  <h3 className="text-2xl font-bold mb-2 text-white">{tier.name}</h3>
                  <p className="text-white/60 text-sm mb-6">{tier.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">{tier.price}</span>
                    {tier.period && <span className="text-white/60 ml-2">{tier.period}</span>}
                  </div>
                  <button className={`w-full py-3 rounded-lg font-bold transition-all mb-8 ${tier.highlight ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/50' : 'border-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white'}`}>
                    Get Started
                  </button>
                  <ul className="space-y-3">
                    {tier.features.map((f, fi) => (
                      <li key={fi} className="flex items-center text-white/70">
                        <span className="w-5 h-5 mr-3 text-blue-500">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-12 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Perfect For
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-2xl font-semibold mb-3 text-white">Community Managers</h3>
              <p className="text-white/70">Organize members, track engagement, manage services, and build community reputation through seller profiles and ratings.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-2xl font-semibold mb-3 text-white">Creative Developers</h3>
              <p className="text-white/70">Upload Verse scripts, track island analytics, and collaborate with team members directly in Discord.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-2xl font-semibold mb-3 text-white">Service Providers</h3>
              <p className="text-white/70">Manage client sessions, maintain professional seller profiles, and automate service delivery securely.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-2xl font-semibold mb-3 text-white">Island Analytics</h3>
              <p className="text-white/70">Monitor Fortnite island performance metrics, player engagement, and live statistics to optimize your creations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of communities already using UEFN DevKit</p>
          <a href="/discord" className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:shadow-2xl transition-all transform hover:scale-105">
            Join Discord Now
          </a>
        </div>
      </section>
    </div>
  );
}