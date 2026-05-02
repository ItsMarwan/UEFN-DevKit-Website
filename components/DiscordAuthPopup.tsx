'use client';

import { useState, memo, useCallback } from 'react';
import { useLegal } from './LegalProvider';
import { useCookieConsent } from './CookieProvider';

interface DiscordAuthPopupProps {
  onClose: () => void;
  onProceed: () => void;
}

// Discord logo extracted as a stable constant so it never triggers re-renders
const DISCORD_LOGO = (
  <svg width="24" height="24" viewBox="0 0 71 55" fill="none" className="text-[#5865F2]">
    <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a.2.2 0 0 0-.2.1c-.6 1.1-1.3 2.6-1.8 3.7a54 54 0 0 0-16.3 0A37 37 0 0 0 25.4.5a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.5 4.9a.2.2 0 0 0-.1.1C1.5 18.1-.9 31 .3 43.7c0 .1.1.1.1.2a58.8 58.8 0 0 0 17.7 9 .2.2 0 0 0 .2-.1 42 42 0 0 0 3.6-5.9.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4l1.1-.9a.2.2 0 0 1 .2 0c11.5 5.3 24 5.3 35.4 0a.2.2 0 0 1 .2 0l1.1.9a.2.2 0 0 1 0 .4 36 36 0 0 1-5.5 2.6.2.2 0 0 0-.1.3 47 47 0 0 0 3.6 5.9.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.7-9 .2.2 0 0 0 .1-.2C72.9 29.3 69.2 16.5 60.2 5a.2.2 0 0 0-.1-.1ZM23.7 36.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 3.9-2.8 7.2-6.4 7.2Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 3.9-2.8 7.2-6.4 7.2Z" fill="currentColor"/>
  </svg>
);

export const DiscordAuthPopup = memo(function DiscordAuthPopup({ onClose, onProceed }: DiscordAuthPopupProps) {
  const { openLegal } = useLegal();
  const { consent } = useCookieConsent();
  const [agreed, setAgreed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    window.setTimeout(onClose, 200);
  }, [onClose]);

  const handleProceed = useCallback(() => {
    if (!consent?.essential) {
      alert('Essential cookies are required for login. Please enable cookies to continue.');
      return;
    }
    if (!agreed) {
      alert('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    onProceed();
  }, [consent, agreed, onProceed]);

  const handleAgreedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAgreed(e.target.checked);
  }, []);

  const openTos = useCallback(() => openLegal('tos'), [openLegal]);
  const openPrivacy = useCallback(() => openLegal('privacy'), [openLegal]);

  return (
    // Removed backdrop-blur-sm — it causes GPU frame drops.
    // Using a solid dark overlay instead.
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className={`absolute inset-0 bg-black/85 ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`} />
      <div className={`relative bg-[#0a0a0a] border border-white/20 rounded-xl p-6 max-w-md w-full mx-4 ${isClosing ? 'animate-scaleOut' : 'animate-scaleIn'}`}>
        <div className="flex items-center gap-3 mb-4">
          {DISCORD_LOGO}
          <h2 className="text-xl font-bold text-white">Discord Login</h2>
        </div>

        <div className="text-white/80 text-sm space-y-3 mb-6">
          <p>
            By logging in with Discord, you allow UEFN DevKit to access your email, profile image, username, display name, and other necessary information for account management and service functionality.
          </p>
          <p>
            You also agree to our{' '}
            <button
              onClick={openTos}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              onClick={openPrivacy}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Privacy Policy
            </button>
            .
          </p>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={handleAgreedChange}
            className="w-4 h-4 text-blue-500 bg-black border-white/20 rounded focus:ring-blue-500"
          />
          <label htmlFor="agree" className="text-white/80 text-sm">
            I agree to the Terms of Service and Privacy Policy
          </label>
        </div>

        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 mb-4 text-sm text-red-100">
          {!consent?.essential ? (
            <p>Please turn cookies on to continue with Discord login.</p>
          ) : (
            <p>Essential cookies are enabled. You can continue with Discord login.</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            disabled={!consent?.essential || !agreed}
            className="flex-1 px-4 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue with Discord
          </button>
        </div>
      </div>
    </div>
  );
});