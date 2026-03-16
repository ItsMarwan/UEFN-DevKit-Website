// Site configuration - customize these values

export const siteConfig = {
  // Bot Information
  bot: {
    name: 'UEFN Helper',
    description: 'The ultimate Discord bot for UEFN management and tracking',
    clientId: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
    serverInviteId: process.env.NEXT_PUBLIC_DISCORD_SERVER_ID,
  },

  // Colors (Must match tailwind.config.ts)
  colors: {
    primary: '#2399df',
    secondary: '#64dcfb',
    dark: '#000000',
    light: '#ffffff',
  },

  // Navigation Links
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Commands', href: '/commands' },
    { label: 'Premium', href: '/premium' },
    { label: 'Tiers', href: '/tiers' },
  ],

  // Footer Links
  footer: {
    product: [
      { label: 'Commands', href: '/commands' },
      { label: 'Premium', href: '/premium' },
      { label: 'Pricing Tiers', href: '/tiers' },
    ],
    company: [
      { label: 'Contact', href: 'mailto:itsmarwanuefn@gmail.com?subject=UEFN%20Helper%20-%20Inquiry' },
      { label: 'Discord Server', href: 'https://discord.gg/' },
      { label: 'Terms of Service', href: '/tos' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
    social: {
      discord: 'https://discord.gg/',
      email: 'itsmarwanuefn@gmail.com',
    },
  },

  // Contact Information
  contact: {
    email: 'itsmarwanuefn@gmail.com',
    supportEmail: 'itsmarwanuefn@gmail.com',
  },

  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    endpoints: {
      commands: '/api/commands',
      tiers: '/api/tiers',
    },
  },

  // Premium Pricing
  premium: {
    monthlyPrice: 9.99,
    currency: 'EUR',
  },

  // Feature Flags
  features: {
    darkMode: true,
    analytics: false,
    contactForm: true,
    premiumSection: true,
  },

  // Meta Tags
  meta: {
    title: 'UEFN Helper Bot - Manage Your Game Server',
    description: 'The ultimate Discord bot for UEFN management and tracking',
    keywords: 'Discord bot, UEFN, game server, management',
    author: 'ItsMarwan',
  },

  // Social Media Links (for future expansion)
  social: {
    twitter: 'https://twitter.com/itsmarwanuefn',
    github: 'https://github.com/itsmarwan/uefn-helper-website',
    youtube: 'https://youtube.com/@itsmarwan.',
  },
}

// Helper function for Discord invite link
export function getDiscordInviteUrl(clientId: string): string {
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot&permissions=8`
}

// Helper function for Discord server join
export function getDiscordServerUrl(serverId: string): string {
  return `https://discord.gg/${serverId}`
}

export default siteConfig
