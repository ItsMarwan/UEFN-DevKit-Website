'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface SessionUser {
  id: string;
  username: string;
  avatar: string | null;
}

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    // Quietly check if user is logged in
    fetch('/api/dashboard/session?lightweight=true')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) setSessionUser(data.user);
      })
      .catch(() => {})
      .finally(() => setSessionChecked(true));
  }, []);

  function avatarUrl(u: SessionUser) {
    return u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(u.id) % 5}.png`;
  }

  const links = [
    { href: '/', label: 'Home' },
    { href: '/commands', label: 'Commands' },
    { href: '/api/docs', label: 'API' },
    { href: '/buy', label: 'Premium' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-12px); }
        }
        .mobile-menu-enter {
          animation: slideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .mobile-menu-exit {
          animation: slideUp 0.25s cubic-bezier(0.36, 0, 0.66, -0.56) forwards;
        }
        .hamburger-bar {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: center;
        }
      `}</style>

      <nav className="w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 flex-shrink-0" suppressHydrationWarning>
                <Image
                  src="/icon.png"
                  alt="UEFN DevKit icon"
                  width={32}
                  height={32}
                  className="rounded-lg"
                  style={{ mixBlendMode: 'screen' }}
                  priority
                  suppressHydrationWarning
                />
              </div>
              <span className="font-bold text-white group-hover:text-blue-400 transition-colors">
                UEFN DevKit
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

              {/* Discord auth / user avatar */}
              {sessionChecked && (
                sessionUser ? (
                  /* Logged in — show avatar linking to dashboard */
                  <Link
                    href="/dashboard"
                    className="ml-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                    title={sessionUser.username}
                  >
                    <Image
                      src={avatarUrl(sessionUser)}
                      alt={sessionUser.username}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full ring-2 ring-blue-500/50"
                    />
                    <span className="text-white/80 text-sm font-medium hidden lg:inline">{sessionUser.username}</span>
                  </Link>
                ) : (
                  /* Not logged in — Discord login button */
                  <a
                    href="/api/dashboard/login"
                    className="ml-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/40 hover:border-[#5865F2]/60 text-[#7289da] hover:text-white transition-all text-sm font-medium"
                  >
                    {/* Discord icon */}
                    <svg width="16" height="16" viewBox="0 0 71 55" fill="none" className="flex-shrink-0">
                      <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a.2.2 0 0 0-.2.1c-.6 1.1-1.3 2.6-1.8 3.7a54 54 0 0 0-16.3 0A37 37 0 0 0 25.4.5a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.5 4.9a.2.2 0 0 0-.1.1C1.5 18.1-.9 31 .3 43.7c0 .1.1.1.1.2a58.8 58.8 0 0 0 17.7 9 .2.2 0 0 0 .2-.1 42 42 0 0 0 3.6-5.9.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4l1.1-.9a.2.2 0 0 1 .2 0c11.5 5.3 24 5.3 35.4 0a.2.2 0 0 1 .2 0l1.1.9a.2.2 0 0 1 0 .4 36 36 0 0 1-5.5 2.6.2.2 0 0 0-.1.3 47 47 0 0 0 3.6 5.9.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.7-9 .2.2 0 0 0 .1-.2C72.9 29.3 69.2 16.5 60.2 5a.2.2 0 0 0-.1-.1ZM23.7 36.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 3.9-2.8 7.2-6.4 7.2Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 3.9-2.8 7.2-6.4 7.2Z" fill="currentColor"/>
                    </svg>
                    <span>Login</span>
                  </a>
                )
              )}

              <a
                href="/invite"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105"
              >
                Invite Me
              </a>
            </div>

            {/* Mobile right side */}
            <div className="md:hidden flex items-center gap-2">
              {/* Avatar or login icon for mobile */}
              {sessionChecked && (
                sessionUser ? (
                  <Link href="/dashboard">
                    <Image
                      src={avatarUrl(sessionUser)}
                      alt={sessionUser.username}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full ring-2 ring-blue-500/50"
                    />
                  </Link>
                ) : (
                  <a
                    href="/api/dashboard/login"
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#7289da]"
                    title="Login with Discord"
                  >
                    <svg width="14" height="14" viewBox="0 0 71 55" fill="none">
                      <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a.2.2 0 0 0-.2.1c-.6 1.1-1.3 2.6-1.8 3.7a54 54 0 0 0-16.3 0A37 37 0 0 0 25.4.5a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.5 4.9a.2.2 0 0 0-.1.1C1.5 18.1-.9 31 .3 43.7c0 .1.1.1.1.2a58.8 58.8 0 0 0 17.7 9 .2.2 0 0 0 .2-.1 42 42 0 0 0 3.6-5.9.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4l1.1-.9a.2.2 0 0 1 .2 0c11.5 5.3 24 5.3 35.4 0a.2.2 0 0 1 .2 0l1.1.9a.2.2 0 0 1 0 .4 36 36 0 0 1-5.5 2.6.2.2 0 0 0-.1.3 47 47 0 0 0 3.6 5.9.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.7-9 .2.2 0 0 0 .1-.2C72.9 29.3 69.2 16.5 60.2 5a.2.2 0 0 0-.1-.1ZM23.7 36.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 3.9-2.8 7.2-6.4 7.2Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 3.9-2.8 7.2-6.4 7.2Z" fill="currentColor"/>
                    </svg>
                  </a>
                )
              )}

              {/* Hamburger */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
                className="p-2 text-white/80 hover:text-blue-400 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  strokeLinecap="round"
                  suppressHydrationWarning
                >
                  <line
                    className="hamburger-bar"
                    x1="4" y1="6" x2="20" y2="6"
                    style={{ transform: isOpen ? 'rotate(45deg) translateY(7px)' : 'none', transformOrigin: 'center' }}
                  />
                  <line
                    className="hamburger-bar"
                    x1="4" y1="12" x2="20" y2="12"
                    style={{ opacity: isOpen ? 0 : 1, transform: isOpen ? 'scaleX(0)' : 'none' }}
                  />
                  <line
                    className="hamburger-bar"
                    x1="4" y1="18" x2="20" y2="18"
                    style={{ transform: isOpen ? 'rotate(-45deg) translateY(-7px)' : 'none', transformOrigin: 'center' }}
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
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

                {/* Discord auth in mobile menu */}
                {sessionChecked && !sessionUser && (
                  <a
                    href="/api/dashboard/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-[#7289da] hover:text-white hover:bg-[#5865F2]/10 rounded-lg transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 71 55" fill="none">
                      <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a.2.2 0 0 0-.2.1c-.6 1.1-1.3 2.6-1.8 3.7a54 54 0 0 0-16.3 0A37 37 0 0 0 25.4.5a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.5 4.9a.2.2 0 0 0-.1.1C1.5 18.1-.9 31 .3 43.7c0 .1.1.1.1.2a58.8 58.8 0 0 0 17.7 9 .2.2 0 0 0 .2-.1 42 42 0 0 0 3.6-5.9.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4l1.1-.9a.2.2 0 0 1 .2 0c11.5 5.3 24 5.3 35.4 0a.2.2 0 0 1 .2 0l1.1.9a.2.2 0 0 1 0 .4 36 36 0 0 1-5.5 2.6.2.2 0 0 0-.1.3 47 47 0 0 0 3.6 5.9.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.7-9 .2.2 0 0 0 .1-.2C72.9 29.3 69.2 16.5 60.2 5a.2.2 0 0 0-.1-.1ZM23.7 36.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 3.9-2.8 7.2-6.4 7.2Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 3.9-2.8 7.2-6.4 7.2Z" fill="currentColor"/>
                    </svg>
                    Login with Discord
                  </a>
                )}

                {sessionChecked && sessionUser && (
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <Image
                      src={avatarUrl(sessionUser)}
                      alt={sessionUser.username}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full ring-2 ring-blue-500/50"
                    />
                    <span className="text-white/60 text-sm">{sessionUser.username}</span>
                    <a href="/api/dashboard/logout" className="ml-auto text-white/30 hover:text-red-400 text-xs transition-colors">
                      Logout
                    </a>
                  </div>
                )}
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