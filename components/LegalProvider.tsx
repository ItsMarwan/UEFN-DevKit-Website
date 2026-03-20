'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { LegalModal } from './LegalModal';

type LegalType = 'privacy' | 'tos' | null;

interface LegalContextType {
  openLegal: (type: 'privacy' | 'tos') => void;
  closeLegal: () => void;
}

const LegalContext = createContext<LegalContextType>({
  openLegal: () => {},
  closeLegal: () => {},
});

export function useLegal() {
  return useContext(LegalContext);
}

export function LegalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<LegalType>(null);

  return (
    <LegalContext.Provider value={{ openLegal: setOpen, closeLegal: () => setOpen(null) }}>
      {children}
      {open && <LegalModal type={open} onClose={() => setOpen(null)} />}
    </LegalContext.Provider>
  );
}
