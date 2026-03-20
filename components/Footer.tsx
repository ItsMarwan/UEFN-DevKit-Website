export function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">UEFN Helper</h3>
            <p className="text-white/60 text-sm">
              The most powerful Discord bot for UEFN island builders and communities.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/premium" className="text-white/60 hover:text-blue-400 transition-colors">
                  Premium Plans
                </a>
              </li>
              <li>
                <a href="/commands" className="text-white/60 hover:text-blue-400 transition-colors">
                  Commands
                </a>
              </li>
              <li>
                <a href="/docs" className="text-white/60 hover:text-blue-400 transition-colors">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://discord.gg/" className="text-white/60 hover:text-blue-400 transition-colors">
                  Support Server
                </a>
              </li>
              <li>
                <a href="https://github.com/ItsMarwan/UEFN-Helper-Website" className="text-white/60 hover:text-blue-400 transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href="/status" className="text-white/60 hover:text-blue-400 transition-colors">
                  Status Page
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/privacy" className="text-white/60 hover:text-blue-400 transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-white/60 hover:text-blue-400 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/contact" className="text-white/60 hover:text-blue-400 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/60 text-sm mb-4 md:mb-0">
              © 2024 UEFN Helper. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <a href="https://discord.gg/uefnhelper" className="text-white/60 hover:text-blue-400 transition-colors">
                Discord
              </a>
              <a href="#" className="text-white/60 hover:text-blue-400 transition-colors">
                GitHub
              </a>
              <a href="#" className="text-white/60 hover:text-blue-400 transition-colors">
                Twitter
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
