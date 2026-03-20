# Development Guide - UEFN Helper Website

## Project Overview

This is a professional Next.js website for the UEFN Helper Discord Bot. It features:
- Complete command documentation for 50+ bot commands
- Interactive pricing pages with three tiers (Free, Premium, Enterprise)
- Dark/light mode support with system theme detection
- Full mobile responsiveness
- Professional gradient-based UI design

## File Structure

```
website/
├── app/                          # Next.js App Router (main application)
│   ├── layout.tsx               # Root layout - wraps all pages
│   ├── page.tsx                 # Home/landing page
│   ├── globals.css              # Global styles and animations
│   ├── commands/                # Commands listing
│   │   └── page.tsx
│   ├── docs/                    # Documentation pages
│   │   ├── page.tsx             # Docs index with category expand/collapse
│   │   └── [command]/           # Dynamic routes for each command
│   │       └── page.tsx
│   ├── premium/                 # Pricing/premium features
│   │   └── page.tsx
│   └── not-found.tsx            # 404 error page
│
├── components/                   # Reusable React components
│   ├── Navigation.tsx           # Header with nav menu
│   ├── Footer.tsx               # Footer with links
│   ├── CommandCard.tsx          # Individual command display card
│   └── ThemeProvider.tsx        # Dark mode provider component
│
├── lib/                         # Utility functions and data
│   └── commands.ts              # All command definitions, types, and helpers
│
├── public/                      # Static assets
│   └── icon.png                 # Bot icon/favicon
│
├── Configuration Files
│   ├── next.config.js           # Next.js configuration
│   ├── tailwind.config.js       # Tailwind CSS configuration with custom colors
│   ├── postcss.config.js        # PostCSS configuration
│   ├── tsconfig.json            # TypeScript configuration
│   ├── .eslintrc.json           # ESLint configuration
│   ├── package.json             # Dependencies and scripts
│   └── .gitignore               # Git ignore rules
│
└── Documentation
    ├── README.md                # Main README
    └── DEVELOPMENT.md           # This file
```

## Key Technologies

- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom colors
- **Theme**: System-aware dark/light mode
- **Icons**: Unicode/emoji emojis
- **Build Tool**: Next.js built-in compilation

## Color Scheme

The site uses a professional color palette:

```
Primary Blue:    #2399df    - Main interactive color
Secondary Cyan:  #64dcfb    - Accent color
Dark BG:         #030712    - Dark mode background
Light BG:        #ffffff    - Light mode background
```

Additional colors are defined in `tailwind.config.js` for dark mode variants.

## Command Data

All command information is centralized in `lib/commands.ts`:

```typescript
interface Command {
  name: string;              // Command name (without /)
  description: string;       // Short description
  usage: string;            // How to use it
  category: string;         // Category for organization
  permission: string;       // Permission level required
  premium: boolean;         // Whether it requires Premium tier
  details: string;          // Long-form explanation
  examples: string[];       // Usage examples
  relatedCommands: string[]; // Links to related commands
}
```

To add a new command:
1. Add it to the `commands` object in `lib/commands.ts`
2. The command will automatically appear in:
   - `/commands` page
   - `/docs` page
   - Individual command doc pages
   - Category filters

## Theme System

The theme system automatically detects system preferences:

```typescript
// app/components/ThemeProvider.tsx
- Checks window.matchMedia('(prefers-color-scheme: dark)')
- Adds/removes 'dark' class to <html>
- Listens for system theme changes
- No localStorage - purely system-based
```

Dark mode is controlled via Tailwind's `dark:` prefix:
```tsx
<div className="bg-white dark:bg-dark-bg text-gray-900 dark:text-light">
```

## Pages Breakdown

### Home (/)
- Hero section with CTA buttons
- Feature showcase grid
- Pricing tier comparison
- Call-to-action section

### Commands (/commands)
- Grid of all commands
- Category filter buttons
- CommandCard components showing:
  - Command name
  - Description
  - Permission level
  - Premium badge
  - Usage syntax

### Docs (/docs)
- Expandable category sections
- Initial categories expanded: first 3
- Click to toggle expansion
- Same CommandCard layout

