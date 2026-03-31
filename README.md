<div align="center">

<img src="public/images/banner.png" alt="UEFN DevKit Banner" width="100%" />

# UEFN DevKit — Website

**The official open-source website for the UEFN DevKit Discord Bot.**  
Built with Next.js 16, TypeScript, and Tailwind CSS.

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)
[![License: VCL](https://img.shields.io/badge/License-VCL-yellow?style=for-the-badge)](LICENSE)

<br />

[**🌐 Live Site**](https://uefndevkit.rweb.site) · [**🤖 Bot Invite**](https://discord.com/api/oauth2/authorize?client_id=123456789012345678&permissions=8&scope=bot%20applications.commands) · [**💬 Discord**](https://discord.gg/wfPfEw6b6w) · [**🐛 Report Bug**](https://github.com/ItsMarwan/UEFN-DevKit-Website/issues) · [**✨ Request Feature**](https://github.com/ItsMarwan/UEFN-DevKit-Website/issues)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Project Structure](#-project-structure)
- [Pages](#-pages)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🧩 About

This is the open-source frontend for **UEFN DevKit** — a Discord bot built for Fortnite UEFN (Unreal Editor for Fortnite) island builders. The website documents every bot command, explains pricing tiers, and provides a contact form for support.

The site is fully static-generation-ready, mobile responsive, and dark-mode only. It was designed to be easy to fork, customize, and self-host.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📚 **Command Docs** | Full documentation for 50+ bot commands, organized by category |
| 🔍 **Category Filter** | Filter commands by category on the `/commands` page |
| 💰 **Pricing Page** | Three-tier comparison (Free, Premium, Enterprise) with FAQ |
| 📬 **Contact Form** | hCaptcha-protected form that sends emails via Resend |
| 🔒 **Legal Modals** | Privacy policy and Terms of Service open as popups (also accessible via `/privacy` and `/tos`) |
| 🗺️ **Sitemap + Robots** | Auto-generated sitemap and robots.txt |
| 📊 **Open Graph** | Full OG + Twitter Card metadata with banner image |
| 📡 **REST API** | Enterprise and Premium REST API endpoints for server data access |
| ⚡ **Performance** | Static generation, minimal JS, fast page loads |
| 📱 **Responsive** | Mobile-first, works on all screen sizes |

---

## 🛠️ Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org/) (App Router)
- **Language** — [TypeScript 5](https://www.typescriptlang.org/)
- **Styling** — [Tailwind CSS 3](https://tailwindcss.com/)
- **Email** — [Resend](https://resend.com/)
- **Captcha** — [hCaptcha](https://www.hcaptcha.com/)
- **Deployment** — [Vercel](https://vercel.com/)

---

## 🌐 Live Site

The UEFN DevKit website is live at **[uefndevkit.rweb.site](https://uefndevkit.rweb.site)**

Features:
- Full command documentation with searchable categories
- Pricing and feature comparison
- Contact form with hCaptcha protection
- Open source and self-hostable

---

## 📁 Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout — Navigation, Footer, LegalProvider
│   ├── page.tsx                # Home / landing page
│   ├── globals.css             # Global styles + animations
│   ├── commands/
│   │   └── page.tsx            # Commands listing with category filter
│   ├── docs/
│   │   ├── page.tsx            # Docs index (expandable categories)
│   │   └── [command]/
│   │       └── page.tsx        # Individual command documentation page
│   ├── invite/
│   │   └── page.tsx            # invite redirect page
│   ├── premium/
│   │   └── page.tsx            # Pricing / premium features page
│   ├── contact/
│   │   └── page.tsx            # Contact form with hCaptcha
│   ├── privacy/
│   │   └── page.tsx            # Redirects to /?legal=privacy (opens modal)
│   ├── tos/
│   │   └── page.tsx            # Redirects to /?legal=tos (opens modal)
│   ├── api/
│   │   └── contact/
│   │       └── route.ts        # Contact form API — hCaptcha verify + Resend
│   ├── sitemap.ts              # Auto-generated sitemap
│   └── robots.ts               # robots.txt
│
├── components/
│   ├── Navigation.tsx          # Top nav with mobile hamburger menu
│   ├── Footer.tsx              # Footer with legal modal triggers
│   ├── CommandCard.tsx         # Command display card
│   ├── LegalModal.tsx          # Privacy Policy + ToS modal content
│   └── LegalProvider.tsx       # Context provider for opening legal modals
│
├── lib/
│   └── commands.ts             # All 50+ command definitions + helper functions
│
├── public/
│   ├── icon.png                # Bot icon / favicon
│   └── images/
│       ├── banner.png          # OG banner (1200×630)
│       └── logo.png            # Bot logo used in hero section
│
├── .env.example          # Environment variable template
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── postcss.config.js
```

---

## 📄 Pages

| Route | Description |
|---|---|
| `/` | Landing page — hero, features, pricing overview, CTA |
| `/commands` | All commands in a filterable grid |
| `/docs` | Docs index — expandable category sections |
| `/docs/[command]` | Full doc page for a single command |
| `/api/docs` | REST API documentation and endpoint reference |
| `/premium` | Pricing tiers + feature comparison + FAQ |
| `/contact` | hCaptcha-protected contact form |
| `/privacy` | Redirects home and opens Privacy Policy modal |
| `/tos` | Redirects home and opens Terms of Service modal |
| `/invite` | Redirects to the invite link of the bot |

---

## 📡 API Endpoints

The website provides comprehensive REST API documentation at `/api/docs`. Available endpoints include:

### Enterprise Tier
- **Files** — List, read, and write server files
- **Reports** — Create and manage user reports
- **Verse Scripts** — Access and manage Verse script uploads
- **Members** — Query server members and roles
- **Trackers** — Manage social media trackers
- **Subscriptions** — Retrieve subscription data

### Premium Tier
- **Island Lookup** — Get detailed stats for Fortnite Creative islands
- **Island Prediction** — AI-powered discovery analysis and recommendations

### Authentication
All API endpoints require:
- `Authorization: Bearer {token}` — HMAC-SHA256 signed token
- `X-Discord-Server-ID: {server_id}` — Target Discord server ID
- `Origin` — Request origin for domain validation

Rate limits: **10 requests/sec** | Monthly quota: **5,000 requests** (Enterprise), **10,000 requests** (Premium)

---

## 🤝 Contributing

This is an open-source project! We welcome contributions. Whether it's fixing bugs, adding features, or improving documentation.

### Self-Hosting

To run this project locally or self-host it:

1. **Prerequisites:** Node.js `>=18.17.0` and npm `>=9`
2. **Clone:** Fork and clone the repository
3. **Install:** `npm install`
4. **Configure:** Set up your environment variables (see [.env.example](.env.example)):
   - `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` — hCaptcha public key
   - `HCAPTCHA_SECRET_KEY` — hCaptcha secret key  
   - `RESEND_API_KEY` — Resend API key for contact form emails
   - `CONTACT_TO_EMAIL` — Recipient email for contact submissions
   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
   - `DISCORD_CLIENT_ID` — Discord application client ID
   - `DISCORD_CLIENT_SECRET` — Discord application client secret
   - `DISCORD_BOT_TOKEN` — Discord bot token
   - Additional optional variables for Redis rate limiting and other features

5. **Run:**
   ```bash
   npm run dev        # Development (http://localhost:3000)
   npm run build      # Production build
   npm start          # Production server
   npm run lint       # Check code quality
   ```

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feat/your-feature`
3. **Commit:** `git commit -m "feat: description"`
4. **Push:** `git push origin feat/your-feature`
5. **Open a PR** on GitHub

### Adding or Updating Commands

All commands are defined in [lib/commands.ts](lib/commands.ts). Add a new command object:

```ts
'my-command': {
  name: 'my-command',
  description: 'Short description shown on cards',
  usage: '/my-command <required> [optional]',
  category: 'Category Name',
  permission: 'All',          // 'All' | 'Admin' | 'Manage Server' | 'Owner'
  premium: false,
  details: 'Full explanation shown on the doc page.',
  examples: ['/my-command example-value'],
  relatedCommands: ['other-command'],
},
```

The command will automatically appear on `/commands`, `/docs`, and get its own page at `/docs/my-command`.

### Guidelines

- Follow existing code style (TypeScript, Tailwind utilities)
- Keep components small and reusable
- Test on mobile before submitting
- One feature / fix per PR

---

## ⚠️ Security

This is an open-source project. If you discover a security vulnerability, **please report it privately** rather than opening a public issue.

See [SECURITY.md](SECURITY.md) for:
- Known vulnerabilities and their fixes
- Security best practices for self-hosting
- Recommendations for production deployment

---

## 📄 License

This project is licensed under the **VCL License** — see the [LICENSE](LICENSE) file for details.

You are free to view, study, and contribute to this project. However, using the Software in any application, product, or service is strictly prohibited without explicit permission from the copyright holder.

---

<div align="center">

Made with ❤️ by [ItsMarwan](https://github.com/ItsMarwan)

**[⭐ Star this repo](https://github.com/ItsMarwan/UEFN-DevKit-Website)** if you found it useful!

<br />

[![Discord](https://img.shields.io/discord/1483265235346391091?style=for-the-badge&logo=discord&logoColor=white&label=Discord&color=5865F2)](https://discord.gg/wfPfEw6b6w)

</div>