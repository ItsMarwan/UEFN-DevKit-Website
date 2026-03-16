import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Providers } from '@/components/Providers'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  metadataBase: new URL('https://uefn-helper.vercel.app'),
  title: 'UEFN Helper Bot - Manage Your UEFN Projects',
  description: 'The ultimate Discord bot for managing your UEFN projects. Track progress, manage teams, and automate your workflow with powerful commands.',
  keywords: ['Discord bot', 'UEFN', 'game server management', 'automation', 'Discord commands'],
  authors: [{ name: 'ItsMarwan', url: 'https://github.com/itsmarwan' }],
  creator: 'ItsMarwan',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
    other: [
      {
        rel: 'icon',
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://uefn-helper.vercel.app',
    siteName: 'UEFN Helper Bot',
    title: 'UEFN Helper Bot - Manage Your UEFN Projects',
    description: 'The ultimate Discord bot for managing your UEFN projects. Track progress, manage teams, and automate your workflow.',
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'UEFN Helper Bot Icon',
      },
      {
        url: '/banner.png',
        width: 1920,
        height: 1080,
        alt: 'UEFN Helper Bot Banner',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UEFN Helper Bot - Manage Your UEFN Projects',
    description: 'The ultimate Discord bot for managing your UEFN projects.',
    images: ['/icon.png'],
    creator: '@itsmarwanuefn',
  },
  robots: 'index, follow',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-black text-black dark:text-white transition-colors">
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
