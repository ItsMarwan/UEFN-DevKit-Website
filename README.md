# UEFN Helper Bot - Website

A modern, responsive website for the UEFN Helper Discord bot. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

✨ **Modern Design**
- Clean, intuitive UI with glassmorphism effects
- Responsive design for all devices
- Smooth animations and transitions

🌙 **Dark/Light Mode**
- Toggle between dark and light themes
- Persisted user preference
- Smooth theme transitions

🎯 **Key Pages**
- **Home**: Showcase bot features and benefits
- **Commands**: Browse all bot commands with descriptions
- **Premium**: Premium subscription offerings
- **Tiers**: Detailed pricing tier comparison
- **Contact**: Get in touch with us
- **Privacy Policy**: Data protection information
- **Terms of Service**: Legal terms

🔗 **API Integration**
- Fetches commands from `/api/commands`
- Fetches pricing tiers from `/api/tiers`
- Contact form handling

## Tech Stack

- **Framework**: Next.js 14+
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel Ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/uefn-helper-website.git
cd uefn-helper-website
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` from `.env.example`:
```bash
cp .env.example .env.local
```

4. Update your environment variables:
```
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_bot_client_id
NEXT_PUBLIC_DISCORD_SERVER_ID=your_discord_server_id
```

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

Build for production:
```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   ├── commands/page.tsx   # Commands page
│   ├── premium/page.tsx    # Premium page
│   ├── tiers/page.tsx      # Pricing tiers page
│   ├── contact/page.tsx    # Contact page
│   ├── tos/page.tsx        # Terms of Service
│   ├── privacy/page.tsx    # Privacy Policy
│   └── api/
│       ├── commands/route.ts
│       └── tiers/route.ts
└── components/
    ├── Navbar.tsx          # Navigation bar with theme toggle
    ├── Footer.tsx          # Footer with links
    └── Providers.tsx       # Theme context provider
```

## Customization

### Color Palette

The site uses the following colors (easily customizable in `tailwind.config.ts`):
- Primary Blue: `#2399df`
- Cyan Accent: `#64dcfb`
- White: `#ffffff`
- Black: `#000000`

### Adding Your Logo

Replace placeholder branding in:
- `src/components/Navbar.tsx` - Logo in navbar
- `src/components/Footer.tsx` - Logo in footer
- `public/` - Add your actual brand assets

### Discord Bot Integration

Update the invite link in:
- `src/components/Navbar.tsx` - Line with Discord OAuth URL
- `src/app/page.tsx` - CTA buttons
- Other pages as needed

Replace `YOUR_CLIENT_ID` with your actual Discord bot client ID.

## API Endpoints

### GET `/api/commands`

Returns array of bot commands:
```json
[
  {
    "name": "fortnite-tracker",
    "description": "Track Fortnite player statistics",
    "usage": "/fortnite-tracker <player-name>",
    "premium": false
  }
]
```

### GET `/api/tiers`

Returns pricing tier configuration matching your bot's limits.

## Deployment to Vercel

1. Push your repository to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Connect your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_DISCORD_CLIENT_ID`
   - `NEXT_PUBLIC_DISCORD_SERVER_ID`
5. Deploy!

The site will automatically rebuild on every push to your main branch.

## Customizing API Endpoints

If you have a backend API:

1. Update `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=https://your-api.com
```

2. Modify API calls in components:
```typescript
const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/commands`)
```

## Theme Toggle

The theme toggle is built-in and persistent:
- Uses localStorage to save user preference
- Respects system dark mode preference on first visit
- Smooth CSS transitions between themes

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Optimized for Core Web Vitals
- Image optimization with Next.js Image component
- CSS minimization with Tailwind
- Code splitting with dynamic imports

## Security

- No sensitive data stored in client
- Environment variables for secrets
- HTTPS ready for Vercel deployment
- CSP headers configured

## Legal Pages

The site includes templated legal pages:
- **Privacy Policy**: Emphasizes data security and consent requirements
- **Terms of Service**: Standard ToS with service limitations

Customize these with your actual legal requirements!

## Support

For questions or issues:
- Discord: [Your Server]
- Email: contact@uefnhelper.com

## License

[Specify your license here]

## Credits

Created for the UEFN Helper Discord bot community.

---

**Ready to deploy?** Use Vercel for instant deployments with zero configuration. Just connect your GitHub repo and you're live!
