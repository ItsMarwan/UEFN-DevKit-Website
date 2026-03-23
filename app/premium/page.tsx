'use client';

import Link from 'next/link';

// about the premuim thingy, i made premuim only for server hosting and storage. they cost money to maintain and keep. i wont make a command premuim but limit its useage but
// ill keep it usable by normal ppl. if you have a big ass server then buy premuim. you make bank. trust me i know ;)

export default function PremiumPage() {
  return (
    <div className="bg-black text-white min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-96 h-96 bg-blue-500 rounded-full filter blur-3xl top-10 left-10 animate-float"></div>
          <div className="absolute w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl bottom-10 right-10 animate-pulse-glow"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-slideInLeft">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent animate-fadeIn">
              Unlock Premium Features
            </h1>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Take your community to the next level with advanced features, priority support, and exclusive tools
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 lg:gap-6">
            {/* Free Tier */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-8 hover:border-blue-500/30 transition-all animate-slideInLeft">
              <h2 className="text-3xl font-bold mb-2 text-white">Free</h2>
              <p className="text-white/60 text-sm mb-6">Perfect for small communities</p>
              <div className="mb-8">
                <span className="text-5xl font-bold text-white">€0</span>
                <span className="text-white/60 ml-2">Forever</span>
              </div>

              <button className="w-full py-3 rounded-lg font-bold border-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition-all mb-8">
                Current Plan
              </button>

              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-white">Customer Management</p>
                    <p className="text-xs text-white/50">Up to 1000 customers</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-white">Coupon System</p>
                    <p className="text-xs text-white/50">Basic code validation</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-white">Moderation Tools</p>
                    <p className="text-xs text-white/50">Basic admin commands</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-white">Community Support</p>
                    <p className="text-xs text-white/50">Discord support</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Premium Tier (Highlighted) */}
            <div className="rounded-2xl border-2 border-blue-500 bg-black/50 p-8 scale-105 shadow-2xl shadow-blue-500/20 relative animate-slideInLeft">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="px-4 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-sm rounded-full">
                  Most Popular
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-2 text-blue-400">Premium</h2>
              <p className="text-white/60 text-sm mb-6">For growing communities</p>
              <div className="mb-8">
                <span className="text-5xl font-bold text-white">€9.99</span>
                <span className="text-white/60 ml-2">/month</span>
              </div>

              <button className="w-full py-3 rounded-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/50 transition-all mb-8">
                Upgrade Now
              </button>

              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-3 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-white">5000 customers</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-3 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-white">300 Max stored coupons</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-3 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-white">10 Max fortnite trackers</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-3 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-white">Higher Fortnite map pulling rate</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-3 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-white">512KB Verse File upload limit</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-3 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-white">Priority support</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-3 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-white">All features</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Enterprise Tier */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-8 hover:border-purple-500/30 transition-all animate-slideInLeft">
              <h2 className="text-3xl font-bold mb-2 text-white">Enterprise</h2>
              <p className="text-white/60 text-sm mb-6">For large-scale operations</p>
              <div className="mb-8">
                <span className="text-5xl font-bold text-white">Custom</span>
                <span className="text-white/60 ml-2">pricing</span>
              </div>

              <button className="w-full py-3 rounded-lg font-bold border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white transition-all mb-8">
                Contact Sales
              </button>

              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-3 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-white">Everything Premium</p>
                    <p className="text-xs text-white/50">All features included</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-3 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-white">API Access</p>
                    <p className="text-xs text-white/50">Custom integrations</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-3 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-white">Custom Features</p>
                    <p className="text-xs text-white/50">Tailored solutions</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-3 mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-white">99.9% Uptime SLA</p>
                    <p className="text-xs text-white/50">Guaranteed reliability</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-black border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Why Choose Premium?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: '👥 5000 Customers', desc: 'Manage as many customers as you need without limits' },
              { title: '🎟️ 300 Coupons', desc: 'Create and store up to 300 unique coupon codes' },
              { title: '⚡ Priority Support', desc: 'Get help instantly with our priority support team' },
              { title: '📦 512KB Verse File upload', desc: 'Upload larger Verse files for your maps and assets' },
              { title: '📈 Higher Map Pulling Rate', desc: 'Faster map pulling for Fortnite tracking' },
              { title: '🏝️ 10 Max Fortnite Trackers', desc: 'Track more Fortnite maps simultaneously with higher limits' },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="feature-card p-6 rounded-xl border border-white/10 bg-black/50 hover:border-blue-500/50 transition-all animate-scaleIn"
              >
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Upgrade?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of communities already benefiting from Premium features
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/discord"
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:shadow-2xl transition-all transform hover:scale-105"
            >
              Join Discord
            </a>
            <Link
              href="/commands"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-blue-600 transition-all"
            >
              View All Commands
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'Can I try Premium for free?',
                a: 'Yes! We offer a 30-day free trial when doing giveaways. No credit card required. Experience all Premium features risk-free!',
              },
              {
                q: 'Is there any way i can get premuim for free?',
                a: 'Yes! We often run giveaways on our Discord server where you can win free Premium subscriptions. Join our community for a chance to win and stay updated on the latest news and offers, We also have a section in the site INSERT HYPERLINK HERE where you can make a post/video about uefn helper to earn free premuim.',
              },
              {
                q: 'What happens if I downgrade?',
                a: 'You can downgrade at any time. Your plan changes take effect at the next billing cycle.',
              },
              {
                q: 'Do you offer annual billing discounts?',
                a: 'Yes! Subscribe for a full year and get 30% off (€83.916/year instead of €119.88/year).',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, PayPal through our payment processor (soon to be patreon).',
              },
              {
                q: 'How do I contact support?',
                a: 'Premium members get priority support via ticket from our Discord server. while free users can get help in our community channels. We also have a docs section with guides about how to use the bot and its features. If you have any questions or need assistance, feel free to reach out to our support team!',
              },
            ].map((faq, idx) => (
              <details
                key={idx}
                className="group border border-white/10 rounded-lg p-6 cursor-pointer hover:border-blue-500/30 transition-colors"
              >
                <summary className="font-bold text-white group-open:text-blue-400 flex justify-between items-center text-lg">
                  {faq.q}
                  <span className="text-2xl transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="text-white/70 mt-4">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
