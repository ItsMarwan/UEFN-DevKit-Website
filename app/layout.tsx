import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { LegalProvider } from '@/components/LegalProvider';
import './globals.css';

const BASE_URL = 'https://uefnhelper.frii.site';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'UEFN Helper – #1 Discord Bot for Fortnite Island Builders',
    template: '%s | UEFN Helper',
  },
  description:
    'UEFN Helper is the most powerful Discord bot for Fortnite UEFN island builders. Manage customers, sessions, Verse scripts, island analytics, seller profiles, coupons & more. Free tier available.',
  keywords: [
    'UEFN Helper', 'UEFN Discord bot', 'Fortnite island bot', 'UEFN bot',
    'Discord bot for UEFN', 'Fortnite creative Discord bot', 'island analytics bot',
    'UEFN customer management', 'UEFN session system', 'Verse script bot',
    'Fortnite island builder tools', 'UEFN seller profiles', 'Discord coupon system',
    'UEFN moderation bot', 'Fortnite UEFN', 'island tracker Discord', 'UEFN premium bot',
  ],
  authors: [{ name: 'UEFN Helper', url: BASE_URL }],
  creator: 'UEFN Helper',
  publisher: 'UEFN Helper',
  category: 'Technology',
  classification: 'Discord Bot',
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png' }],
    shortcut: '/icon.png',
    apple: '/icon.png',
    other: [{ rel: 'apple-touch-icon-precomposed', url: '/icon.png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'UEFN Helper',
    title: 'UEFN Helper – #1 Discord Bot for Fortnite Island Builders',
    description: 'Customer management, session channels, Verse script uploads, live island analytics, seller directory & more.',
    images: [
      {
        url: `${BASE_URL}/images/banner.png`,
        secureUrl: `${BASE_URL}/images/banner.png`,
        width: 1200,
        height: 630,
        alt: 'UEFN Helper – Discord Bot for Fortnite Island Builders',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@uefnhelper',
    creator: '@uefnhelper',
    title: 'UEFN Helper – #1 Discord Bot for Fortnite Island Builders',
    description: 'Customer management, session channels, Verse scripts, island analytics & more.',
    images: [`${BASE_URL}/images/banner.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: BASE_URL },
  formatDetection: { email: false, telephone: false, address: false },
  referrer: 'origin-when-cross-origin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#2399df" />
        <meta name="color-scheme" content="dark" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="UEFN Helper" />
        <meta name="application-name" content="UEFN Helper" />
        <meta name="msapplication-TileColor" content="#2399df" />
        <meta name="msapplication-TileImage" content="/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="shortcut icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': `${BASE_URL}/#website`,
                  url: BASE_URL,
                  name: 'UEFN Helper',
                  description: 'The most powerful Discord bot for UEFN Fortnite island builders.',
                  publisher: { '@id': `${BASE_URL}/#organization` },
                },
                {
                  '@type': 'Organization',
                  '@id': `${BASE_URL}/#organization`,
                  name: 'UEFN Helper',
                  url: BASE_URL,
                  logo: { '@type': 'ImageObject', url: `${BASE_URL}/images/logo.png`, width: 512, height: 512 },
                  image: { '@type': 'ImageObject', url: `${BASE_URL}/images/banner.png`, width: 1200, height: 630 },
                  sameAs: ['https://discord.gg/uefnhelper'],
                },
                {
                  '@type': 'SoftwareApplication',
                  name: 'UEFN Helper',
                  applicationCategory: 'BusinessApplication',
                  operatingSystem: 'Discord',
                  url: BASE_URL,
                  image: `${BASE_URL}/images/banner.png`,
                  description: 'All-in-one Discord bot for UEFN Fortnite island builders.',
                  offers: [
                    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'EUR' },
                    { '@type': 'Offer', name: 'Premium', price: '9.99', priceCurrency: 'EUR' },
                  ],
                },
              ],
            }),
          }}
        />
      </head>
      <body className="bg-black text-white overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-500">
        <LegalProvider>
          <Navigation />
          <main>{children}</main>
          <Footer />
        </LegalProvider>
      </body>
    </html>
  );
}