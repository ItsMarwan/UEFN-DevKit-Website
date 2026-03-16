'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Command, Shield, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-black dark:via-slate-950 dark:to-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#2399df] to-[#64dcfb] bg-clip-text text-transparent">
              UEFN Helper Bot
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              The ultimate Discord bot for managing your UEFN projects. Track progress, manage teams, and automate your workflow with powerful commands.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a
                href="/invite"
                className="px-8 py-3 bg-gradient-to-r from-[#2399df] to-[#64dcfb] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#2399df]/50 transition-all flex items-center gap-2"
              >
                Add to Discord <ArrowRight size={20} />
              </a>
              <Link
                href="/commands"
                className="px-8 py-3 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                View Commands
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative w-full max-w-md h-96 bg-gradient-to-br from-[#2399df] to-[#64dcfb] rounded-2xl p-1 shadow-2xl">
              <div className="w-full h-full bg-white dark:bg-black rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src="/icon.png"
                      alt="UEFN Helper Bot"
                      width={96}
                      height={96}
                      priority
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-2xl font-bold mb-2">UEFN Helper</p>
                  <p className="text-gray-600 dark:text-gray-400">Your Discord management bot</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-16 text-center">Powerful Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Command,
                title: 'Advanced Commands',
                description: 'Powerful commands to manage your UEFN projects and track progress efficiently.'
              },
              {
                icon: Shield,
                title: 'Secure & Reliable',
                description: 'Your data is encrypted and stored securely in cloud servers with enterprise-grade protection.'
              },
              {
                icon: Zap,
                title: 'Fast Performance',
                description: 'Lightning-fast response times with optimized database queries and caching.'
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[#2399df] dark:hover:border-[#64dcfb] transition-colors group"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-[#2399df] to-[#64dcfb] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#2399df] to-[#64dcfb]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Level Up?</h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of servers using UEFN Helper to streamline their workflow.
          </p>
          <a
            href="/invite"
            className="inline-block px-8 py-4 bg-white text-[#2399df] rounded-lg font-bold text-lg hover:shadow-lg transition-all"
          >
            Invite Now
          </a>
        </div>
      </section>
    </div>
  )
}
