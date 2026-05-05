'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLegal } from '@/components/LegalProvider';
import teamConfig from '@/lib/team.json';

// Animated Stats Display Component
function StatsDisplay() {
  const userCount = Number(process.env.NEXT_PUBLIC_USER_COUNT) || 10000;
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1800;
    const intervalMs = 20;
    const totalSteps = Math.ceil(duration / intervalMs);
    let currentStep = 0;

    const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

    const intervalId = window.setInterval(() => {
      currentStep += 1;
      const progress = Math.min(currentStep / totalSteps, 1);
      const currentValue = Math.round(userCount * easeOutQuad(progress));
      setCount(currentValue);

      if (progress >= 1) {
        window.clearInterval(intervalId);
      }
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [userCount]);

  return (
    <div className="text-center py-8">
      <p className="text-lg text-white/80 mb-2">Trusted by</p>
      <p className="text-4xl md:text-6xl font-bold mb-2">
        <span className="text-white">+</span>
        <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          {count.toLocaleString()}
        </span>
      </p>
      <p className="text-lg text-white/80">users worldwide</p>
    </div>
  );
}

// Team Member Component
function TeamMember({ member }: { member: any }) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/discord-user/${member.id}`);
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [member.id]);

  if (loading) {
    return (
      <div className="text-center animate-pulse">
        <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-4"></div>
        <div className="h-4 bg-white/10 rounded mb-2 w-32 mx-auto"></div>
        <div className="h-3 bg-white/10 rounded w-28 mx-auto"></div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="text-center">
      <div className="relative mb-4">
        <Image
          src={userData.avatar || '/images/default-avatar.png'}
          alt={userData.display_name}
          width={96}
          height={96}
          className="rounded-full mx-auto border-2 border-white/20"
        />
        <div
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1"
          style={{ backgroundColor: member.color }}
        >
          <Image
            src={`/svg/${member.icon}`}
            alt={member.role}
            width={12}
            height={12}
          />
          {member.role}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{userData.display_name}</h3>
      <p className="text-sm text-white/50">@{userData.username}</p>
    </div>
  );
}

// Meet the Team Section
function MeetTheTeam() {
  const teamCount = teamConfig.length;
  return (
    <section id="team" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Meet the Team
        </h2>
        <div className="flex justify-center">
          <div 
            className="grid gap-8 w-full max-w-6xl"
            style={{
              gridTemplateColumns: `repeat(${Math.min(teamCount, 3)}, minmax(0, 1fr))`,
            }}
          >
            {teamConfig.map((member, idx) => (
              <TeamMember key={idx} member={member} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

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
                UEFN DevKit
                <div className="text-white/40 text-xl md:text-2xl font-normal mt-2">
                  The Dashboard for UEFN Creators
                </div>
              </h1>
              <p className="text-xl text-white/70 mb-8">
                Manage customers, automate sessions, track island analytics, and host assets. all from your Discord server.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/get-started"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105"
                >
                  Get Started for Free
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

      {/* Stats Section */}
      <section className="py-20 bg-black/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
          <StatsDisplay />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Everything You Need to Run Your UEFN Business
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '👥',
                title: 'Client Management',
                description: 'Track customers, manage access, and organize your community without spreadsheets.'
              },
              {
                icon: '🤝',
                title: 'Session Automation',
                description: 'Automatically create and manage private sessions for secure service delivery.'
              },
              {
                icon: '🏝️',
                title: 'Island Tracking',
                description: 'Monitor performance, stats, and growth of your Fortnite islands in real time.'
              },
              {
                icon: '📦',
                title: 'Assets & Verse Scripts',
                description: 'Upload, manage, and share scripts or assets with controlled access.'
              },
              {
                icon: '⚙️',
                title: 'Discord-Native',
                description: 'Everything runs inside Discord. no complex setup, no extra tools.'
              },
              {
                icon: '🔒',
                title: 'Secure & Private',
                description: 'Your data is protected with industry-standard security measures and privacy controls.'
              }
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

      {/* Meet the Team Section */}
      <MeetTheTeam />

      {/* Why UEFN DevKit Section */}
      <section className="py-20 bg-black/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <h2 className="text-4xl font-bold mb-10 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Why Choose UEFN DevKit?
          </h2>

          <div className="grid md:grid-cols-2 gap-6 text-white/80 text-base md:text-lg">

            <div className="p-6 rounded-xl border border-white/10 bg-black/40 hover:border-blue-500/40 transition">
              <h3 className="text-white font-semibold mb-2">🎛️ All-in-One Dashboard</h3>
              <p>
                Manage your UEFN workflow in one place. clients, islands, sessions, and assets without switching tools.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/10 bg-black/40 hover:border-blue-500/40 transition">
              <h3 className="text-white font-semibold mb-2">👥 Client & Session System</h3>
              <p>
                Organize members, handle private sessions, and deliver services in a clean structured flow inside Discord + dashboard.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/10 bg-black/40 hover:border-blue-500/40 transition">
              <h3 className="text-white font-semibold mb-2">📦 Verse & Asset Tools</h3>
              <p>
                Upload and manage Verse scripts, assets, and versions directly from your dashboard for faster development.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/10 bg-black/40 hover:border-blue-500/40 transition">
              <h3 className="text-white font-semibold mb-2">🏝️ Island Analytics</h3>
              <p>
                Track performance, engagement, and activity from your Fortnite islands with real-time insights.
              </p>
            </div>

          </div>

          {/* Bottom line */}
          <div className="mt-10 text-center text-white/60 text-base">
            Whether you're building solo or running a team, UEFN DevKit scales with your workflow.
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
              { name: 'Free', price: 'FREE', description: 'Perfect for small communities', href: '/invite', cta: 'Invite the Bot', features: ['Core Discord command set', 'Customer and member tracking', 'External asset links', 'Community support', 'Basic island analytics'] },
              { name: 'Premium', price: '€9.99', period: '/month', description: 'For growing communities', highlight: true, href: '/premium', cta: 'See Premium Details', features: ['Premium asset hosting uploads (20MB)', 'Island Lookup & Discovery Prediction', 'Patreon integration + role sync', 'Premium API access for customers & reports', 'Priority support'] },
              { name: 'Enterprise', price: 'Custom', description: 'For large-scale operations', href: '/contact?subject=Enterprise+Quote+Request&message=Hello%2C%0AI+need+an+enterprise+quote.%0A%0APlease+provide+pricing+and+next+steps.', cta: 'Contact Sales', features: ['Everything in Premium', 'Custom API access & integrations', 'Higher hosted upload quotas', 'Dedicated support', 'SLA-grade reliability'] },
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
                  <Link
                    href={tier.href}
                    className={`w-full inline-flex justify-center py-3 rounded-lg font-bold transition-all mb-8 ${tier.highlight ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/50' : 'border-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white'}`}
                  >
                    {tier.cta}
                  </Link>
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