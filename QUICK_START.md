# Quick Start Guide

## Getting Started in 5 Minutes

### 1. Install Dependencies
```bash
cd "c:\Users\marwa\OneDrive\Desktop\SumProjects\UEFN HELPER BOT\website"
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Project Pages

- **Home** (`/`) - Landing page with features and pricing overview
- **Commands** (`/commands`) - Browse all 50+ commands with filters
- **Docs** (`/docs`) - In-depth documentation for each command
- **Premium** (`/premium`) - Pricing tiers and feature comparison

## What's Included

✅ **50+ Commands Documented**
- Every command has:
  - Usage syntax
  - Detailed explanation
  - Multiple examples
  - Permission requirements
  - Related commands

✅ **Professional Design**
- Gradient UI with custom colors
- Responsive mobile design
- Dark/light mode (auto-detects system preference)
- Smooth animations and transitions

✅ **Complete Site Structure**
- Navigation bar with mobile menu
- Category filtering
- Individual command pages
- Pricing comparison
- 404 page

## Customization

### Update Bot Link
Replace `YOUR_BOT_ID` in:
- `components/Navigation.tsx` (line with oauth2/authorize)
- `app/page.tsx` (home page CTA buttons)

### Change Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: '#2399df',      // Your primary color
  secondary: '#64dcfb',    // Your secondary color
  // ... other colors
}
```

### Add New Commands
1. Open `lib/commands.ts`
2. Add to the `commands` object:
```typescript
'my-command': {
  name: 'my-command',
  description: 'What it does',
  usage: '/my-command <arg>',
  category: 'Category Name',
  permission: 'All',
  premium: false,
  details: 'Long explanation...',
  examples: ['/my-command example'],
  relatedCommands: ['other-command'],
}
```
3. Rebuild and the command appears everywhere automatically!

## Build & Deploy

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Deploy to Vercel
1. Push code to GitHub
2. Connect repo at vercel.com
3. Auto-deploys on push

## File Organization

```
app/                  - Pages and layouts
components/           - Reusable React components
lib/                  - Command data and utilities
public/               - Static assets
tailwind.config.js    - Styling configuration
```

## Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Run production server |
| `npm run lint` | Check code quality |

## Troubleshooting

**Q: Dark mode not working?**
A: The site auto-detects system preference. Change your system theme and refresh.

**Q: Commands not showing up?**
A: Run `npm run build` to regenerate. Check `lib/commands.ts` for syntax errors.

**Q: Build fails?**
A: Run `npm install` again and clear the `.next` folder.

## Next Steps

1. Update the Discord bot invite link
2. Change colors to match your brand
3. Add your custom commands to `lib/commands.ts`
4. Deploy to Vercel or your hosting
5. Configure your domain

## Support

- See `DEVELOPMENT.md` for detailed development guide
- See `README.md` for project overview
- Next.js docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs

---

**You're all set!** The website is production-ready and fully functional.
