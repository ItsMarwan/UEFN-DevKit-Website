'use client';

import { useState, memo, useCallback, useEffect } from 'react';
import { useCookieConsent } from './CookieProvider';

export const CookieConsentBanner = memo(function CookieConsentBanner() {
  const { setConsent, hasConsented, loaded } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  
  // Initialize visibility based on whether they've already consented
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Sync visibility with consent state on mount and when hasConsented changes
  useEffect(() => {
    if (!loaded) return;

    if (!hasConsented) {
      setIsVisible(true);
      setIsClosing(false);
    } else if (isVisible) {
      setIsClosing(true);
      const timeout = window.setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 200);
      return () => window.clearTimeout(timeout);
    }
  }, [hasConsented, isVisible, loaded]);

  const handleAcceptAll = useCallback(() => {
    setConsent({ analytics: true, essential: true });
  }, [setConsent]);

  const handleAcceptEssential = useCallback(() => {
    setConsent({ analytics: false, essential: true });
  }, [setConsent]);

  const handleDecline = useCallback(() => {
    setConsent({ analytics: false, essential: false });
  }, [setConsent]);

  const handleShowDetails = useCallback(() => {
    setShowDetails(prev => !prev);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[100] bg-black border-t border-white/10 ${isClosing ? 'animate-slideOutDown' : 'animate-slideInUp'}`}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          <div className="text-white/80 text-sm">
            <p className="mb-2">
              <strong>Cookies & Privacy:</strong> We use cookies to enhance your experience and analyze site usage.
              Essential cookies are required for login functionality.
            </p>
            <button
              onClick={handleShowDetails}
              className="text-blue-400 hover:text-blue-300 underline text-xs"
            >
              {showDetails ? 'Hide details' : 'Show cookie details'}
            </button>
          </div>

          {showDetails && (
            <div className="text-white/70 text-xs space-y-2 border-t border-white/10 pt-3">
              <div>
                <strong>Essential Cookies:</strong> Required for Discord login and session management.
              </div>
              <div>
                <strong>Analytics Cookies:</strong> Google Analytics to help us improve the site.
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Accept All
            </button>
            <button
              onClick={handleAcceptEssential}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Essential Only
            </button>
            <button
              onClick={handleDecline}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors border border-red-500/30 text-sm"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});