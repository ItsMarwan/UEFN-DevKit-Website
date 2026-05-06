'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 selection:bg-blue-500/30">
      <div className="relative max-w-xl w-full text-center">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/10 blur-[120px] rounded-full -z-10" />

        {/* Large 404 Text */}
        <div className="mb-4">
          <h1 className="text-[12rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent select-none">
            404
          </h1>
        </div>

        <div className="relative -mt-20">
          <h2 className="text-3xl font-bold text-white mb-4">Lost in Space</h2>
          <p className="text-neutral-400 text-lg mb-10 max-w-md mx-auto">
            The page you are looking for has been moved or doesn't exist in our current dimension.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-black hover:bg-neutral-200 font-bold rounded-xl transition-all duration-200 shadow-xl shadow-white/5"
            >
              Back to Home
            </Link>
            
            <button 
              onClick={() => window.history.back()}
              className="w-full sm:w-auto px-8 py-3.5 bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:text-white font-bold rounded-xl transition-all duration-200"
            >
              Previous Page
            </button>
          </div>
        </div>

        {/* Decorative Grid or Elements */}
        <div className="mt-16 pt-16 border-t border-white/5 grid grid-cols-3 gap-8">

          {/* STATUS PAGE AND SUPPORT WILL BE ADDED SOON */}

          <div className="text-center">
            <span className="block text-white font-medium mb-1">Support</span>
            <Link href="/discord" className="text-sm text-neutral-500 hover:text-blue-400 transition-colors">Help Center</Link>
          </div>
          <div className="text-center">
            <span className="block text-white font-medium mb-1">Status</span>
            <Link href="/status" className="text-sm text-neutral-500 hover:text-blue-400 transition-colors">System Online</Link> {/* ADD STAUS PAGE*/}
          </div>
          <div className="text-center">
            <span className="block text-white font-medium mb-1">Docs</span>
            <Link href="/commands" className="text-sm text-neutral-500 hover:text-blue-400 transition-colors">Command Docs</Link>
          </div>
        </div>
      </div>
    </div>
  );
}