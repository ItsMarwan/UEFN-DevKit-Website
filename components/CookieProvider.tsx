'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

interface CookieConsent {
  analytics: boolean;
  essential: boolean;
}

interface CookieContextType {
  consent: CookieConsent | null;
  setConsent: (consent: CookieConsent) => void;
  hasConsented: boolean;
  loaded: boolean;
}

const CookieContext = createContext<CookieContextType>({
  consent: null,
  setConsent: () => {},
  hasConsented: false,
  loaded: false,
});

export function useCookieConsent() {
  return useContext(CookieContext);
}

export function CookieProvider({ children }: { children: ReactNode }) {
  const [consent, setConsentState] = useState<CookieConsent | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('cookie-consent');
    if (stored) {
      try {
        setConsentState(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse cookie consent:', e);
      }
    }
    setLoaded(true);
  }, []);

  const setConsent = useCallback((newConsent: CookieConsent) => {
    setConsentState(newConsent);
    localStorage.setItem('cookie-consent', JSON.stringify(newConsent));
  }, []);

  // Memoize the context value so consumers only re-render when consent actually changes,
  // not on every parent render. This is the key fix for cascade re-render lag.
  const value = useMemo<CookieContextType>(
    () => ({ consent, setConsent, hasConsented: consent !== null, loaded }),
    [consent, setConsent, loaded]
  );

  return (
    <CookieContext.Provider value={value}>
      {children}
    </CookieContext.Provider>
  );
}