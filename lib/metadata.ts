import type { Metadata } from 'next';

const BASE_URL = 'https://uefndevkit.rweb.site';
const DEFAULT_IMAGE = `${BASE_URL}/images/banner.png`;

const baseKeywords = [
  'UEFN DevKit', 'UEFN Discord bot', 'Fortnite island bot', 'UEFN bot',
  'Discord bot for UEFN', 'Fortnite creative Discord bot', 'island analytics bot',
  'UEFN customer management', 'UEFN session system', 'Verse script bot',
  'Fortnite island builder tools', 'UEFN seller profiles', 'Discord bot',
  'UEFN moderation bot', 'Fortnite UEFN', 'island tracker Discord', 'UEFN premium bot',
];

function buildMetadata(
  title: string,
  description: string,
  path: string = '',
  customImage?: string,
  keywords?: string[]
): Metadata {
  const url = path ? `${BASE_URL}${path}` : BASE_URL;
  const image = customImage || DEFAULT_IMAGE;
  const allKeywords = keywords ? [...baseKeywords, ...keywords] : baseKeywords;

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: title,
      template: '%s | UEFN DevKit',
    },
    description,
    keywords: allKeywords,
    authors: [{ name: 'UEFN DevKit', url: BASE_URL }],
    creator: 'UEFN DevKit',
    publisher: 'UEFN DevKit',
    formatDetection: { email: false, telephone: false, address: false },
    referrer: 'origin-when-cross-origin',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      siteName: 'UEFN DevKit',
      title,
      description,
      images: [
        {
          url: image,
          secureUrl: image,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@UEFNDevKit',
      site: '@uefndevkit',
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: url,
    },
  };
}

export function getMetadataForPage(page: keyof typeof pageMetadata): Metadata {
  const p = pageMetadata[page] ?? pageMetadata.home;
  return buildMetadata(p.title, p.description, p.path, undefined, (p as any).keywords);
}

export const pageMetadata = {
  home: {
    title: 'UEFN DevKit – #1 Discord Bot for Fortnite Island Builders',
    description:
      'All-in-one Discord bot for Fortnite island creators. Customer management, session channels, Verse scripts, live analytics, seller directory & more. Free & premium tiers.',
    path: '/',
    keywords: ['Fortnite bot', 'island analytics', 'customer management system'],
  },
  commands: {
    title: 'Commands – UEFN DevKit Discord Bot',
    description: 'Complete list of all UEFN DevKit commands for managing your Fortnite island community, customers, sessions, and analytics.',
    path: '/commands',
    keywords: ['Discord commands', 'bot commands', 'island management commands'],
  },
  dashboard: {
    title: 'Server Dashboard – UEFN DevKit',
    description: 'Powerful server dashboard to manage your UEFN DevKit settings, customers, sessions, and real-time island analytics.',
    path: '/dashboard',
    keywords: ['server dashboard', 'server management', 'analytics dashboard', 'customer dashboard'],
  },
  docs: {
    title: 'Documentation – UEFN DevKit Discord Bot',
    description: 'Complete guides, tutorials, and API documentation for UEFN DevKit integration and setup.',
    path: '/docs',
    keywords: ['documentation', 'guides', 'API docs', 'tutorials', 'setup guide'],
  },
  premium: {
    title: 'Premium – UEFN DevKit',
    description: 'Upgrade to UEFN DevKit Premium for advanced features, higher limits, priority support, and exclusive tools.',
    path: '/premium',
    keywords: ['premium features', 'subscription', 'upgrade', 'advanced features'],
  },
  invite: {
    title: 'Invite UEFN DevKit – Add Bot to Discord',
    description: 'Add UEFN DevKit Discord bot to your server in one click. Manage your Fortnite island community with ease.',
    path: '/invite',
    keywords: ['invite bot', 'add bot', 'Discord invite'],
  },
  contact: {
    title: 'Contact – UEFN DevKit Support',
    description: 'Get in touch with the UEFN DevKit team for support, feedback, or business inquiries.',
    path: '/contact',
    keywords: ['contact', 'support', 'feedback', 'business'],
  },
  tos: {
    title: 'Terms of Service – UEFN DevKit',
    description: 'Read the terms of service and usage policies for UEFN DevKit Discord bot.',
    path: '/tos',
    keywords: ['terms', 'legal', 'terms of service'],
  },
  privacy: {
    title: 'Privacy Policy – UEFN DevKit',
    description: 'Learn how UEFN DevKit handles and protects your data. Our complete privacy policy.',
    path: '/privacy',
    keywords: ['privacy', 'data protection', 'privacy policy'],
  },
  patreon: {
    title: 'Link Discord with Patreon – UEFN DevKit',
    description: 'Authenticate your Discord account with your Patreon membership to automatically receive roles and perks in your Discord servers.',
    path: '/patreon',
    keywords: ['Patreon Discord', 'Patreon integration', 'Discord roles', 'Patreon perks'],
  },
  me: {
    title: 'My Profile – UEFN DevKit',
    description: 'View and manage your UEFN DevKit profile, preferences, and account settings.',
    path: '/me',
    keywords: ['profile', 'account', 'settings', 'user profile'],
  },
  buy: {
    title: 'Buy – UEFN DevKit',
    description: 'Purchase UEFN DevKit premium subscriptions and exclusive features.',
    path: '/buy',
    keywords: ['buy', 'purchase', 'premium subscription'],
  },
};
