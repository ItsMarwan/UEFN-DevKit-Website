'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { getAllCategories, getCommandsByCategory } from '@/lib/commands';
import { CommandCard } from '@/components/CommandCard';

export default function CommandsPage() {
  const categories = getAllCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drag-to-scroll logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Get all commands across categories for search/display
  const allCommands = useMemo(() => {
    return categories.flatMap(cat => 
      getCommandsByCategory(cat).map(cmd => ({ ...cmd, category: cat }))
    );
  }, [categories]);

  // Filter logic
  const filteredCommands = useMemo(() => {
    let filtered = allCommands;
    
    if (selectedCategory) {
      filtered = filtered.filter(cmd => cmd.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cmd => 
        cmd.name.toLowerCase().includes(query) || 
        cmd.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [allCommands, selectedCategory, searchQuery]);

  // Grouping for the display
  const displayGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.8);
        }
      `}} />

      {/* Hero Header */}
      <section className="relative pt-20 pb-12 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Command <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Library</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Everything you need to manage your server effectively. Search through our extensive list of slash commands and utilities.
          </p>
        </div>
      </section>

      {/* Main Interface */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Search & Filter Bar */}
        <div className="sticky top-20 z-40 mb-12 py-4 bg-black/80 backdrop-blur-md border-b border-white/5">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-blue-400 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text"
                placeholder="Search commands (e.g. /ban, stats...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <kbd className="hidden sm:inline-block px-2 py-1 text-[10px] font-semibold text-neutral-500 bg-neutral-800 border border-neutral-700 rounded-md">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Category Pills (Draggable & Scrollable) */}
            <div 
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeaveOrUp}
              onMouseUp={handleMouseLeaveOrUp}
              onMouseMove={handleMouseMove}
              className={`flex items-center gap-2 overflow-x-auto pb-3 md:pb-3 w-full custom-scrollbar cursor-grab active:cursor-grabbing select-none`}
            >
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-medium transition-all text-sm ${
                  selectedCategory === null
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-neutral-900/50 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-white/5'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-medium transition-all text-sm ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-neutral-900/50 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-white/5'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-8 flex justify-between items-end">
          <p className="text-sm text-neutral-500 font-medium">
            Showing <span className="text-blue-400">{filteredCommands.length}</span> commands
          </p>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-xs text-neutral-400 hover:text-white underline underline-offset-4"
            >
              Clear Search
            </button>
          )}
        </div>

        {/* Commands Grid Rendering */}
        {Object.keys(displayGroups).length > 0 ? (
          Object.entries(displayGroups).map(([category, commands]) => (
            <div key={category} className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-white whitespace-nowrap">
                  {category}
                </h2>
                <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {commands.map((command) => (
                  <div key={command.name} className="group relative">
                    {/* Hover Glow Effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                    <CommandCard command={command} />
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
              <svg className="w-8 h-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No commands found</h3>
            <p className="text-neutral-500">We couldn't find anything matching "{searchQuery}"</p>
          </div>
        )}
      </section>

      {/* Quick Invite Footer */}
      <section className="bg-neutral-950/50 border-t border-white/5 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-neutral-400 mb-8">Add our bot to your server today and unlock all these features.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/invite" className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20">
              Invite to Discord
            </a>
            <a href="/support" className="px-8 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl transition-all">
              Join Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}