'use client';

import { useState } from 'react';
import { getAllCategories, getCommandsByCategory } from '@/lib/commands';
import { CommandCard } from '@/components/CommandCard';

export default function CommandsPage() {
  const categories = getAllCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const displayCategories = selectedCategory ? [selectedCategory] : categories;

  return (
    <div className="bg-black text-white min-h-screen pt-16">
      {/* Header */}
      <section className="py-12 md:py-16 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            All Commands
          </h1>
          <p className="text-xl text-white/70">
            Browse all available commands organized by category
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter */}
          <div className="mb-12 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === null
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Commands Grid */}
          {displayCategories.map((category) => {
            const commands = getCommandsByCategory(category);
            return (
              <div key={category} className="mb-16">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white">
                  {category}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {commands.map((command) => (
                    <CommandCard key={command.name} command={command} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
