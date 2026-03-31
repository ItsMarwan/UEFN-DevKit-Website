"use client";

import { useState } from 'react';

const MASK_CHAR = '●';

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [localPart, domain] = email.split('@');
  if (!domain) return email;

  if (localPart.length <= 2) {
    return `${localPart.charAt(0)}${MASK_CHAR.repeat(Math.max(1, localPart.length - 1))}@${domain}`;
  }

  const maskedLocal =
    localPart.charAt(0) +
    MASK_CHAR.repeat(Math.max(1, localPart.length - 2)) +
    localPart.charAt(localPart.length - 1);

  return `${maskedLocal}@${domain}`;
}

interface MaskedEmailProps {
  email: string;
  className?: string;
  showCopyButton?: boolean;
  showToggleButton?: boolean;
}

export default function MaskedEmail({
  email,
  className = '',
  showCopyButton = true,
  showToggleButton = true,
}: MaskedEmailProps) {
  const [showEmail, setShowEmail] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs select-all" title={email}>
        {showEmail ? email : maskEmail(email)}
      </span>

      {showToggleButton && (
        <button
          onClick={() => setShowEmail(!showEmail)}
          className="text-white/40 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          title={showEmail ? 'Hide email' : 'Show email'}
          type="button"
        >
          {showEmail ? '👁️' : '👁️'}
        </button>
      )}

      {showCopyButton && (
        <button
          onClick={handleCopy}
          className="text-white/40 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          title="Copy email"
          type="button"
        >
          {copied ? '✓' : '📋'}
        </button>
      )}
    </div>
  );
}