### Command Detail (/docs/[command])
- Full command documentation
- Info grid (category, permission, tier)
- Usage example in code block
- Long-form description
- Multiple usage examples
- Related commands links

### Premium (/premium)
- Three tier comparison cards
- Feature lists organized by category
- Most Popular badge on Premium tier
- FAQ accordion section
- Get Started buttons

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) after running `npm run dev`.

## Styling Approach

### Tailwind CSS
- Mobile-first responsive design (`md:`, `lg:` breakpoints)
- Dark mode with `dark:` prefix
- Custom colors in config
- No custom CSS classes (utility-first)

### Global Styles (app/globals.css)
- Animations: `fadeIn`, `slideInLeft`, `slideInRight`, `pulse-glow`
- Custom scrollbar styling
- Smooth scrolling behavior
- Responsive utilities

### Component-Level Styles
- All inline Tailwind classes
- Responsive breakpoints for layout
- Dark mode variants on all elements

## Important Features

### 1. Mobile Responsiveness
- Navigation collapses to hamburger menu on mobile
- Grid layouts change from 3 columns → 2 → 1
- Touch-friendly button sizes (44px minimum)
- Readable font sizes at all breakpoints

### 2. Accessibility
- Semantic HTML (nav, main, footer, section)
- Proper heading hierarchy (h1 → h2 → h3)
- Color contrast for WCAG compliance
- Keyboard navigation for buttons
- Alt text for important elements

### 3. Performance
- Static site generation where possible
- Dynamic pages for command docs
- Optimized build output
- No external image loading
- Minimal JavaScript

### 4. SEO
- Proper meta tags in layout
- Open Graph support ready
- Semantic HTML structure
- Fast page load times

## Adding New Features

### Add a New Command
1. Edit `lib/commands.ts`
2. Add to `commands` object
3. Rebuild or restart dev server

### Add a New Page
1. Create folder in `app/`
2. Add `page.tsx`
3. Add navigation link in `components/Navigation.tsx`

### Modify Colors
1. Edit `tailwind.config.js`
2. Update dark mode and light mode variants
3. Rebuild

### Add Animation
1. Add `@keyframes` to `app/globals.css`
2. Add animation class
3. Use in components with `animate-*`

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repo to Vercel
3. Auto-deploys on push
4. Environment variables in Vercel dashboard

### Self-Hosted
```bash
npm run build
npm start
```

Runs on port 3000 by default.

## Troubleshooting

### Theme not working?
- Check if `ThemeProvider` is wrapping the app
- Verify `suppressHydrationWarning` on `<html>`
- Check browser console for errors

### Commands not showing?
- Verify command data in `lib/commands.ts`
- Check command name matches route
- Rebuild with `npm run build`

### Styling issues?
- Verify Tailwind config is loaded
- Check for conflicting CSS
- Ensure dark mode class is on `<html>`
- Run `npm install` to ensure all deps

### Build fails?
- Check TypeScript errors
- Verify all imports are correct
- Check for missing dependencies
- Clear `.next` folder and rebuild

## Best Practices

1. **Component Organization**
   - Keep components reusable
   - Pass data via props
   - Use TypeScript interfaces

2. **Styling**
   - Use Tailwind utilities
   - Avoid custom CSS when possible
   - Mobile-first responsive design
   - Test on actual devices

3. **Code Quality**
   - Run eslint before committing
   - Use TypeScript types
   - Keep components small
   - Add comments for complex logic

4. **Performance**
   - Use `'use client'` only when needed
   - Lazy load where possible
   - Optimize images
   - Minimize animations

## Future Enhancements

- [ ] Blog section for updates
- [ ] API documentation
- [ ] Video tutorials
- [ ] Community showcase
- [ ] Search functionality
- [ ] Command search with filters
- [ ] Feedback form
- [ ] Dark mode toggle button
- [ ] Internationalization (i18n)
- [ ] Analytics integration

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## Support

For issues or questions about the website:
1. Check existing code and comments
2. Refer to this development guide
3. Check Next.js and Tailwind documentation
4. Review the TypeScript error messages
