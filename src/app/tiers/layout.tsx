import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing Tiers - UEFN Helper Bot',
  description: 'Compare our Free, Premium, and Enterprise tiers. Choose the perfect plan for your needs.',
  openGraph: {
    title: 'Pricing Tiers - UEFN Helper Bot',
    description: 'Compare our Free, Premium, and Enterprise tiers. Choose the perfect plan for your needs.',
    type: 'website',
  },
}

export default function TiersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
