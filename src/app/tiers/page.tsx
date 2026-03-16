'use client'

import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'

interface TierData {
  free_max_fortnite_trackers: number
  free_max_customers: number
  free_max_coupons: number
  free_max_verse_scripts: number
  premium_max_fortnite_trackers: number
  premium_max_customers: number
  premium_max_coupons: number
  premium_max_verse_scripts: number
  enterprise_max_fortnite_trackers: number
  enterprise_max_customers: number
  enterprise_max_coupons: number
  enterprise_max_verse_scripts: number
  free_verse_max_size_kb: number
  premium_verse_max_size_kb: number
  enterprise_verse_max_size_kb: number
  [key: string]: any
}

const tierFeatures = [
  { label: 'Fortnite Trackers', free: 'free_max_fortnite_trackers', premium: 'premium_max_fortnite_trackers', enterprise: 'enterprise_max_fortnite_trackers' },
  { label: 'Customers', free: 'free_max_customers', premium: 'premium_max_customers', enterprise: 'enterprise_max_customers' },
  { label: 'Coupons', free: 'free_max_coupons', premium: 'premium_max_coupons', enterprise: 'enterprise_max_coupons' },
  { label: 'Verse Scripts', free: 'free_max_verse_scripts', premium: 'premium_max_verse_scripts', enterprise: 'enterprise_max_verse_scripts' },
  { label: 'Verse Max Size (KB)', free: 'free_verse_max_size_kb', premium: 'premium_verse_max_size_kb', enterprise: 'enterprise_verse_max_size_kb' },
]

export default function Tiers() {
  const [tierData, setTierData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await fetch('/api/tiers')
        const data = await res.json()
        setTierData(data[0])
      } catch (error) {
        console.error('Failed to fetch tiers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTiers()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-[#2399df] border-t-[#64dcfb] rounded-full animate-spin"></div>
      </div>
    )
  }

  const tiers = [
    { name: 'Free', color: 'gray', price: '€0', description: 'Perfect for getting started' },
    { name: 'Premium', color: 'blue', price: '€9.99', description: 'Enhanced features and limits' },
    { name: 'Enterprise', color: 'purple', price: 'Custom', description: 'Unlimited everything' }
  ]

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#2399df] to-[#64dcfb] bg-clip-text text-transparent">
            Pricing Tiers
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Choose the perfect plan for your needs. Scale as you grow.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-8 relative overflow-hidden ${
                tier.name === 'Premium'
                  ? 'ring-2 ring-[#2399df] transform md:scale-105'
                  : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800'
              }`}
            >
              {tier.name === 'Premium' && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-[#2399df] to-[#64dcfb] text-white px-4 py-2 rounded-bl-lg text-sm font-bold">
                  BEST VALUE
                </div>
              )}
              
              <div className={`rounded-2xl p-8 ${tier.name === 'Premium' ? 'bg-white dark:bg-black' : ''}`}>
                <h2 className="text-3xl font-bold mb-2">{tier.name}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{tier.description}</p>
                <div className="mb-8">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.name !== 'Enterprise' && <span className="text-gray-600 dark:text-gray-400">/month</span>}
                </div>
                <button
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    tier.name === 'Premium'
                      ? 'bg-gradient-to-r from-[#2399df] to-[#64dcfb] text-white hover:shadow-lg hover:shadow-[#2399df]/50'
                      : 'bg-gray-200 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {tier.name === 'Enterprise' ? 'Contact Sales' : tier.name === 'Free' ? 'Current Plan' : 'Coming Soon!'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 overflow-x-auto">
          <h2 className="text-2xl font-bold mb-8">Detailed Comparison</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-4 px-4 font-semibold">Feature</th>
                <th className="text-center py-4 px-4 font-semibold">Free</th>
                <th className="text-center py-4 px-4 font-semibold">Premium</th>
                <th className="text-center py-4 px-4 font-semibold">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {tierFeatures.map((feature) => (
                <tr key={feature.label} className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-4 px-4 font-medium">{feature.label}</td>
                  <td className="py-4 px-4 text-center">
                    {tierData?.[feature.free] || '∞'}
                  </td>
                  <td className="py-4 px-4 text-center text-[#2399df] font-semibold">
                    {tierData?.[feature.premium] || '∞'}
                  </td>
                  <td className="py-4 px-4 text-center">
                    ∞
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: 'Can I upgrade my tier anytime?',
                a: 'Yes! You can upgrade or downgrade your tier at any time. Changes take effect immediately.'
              },
              {
                q: 'Is there a free trial?',
                a: 'The free tier includes most core features. Upgrade to premium to unlock advanced capabilities.'
              },
              {
                q: 'Do you offer refunds?',
                a: 'No. we do not offer refunds as of now.'
              },
              {
                q: 'Can I get enterprise pricing?',
                a: 'Yes! Contact our sales team for custom enterprise plans with unlimited features.'
              }
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <h3 className="font-bold mb-2 text-lg">{faq.q}</h3>
                <p className="text-gray-600 dark:text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
