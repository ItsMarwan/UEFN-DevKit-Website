import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Commands - UEFN Helper Bot',
  description: 'Explore all available commands for UEFN Helper bot. Search and filter through our powerful Discord commands.',
  openGraph: {
    title: 'Commands - UEFN Helper Bot',
    description: 'Explore all available commands for UEFN Helper bot.',
    type: 'website',
  },
}

export default function CommandsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
