import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Premium - UEFN Helper Bot',
  description: 'Unlock advanced features and increase your limits with a premium subscription.',
  openGraph: {
    title: 'Premium - UEFN Helper Bot',
    description: 'Unlock advanced features and increase your limits with a premium subscription.',
    type: 'website',
  },
}

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
