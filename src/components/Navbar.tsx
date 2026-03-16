'use client'

import Link from 'next/link'
import { useTheme } from './Providers'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Commands', href: '/commands' },
    // { label: 'Premium', href: '/premium' },
    { label: 'Tiers', href: '/tiers' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src="/icon.png"
                alt="UEFN Helper Logo"
                width={40}
                height={40}
                priority
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-xl text-black dark:text-white hidden sm:block">
              UEFN Helper
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 dark:text-gray-300 hover:text-[#2399df] dark:hover:text-[#64dcfb] transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Theme Toggle & Invite Button */}
          <div className="flex items-center gap-4">
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon size={20} className="text-gray-700" />
                ) : (
                  <Sun size={20} className="text-yellow-400" />
                )}
              </button>
            )}

            <a
              href="/invite"
              className="hidden sm:block px-4 py-2 bg-gradient-to-r from-[#2399df] to-[#64dcfb] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#2399df]/50 transition-all"
            >
              Invite Bot
            </a>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-900"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X size={20} className="text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu size={20} className="text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 dark:border-gray-800">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-[#2399df] dark:hover:text-[#64dcfb] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="/invite"
              className="block px-4 py-2 mt-2 bg-gradient-to-r from-[#2399df] to-[#64dcfb] text-white rounded-lg font-semibold text-center"
            >
              Invite Bot
            </a>
          </div>
        )}
      </div>
    </nav>
  )
}
