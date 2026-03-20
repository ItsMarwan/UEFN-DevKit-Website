'use client';

import { useState } from 'react';
import { getAllCategories, getCommandsByCategory } from '@/lib/commands';
import { CommandCard } from '@/components/CommandCard';

export default function DocsPage() {
  const categories = getAllCategories();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.slice(0, 3))
  );

  const toggleCategory = (category: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setExpandedCategories(newSet);
  };

  return (
    <div className="bg-black text-white min-h-screen pt-16">
      {/* Header */}
      <section className="py-12 md:py-16 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Command Documentation
          </h1>
          <p className="text-xl text-white/70">
            In-depth guides for every command with examples and tips
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {categories.map((category) => {
            const commands = getCommandsByCategory(category);
            const isExpanded = expandedCategories.has(category);

            return (
              <div key={category} className="mb-8">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full text-left p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between group border border-white/10"
                >
                  <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {category}
                  </h2>
                  <span className={`text-2xl transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {isExpanded && (
                  <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {commands.map((command) => (
                      <CommandCard key={command.name} command={command} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
