'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PurchaseConfirmPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing purchase...');
  const [activationUrl, setActivationUrl] = useState<string | null>(null);

  useEffect(() => {
    const plan = searchParams.get('plan');
    const serverId = searchParams.get('serverId');
    const isOwner = searchParams.get('isOwner') === 'true';

    if (!plan || !serverId) {
      setStatus('error');
      setMessage('Missing plan or server information');
      return;
    }

    // Record the purchase on the server
    const recordPurchase = async () => {
      try {
        const res = await fetch('/api/patreon/purchase-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan,
            serverId,
            isOwnerBypass: isOwner,
          }),
        });

        if (!res.ok) {
          throw new Error(`Purchase recording failed: ${res.status}`);
        }

        const data = await res.json();
        
        // Save to cookie if cookies allowed
        if (typeof document !== 'undefined' && navigator.cookieEnabled) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 365);
          document.cookie = `patreon_purchase=${JSON.stringify({
            plan,
            serverId,
            timestamp: Date.now(),
            userId: data.userId,
          })}; expires=${expiryDate.toUTCString()}; path=/; Secure; SameSite=Strict`;
        }

        setStatus('success');
        setMessage(`🎉 Premium Purchase Confirmed!\n\nYou've purchased ${plan.replace('months', ' month')} of premium for your server.\n\nNext step: Visit the Patreon page to complete the post-purchase process.`);
        setActivationUrl(`https://www.patreon.com/checkout/premium_plan`);
      } catch (err) {
        console.error('Purchase error:', err);
        setStatus('error');
        setMessage(`Failed to record purchase: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    recordPurchase();
  }, [searchParams]);

  return (
    <div style={{
      background: '#050816',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '520px',
        padding: '40px 24px',
      }}>
        {status === 'loading' && (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3px solid rgba(59, 130, 246, 0.3)',
              borderTop: '3px solid rgb(59, 130, 246)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 24px',
            }} />
            <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Processing Purchase</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Recording your premium purchase...</p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#4ade80' }}>Premium Purchase Confirmed!</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
              {message}
            </p>
            {activationUrl && (
              <div style={{
                padding: '16px',
                marginBottom: '24px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
              }}>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '12px', fontSize: '14px' }}>
                  📋 Your premium is now active on your server!
                </p>
                <a
                  href={activationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    background: '#3b82f6',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#2563eb';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#3b82f6';
                  }}
                >
                  Complete on Patreon →
                </a>
              </div>
            )}
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
              You can close this window. Premium features are now available on your server.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#ef4444' }}>Error Processing Purchase</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '24px' }}>
              {message}
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
              Please return to the site and try again, or contact support if the issue persists.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
