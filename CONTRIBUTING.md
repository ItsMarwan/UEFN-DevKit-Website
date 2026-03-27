# Contributing to UEFN DevKit Website

Thanks for taking the time to contribute! 🎉

## Ways to Contribute

- 🐛 **Report bugs** — Open an [issue](https://github.com/ItsMarwan/UEFN-DevKit-Website/issues) with steps to reproduce
- ✨ **Suggest features** — Open an issue describing what you'd like to see
- 📝 **Improve docs** — Fix typos, clarify explanations, add missing command docs
- 💻 **Submit a PR** — Fix a bug or implement a feature

## Development Setup

```bash
git clone https://github.com/ItsMarwan/UEFN-DevKit-Website.git
cd UEFN-DevKit-Website
npm install
cp .env.example .env.local  # fill in your keys
npm run dev
```

## Pull Request Process

1. Fork the repo and create your branch from `main`
2. Name your branch: `feat/thing`, `fix/thing`, or `docs/thing`
3. Make sure `npm run lint` passes before submitting
4. Keep PRs focused — one thing per PR
5. Describe what your PR does in the description

## Commit Style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add search to commands page
fix: related command links encoding spaces as %20
docs: update environment variable table
chore: upgrade Next.js to 14.3
```

## Code Style

- TypeScript everywhere — no `any` if avoidable
- Tailwind utility classes only — no custom CSS unless truly necessary
- Components go in `components/`, page data goes in `lib/`
- Mobile-first responsive design

## Adding a Bot Command

Edit `lib/commands.ts` and add an entry to the `commands` object:

```ts
'command-name': {
  name: 'command name',        // spaces, not hyphens
  description: 'Short description (shown on cards)',
  usage: '/command name <required> [optional]',
  category: 'Existing Category',
  permission: 'All',           // 'All' | 'Admin' | 'Manage Server' | 'Owner'
  premium: false,
  details: 'Full explanation shown on the doc page.',
  examples: ['/command name example'],
  relatedCommands: ['other command'],
},
```

The command automatically appears on `/commands`, `/docs`, and gets its own page at `/docs/command-name`.

## Questions?

Join the [Discord server](https://discord.gg/uefnhelper) and ask in the support channel.
