'use client';

import { memo, useCallback, useState } from 'react';
import { useCookieConsent } from './CookieProvider';

interface CookieDisabledPopupProps {
  onClose: () => void;
}

export const CookieDisabledPopup = memo(function CookieDisabledPopup({ onClose }: CookieDisabledPopupProps) {
  const { setConsent } = useCookieConsent();
  const [isClosing, setIsClosing] = useState(false);

  const handleEnableCookies = useCallback(() => {
    setConsent({ analytics: true, essential: true });
    setIsClosing(true);
    window.setTimeout(onClose, 200);
  }, [setConsent, onClose]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    window.setTimeout(onClose, 200);
  }, [onClose]);

  return (
    // Replaced backdrop-blur-sm with a solid dark overlay — backdrop-blur is
    // extremely expensive and causes frame drops, especially on top of complex pages.
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className={`absolute inset-0 bg-black/85 ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`} />
      <div className={`relative bg-[#0a0a0a] border border-white/20 rounded-xl p-6 max-w-md w-full mx-4 ${isClosing ? 'animate-scaleOut' : 'animate-scaleIn'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Cookies Disabled</h2>
        </div>

        <div className="text-white/80 text-sm space-y-3 mb-6">
          <p>
            Essential cookies are required to log in with Discord and maintain your session. Without cookies enabled, you cannot access authenticated features.
          </p>
          <p>
            Cookies help us remember your login state so you don't have to authenticate every time you visit the site.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEnableCookies}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Enable Cookies
          </button>
        </div>
      </div>
    </div>
  );
});