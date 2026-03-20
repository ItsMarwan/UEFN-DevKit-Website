import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://uefnhelper.com'),
  title: {
    default: 'UEFN Helper - Professional Discord Bot for Island Builders',
    template: '%s | UEFN Helper',
  },
  description: 'The most powerful Discord bot for UEFN island builders with customer management, session system, development tools, analytics, and seller profiles. Premium tier available.',
  keywords: [
    'Discord bot',
    'UEFN',
    'Island builder',
    'Fortnite',
    'Customer management',
    'Discord moderation',
    'Session system',
    'Seller directory',
    'Development tools',
    'Island analytics',
    'Premium Discord bot',
  ],
  authors: [{ name: 'UEFN Helper', url: 'https://uefnhelper.com' }],
  creator: 'UEFN Helper',
  publisher: 'UEFN Helper',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/icon.png',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://uefnhelper.com',
    siteName: 'UEFN Helper',
    title: 'UEFN Helper - Professional Discord Bot for Island Builders',
    description: 'Advanced Discord bot for UEFN communities with customer management, development tools, analytics, and seller profiles. Start your free tier today.',
    images: [
      {
        url: '/banner.png',
        width: 1200,
        height: 630,
        alt: 'UEFN Helper - Discord Bot for Island Builders',
        type: 'image/png',
      },
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'UEFN Helper Logo',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UEFN Helper - Professional Discord Bot',
    description: 'Powerful Discord bot for UEFN island builders with customer management, sessions, development tools, and seller profiles.',
    images: ['/banner.png'],
    creator: '@uefnhelper',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://uefnhelper.com',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#2399df" />
        <meta name="color-scheme" content="dark" />
        <meta name="description" content="The most powerful Discord bot for UEFN island builders with customer management, session system, development tools, analytics, and seller profiles." />
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta property="og:color" content="#2399df" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'UEFN Helper',
              description: 'Professional Discord bot for UEFN island builders',
              url: 'https://uefnhelper.com',
              applicationCategory: 'BusinessApplication',
              offers: {
                '@type': 'Offer',
                priceCurrency: 'EUR',
                price: '0',
                pricingModel: 'Freemium',
              },
              image: '/banner.png',
            }),
          }}
        />
      </head>
      <body className="bg-black text-white overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-500">
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
