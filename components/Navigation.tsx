'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/commands', label: 'Commands' },
    { href: '/docs', label: 'Docs' },
    { href: '/premium', label: 'Premium' },
  ];

  return (
    <nav className="fixed w-full top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <span className="font-bold text-white group-hover:text-blue-400 transition-colors">
              UEFN Helper
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-white/80 hover:text-blue-400 transition-colors rounded-lg hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="https://discord.gg/uefnhelper"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105"
            >
              Join Discord
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-white/80 hover:text-blue-400 transition-colors"
          >
            <svg
              className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-white/10 animate-slideInDown">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-white/80 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="https://discord.gg/uefnhelper"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="block mt-2 mx-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium text-center hover:shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              Join Discord
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
