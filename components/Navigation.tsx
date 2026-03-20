'use client';

import Link from 'next/link';
import Image from 'next/image';
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
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-8px); }
        }
        .mobile-menu-enter {
          animation: slideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .mobile-menu-exit {
          animation: slideUp 0.18s ease-in forwards;
        }
        .hamburger-bar {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: center;
        }
      `}</style>

      <nav className="fixed w-full top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo — icon + wordmark */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image
                  src="/icon.png"
                  alt="UEFN Helper icon"
                  width={32}
                  height={32}
                  className="rounded-lg"
                  style={{ mixBlendMode: 'screen' }}
                  priority
                />
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
              <a
                href="/invite"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105"
              >
                Invite Me
              </a>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              className="md:hidden p-2 text-white/80 hover:text-blue-400 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                strokeLinecap="round"
              >
                {/* Top bar */}
                <line
                  className="hamburger-bar"
                  x1="4" y1="6" x2="20" y2="6"
                  style={{
                    transform: isOpen ? 'rotate(45deg) translateY(7px)' : 'none',
                    transformOrigin: 'center',
                  }}
                />
                {/* Middle bar */}
                <line
                  className="hamburger-bar"
                  x1="4" y1="12" x2="20" y2="12"
                  style={{
                    opacity: isOpen ? 0 : 1,
                    transform: isOpen ? 'scaleX(0)' : 'none',
                  }}
                />
                {/* Bottom bar */}
                <line
                  className="hamburger-bar"
                  x1="4" y1="18" x2="20" y2="18"
                  style={{
                    transform: isOpen ? 'rotate(-45deg) translateY(-7px)' : 'none',
                    transformOrigin: 'center',
                  }}
                />
              </svg>
            </button>
          </div>

          {/* Mobile Menu — animated */}
          {isOpen && (
            <div className="md:hidden pb-4 border-t border-white/10 mobile-menu-enter">
              <div className="pt-2 space-y-1">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-2.5 text-white/80 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <a
                href="/invite"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="block mt-3 mx-4 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium text-center hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                Invite Me
              </a>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}