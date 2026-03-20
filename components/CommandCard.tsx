'use client';

import Link from 'next/link';
import type { Command } from '@/lib/commands';

interface CommandCardProps {
  command: Command;
}

export function CommandCard({ command }: CommandCardProps) {
  const permissionColors: Record<string, string> = {
    All: 'bg-green-900/30 text-green-300 border border-green-700/30',
    Admin: 'bg-blue-900/30 text-blue-300 border border-blue-700/30',
    'Manage Server': 'bg-cyan-900/30 text-cyan-300 border border-cyan-700/30',
    Owner: 'bg-purple-900/30 text-purple-300 border border-purple-700/30',
  };

  const commandSlug = command.name.replace(/ /g, '-');

  return (
    <Link href={`/docs/${commandSlug}`}>
      <div className="feature-card p-4 rounded-lg border border-white/10 bg-black/50 hover:border-blue-500/50 transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors">
            /{command.name}
          </h3>
          <div className="flex gap-2">
            {command.premium && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-700/30 rounded">
                Premium
              </span>
            )}
            <span className={`px-2 py-1 text-xs font-medium rounded ${permissionColors[command.permission]}`}>
              {command.permission}
            </span>
          </div>
        </div>
        <p className="text-white/60 text-sm mb-3">{command.description}</p>
        <p className="text-xs text-white/40 font-mono bg-white/5 px-2 py-1 rounded inline-block border border-white/10">
          {command.usage}
        </p>
      </div>
    </Link>
  );
}
