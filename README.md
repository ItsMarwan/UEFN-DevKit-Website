<div align="center">

<img src="public/images/banner.png" alt="UEFN Helper Banner" width="100%" />

# UEFN Helper — Website

**The official open-source website for the UEFN Helper Discord Bot.**  
Built with Next.js 14, TypeScript, and Tailwind CSS.

<br />

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?tyle=for-the-badge)](LICENSE)

<br />

[**🌐 Live Site**](https://uefnhelper.frii.site) · [**🤖 Bot Invite**](https://discord.gg/) · [**💬 Discord**](https://discord.gg/) · [**🐛 Report Bug**](https://github.com/ItsMarwan/UEFN-Helper-Website/issues) · [**✨ Request Feature**](https://github.com/ItsMarwan/UEFN-Helper-Website/issues)

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

This is the open-source frontend for **UEFN Helper** — a Discord bot built for Fortnite UEFN (Unreal Editor for Fortnite) island builders. The website documents every bot command, explains pricing tiers, and provides a contact form for support.

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
| ⚡ **Performance** | Static generation, minimal JS, fast page loads |
| 📱 **Responsive** | Mobile-first, works on all screen sizes |

---

## 🛠️ Tech Stack

- **Framework** — [Next.js 14](https://nextjs.org/) (App Router)
- **Language** — [TypeScript 5](https://www.typescriptlang.org/)
- **Styling** — [Tailwind CSS 3](https://tailwindcss.com/)
- **Email** — [Resend](https://resend.com/)
- **Captcha** — [hCaptcha](https://www.hcaptcha.com/)
- **Deployment** — [Vercel](https://vercel.com/) (recommended)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** `>=18.17.0`
- **npm** `>=9` (or yarn / pnpm)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ItsMarwan/UEFN-Helper-Website.git
cd UEFN-Helper-Website

# 2. Install dependencies
npm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` | ✅ | Your hCaptcha public site key |
| `HCAPTCHA_SECRET_KEY` | ✅ | Your hCaptcha secret key (server-side only) |
| `RESEND_API_KEY` | ✅ | Resend API key for sending contact emails |
| `CONTACT_TO_EMAIL` | ✅ | Inbox where contact form submissions are delivered |

> **Note on Resend:** Without a verified domain, use `onboarding@resend.dev` as the sender — it works immediately on any Resend account. To use your own domain, verify it at [resend.com/domains](https://resend.com/domains) and update the `from` field in `app/api/contact/route.ts`.

> **Note on hCaptcha:** For local development, the test site key `10000000-ffff-ffff-ffff-000000000001` works without an account.

### Running Locally

```bash
# Development server with hot reload
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

```bash
# Production build
npm run build
npm start

# Lint
npm run lint
```

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
├── .env.local.example          # Environment variable template
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
| `/premium` | Pricing tiers + feature comparison + FAQ |
| `/contact` | hCaptcha-protected contact form |
| `/privacy` | Redirects home and opens Privacy Policy modal |
| `/tos` | Redirects home and opens Terms of Service modal |
| `/invite` | Redirects to the invite link of the bot |

---

## 🤝 Contributing

Contributions are very welcome! This is an open-source project and PRs are appreciated.

### How to contribute

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Commit** your changes
   ```bash
   git commit -m "feat: add your feature"
   ```
4. **Push** to your fork
   ```bash
   git push origin feat/your-feature-name
   ```
5. **Open a Pull Request** on GitHub

### Adding a command

All commands live in `lib/commands.ts`. To add one:

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

- Follow the existing code style (TypeScript, Tailwind utilities)
- Keep components small and reusable
- Test on mobile before submitting
- One feature / fix per PR

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

You are free to fork, modify, and use this project for your own Discord bot website. Attribution is appreciated but not required.

---

<div align="center">

Made with ❤️ by [ItsMarwan](https://github.com/ItsMarwan)

**[⭐ Star this repo](https://github.com/ItsMarwan/UEFN-Helper-Website)** if you found it useful!

<br />

[![Discord](https://img.shields.io/discord/000000000000000000?style=for-the-badge&logo=discord&logoColor=white&label=Discord&color=5865F2)](https://discord.gg/)
**[STILL IN PROGRESS. BOTH THE BOT AND SERVER]**
*look through the code. i added notes for you to read*

</div>