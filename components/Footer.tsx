'use client';

import Link from 'next/link';
import { useLegal } from './LegalProvider';

export function Footer() {
  const { openLegal } = useLegal();

  return (
    <footer className="bg-black border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">UEFN DevKit</h3>
            <p className="text-white/60 text-sm">
              The most powerful Discord bot for UEFN island builders and communities.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/buy" className="text-white/60 hover:text-blue-400 transition-colors">
                  Premium Plans
                </Link>
              </li>
              <li>
                <Link href="/commands" className="text-white/60 hover:text-blue-400 transition-colors">
                  Commands
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-white/60 hover:text-blue-400 transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-white/60 hover:text-blue-400 transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/discord" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-blue-400 transition-colors">
                  Support Server
                </a>
              </li>
              <li>
                <a href="https://github.com/ItsMarwan/UEFN-DevKit-Website" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-blue-400 transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <Link href="/api/docs" className="text-white/60 hover:text-blue-400 transition-colors">
                  API Endpoint
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => openLegal('privacy')}
                  className="text-white/60 hover:text-blue-400 transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => openLegal('tos')}
                  className="text-white/60 hover:text-blue-400 transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <Link href="/contact" className="text-white/60 hover:text-blue-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} UEFN DevKit. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <button
                onClick={() => openLegal('privacy')}
                className="text-white/40 hover:text-blue-400 transition-colors"
              >
                Privacy
              </button>
              <span className="text-white/20">·</span>
              <button
                onClick={() => openLegal('tos')}
                className="text-white/40 hover:text-blue-400 transition-colors"
              >
                Terms
              </button>
              <span className="text-white/20">·</span>
              <a href="/discord" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-blue-400 transition-colors">
                Discord
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
