# UEFN Helper Bot - Official Website

Professional Next.js website for the UEFN Helper Discord Bot featuring command documentation, pricing tiers, and more.

## Features

✨ **Modern Design**
- Gradient-based UI with primary (`#2399df`) and secondary (`#64dcfb`) colors
- Responsive design for mobile, tablet, and desktop
- Smooth animations and transitions

🌓 **Theme Support**
- Automatic dark/light mode detection based on system preferences
- Seamless theme switching without page reload

📚 **Complete Documentation**
- 50+ commands fully documented with examples
- Categorized command library
- Individual command pages with detailed guides

💰 **Pricing Pages**
- Free, Premium, and Enterprise tiers
- Clear feature comparison
- FAQ section

🎨 **UI Components**
- Reusable command cards
- Interactive navigation
- Footer with links

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles with animations
│   ├── commands/            # Commands listing page
│   ├── docs/                # Documentation pages
│   │   ├── page.tsx         # Docs index
│   │   └── [command]/       # Individual command docs
│   ├── premium/             # Premium/pricing page
│   └── not-found.tsx        # 404 page
├── components/              # Reusable React components
│   ├── Navigation.tsx       # Top navigation bar
│   ├── Footer.tsx           # Footer component
│   ├── CommandCard.tsx      # Command display card
│   └── ThemeProvider.tsx    # Dark mode provider
├── lib/                     # Utility functions
│   └── commands.ts          # Command data and helpers
├── public/                  # Static assets
│   └── icon.png            # Bot icon/favicon
└── tailwind.config.js       # Tailwind CSS config
```

## Colors

- **Primary**: `#2399df` (Vibrant Blue)
- **Secondary**: `#64dcfb` (Cyan)
- **Dark**: `#030712` (Near Black)
- **Light**: `#ffffff` (White)

## Technologies Used

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: CSS animations
- **Theme**: Automatic dark/light mode with system detection

## Key Features

### Commands Documentation
- 50+ Discord bot commands fully documented
- Organized by category
- Usage examples and related commands
- Permission levels and premium indicators

### Responsive Design
- Mobile-first approach
- Works on all screen sizes
- Touch-friendly navigation

### Performance
- Static site generation where possible
- Optimized images and assets
- Fast page loads

### Accessibility
- Semantic HTML
- Proper color contrast
- Keyboard navigation support

## Deployment

The site is optimized for deployment on Vercel:

```bash
npm run build
```

Then push to your repository and deploy through Vercel dashboard.

## License

All rights reserved © 2024 UEFN Helper
