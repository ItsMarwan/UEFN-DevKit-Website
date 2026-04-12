<div align="center">

<img src="public/images/banner.png" alt="UEFN DevKit Banner" width="100%" />

# UEFN DevKit — Website

**The official open-source website for the UEFN DevKit Discord Bot.**  
Built with Next.js 16, TypeScript, and Tailwind CSS.

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)
[![License: MNCCL](https://img.shields.io/badge/License-MNCCL-yellow?style=for-the-badge)](LICENSE)

<br />

[**🌐 Live Site**](https://uefndevkit.rweb.site) · [**🤖 Bot Invite**](https://discord.com/api/oauth2/authorize?client_id=123456789012345678&permissions=8&scope=bot%20applications.commands) · [**💬 Discord**](https://discord.gg/wfPfEw6b6w) · [**🐛 Report Bug**](https://github.com/ItsMarwan/UEFN-DevKit-Website/issues) · [**✨ Request Feature**](https://github.com/ItsMarwan/UEFN-DevKit-Website/issues)

</div>

---

## 🧩 About

This is the open-source frontend for **UEFN DevKit** — a Discord bot built for Fortnite UEFN (Unreal Editor for Fortnite) island builders. The website documents every bot command, explains pricing tiers, and provides a contact form for support.

The site is fully static-generation-ready, mobile responsive, and dark-mode only. It was designed to be easy to fork, customize, and self-host.

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
