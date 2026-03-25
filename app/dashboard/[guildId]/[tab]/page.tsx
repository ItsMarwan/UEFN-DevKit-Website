'use client';

// app/dashboard/[guildId]/[tab]/page.tsx
// This file makes /dashboard/:guildId/:tab a valid Next.js route.
// It simply re-exports the GuildDashboardPage component so that
// direct navigation to e.g. /dashboard/123/config works exactly
// like clicking through the interface.

export { default } from '../page';
