'use client'

import { ArrowRight, Zap, Shield, Infinity } from 'lucide-react'

export default function Premium() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#2399df] to-[#64dcfb] bg-clip-text text-transparent">
            Upgrade to Premium
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Unlock advanced features and increase your limits with a premium subscription.
          </p>
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Free Plan */}
          <div className="p-8 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-bold mb-6">Free Plan</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Great for getting started</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
                <span>3 Fortnite Trackers</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
                <span>1,000 Customers</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
                <span>50 Coupons</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
                <span>100 Verse Scripts</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
                <span>256KB Verse Max Size</span>
              </div>
            </div>

            <button className="w-full py-3 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
              Current Plan
            </button>
          </div>

          {/* Premium Plan */}
          <div className="p-8 rounded-2xl bg-gradient-to-br from-[#2399df] to-[#64dcfb] ring-2 ring-[#2399df] transform">
            <div className="absolute top-4 right-4 bg-white text-[#2399df] px-4 py-2 rounded-full font-bold text-sm">
              RECOMMENDED
            </div>

            <h2 className="text-2xl font-bold mb-2 text-white">Premium Plan</h2>
            <p className="text-white/80 mb-6">Enhanced features & higher limits</p>

            <div className="text-white mb-8">
              <span className="text-4xl font-bold">€9.99</span>
              <span className="text-white/80">/month</span>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#2399df] rounded-full"></div>
                </div>
                <span>10 Fortnite Trackers</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#2399df] rounded-full"></div>
                </div>
                <span>5,000 Customers</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#2399df] rounded-full"></div>
                </div>
                <span>300 Coupons</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#2399df] rounded-full"></div>
                </div>
                <span>250 Verse Scripts</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#2399df] rounded-full"></div>
                </div>
                <span>512KB Verse Max Size</span>
              </div>
              <div className="flex items-center gap-3 text-white font-semibold">
                <Zap size={20} className="text-white" />
                <span>Priority Support</span>
              </div>
            </div>

            <button className="w-full py-3 bg-white text-[#2399df] rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2">
              Coming Soon {/* <ArrowRight size={20} /> */}
            </button>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: Zap,
              title: '5x More Capacity',
              description: 'Increase your limits and handle more data with premium tier.'
            },
            {
              icon: Shield,
              title: 'Priority Support',
              description: 'Get faster response times from our support team.'
            },
            {
              icon: Infinity,
              title: 'Advanced Features',
              description: 'Unlock YouTube tracker and presence commands.'
            }
          ].map((benefit, i) => (
            <div key={i} className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#2399df] to-[#64dcfb] rounded-lg flex items-center justify-center mx-auto mb-4">
                <benefit.icon size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center p-12 rounded-2xl bg-gradient-to-r from-[#2399df] to-[#64dcfb]">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Upgrade?</h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Join premium members and unlock unlimited potential for your server management.
          </p>
          <button className="px-8 py-3 bg-white text-[#2399df] rounded-lg font-bold hover:shadow-lg transition-all">
            Get Premium Access
          </button>
        </div>
      </div>
    </div>
  )
}
