'use client'

import Link from 'next/link'
import { Github, Mail, Send } from 'lucide-react'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src="/icon.png"
                  alt="UEFN Helper Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-lg">UEFN Helper</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              The ultimate Discord bot for UEFN management and tracking.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4 text-black dark:text-white">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/commands" className="text-gray-600 dark:text-gray-400 hover:text-[#2399df] dark:hover:text-[#64dcfb] text-sm transition-colors">
                  Commands
                </Link>
              </li>
              <li>
                <Link href="/invite" className="text-gray-600 dark:text-gray-400 hover:text-[#2399df] dark:hover:text-[#64dcfb] text-sm transition-colors">
                  Invite Bot
                </Link>
              </li>
              {/* <li>
                <Link href="/premium" className="text-gray-600 dark:text-gray-400 hover:text-[#2399df] dark:hover:text-[#64dcfb] text-sm transition-colors">
                  Premium
                </Link>
              </li> */}
              <li>
                <Link href="/tiers" className="text-gray-600 dark:text-gray-400 hover:text-[#2399df] dark:hover:text-[#64dcfb] text-sm transition-colors">
                  Pricing Tiers
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4 text-black dark:text-white">Company</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:itsmarwanuefn@gmail.com?subject=UEFN%20Helper%20-%20Inquiry" className="text-gray-600 dark:text-gray-400 hover:text-[#2399df] dark:hover:text-[#64dcfb] text-sm transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <Link target="_blank" href="/developer" className="text-gray-600 dark:text-gray-400 hover:text-[#2399df] dark:hover:text-[#64dcfb] text-sm transition-colors">
                  About me
                </Link>
              </li>
              <li>
                <Link href="/tos" className="text-gray-600 dark:text-gray-400 hover:text-[#2399df] dark:hover:text-[#64dcfb] text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-[#2399df] dark:hover:text-[#64dcfb] text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold mb-4 text-black dark:text-white">Connect</h3>
            <div className="flex gap-3">
              <a
                href="https://discord.gg/"
                className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg hover:bg-[#2399df] hover:text-white dark:hover:bg-[#2399df] transition-colors"
                aria-label="Discord"
              >
                <Send size={18} />
              </a>
              <a
                href="mailto:itsmarwanuefn@gmail.com"
                className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg hover:bg-[#2399df] hover:text-white dark:hover:bg-[#2399df] transition-colors"
                aria-label="Email"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            © 2026 UEFN Helper. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
