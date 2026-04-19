'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProcessingPage() {
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [message, setMessage] = useState('Processing your payment...');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [premiumActive, setPremiumActive] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const plan = searchParams.get('plan');

  useEffect(() => {
    if (!plan) {
      setStatus('failed');
      setMessage('Invalid plan specified');
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await fetch('/api/premium/payment-status');
        const data = await response.json();

        if (response.ok) {
          setStatus(data.status);
          setExpiresAt(data.expires_at);
          setPremiumActive(data.premium_active);

          if (data.status === 'success') {
            setMessage('Payment successful! Premium activated.');
            // Redirect to success page after a delay
            setTimeout(() => {
              router.push('/premium?activated=true');
            }, 3000);
          } else if (data.status === 'failed') {
            setMessage('Payment verification failed. Please contact support.');
          }
        } else {
          setStatus('failed');
          setMessage('Failed to check payment status');
        }
      } catch (error) {
        console.error('Polling error:', error);
        setStatus('failed');
        setMessage('Network error. Please refresh the page.');
      }
    };

    // Initial poll
    pollStatus();

    // Poll every 5 seconds if still pending
    const interval = setInterval(() => {
      if (status === 'pending') {
        pollStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [plan, status, router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 text-center">
        {status === 'pending' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold mb-4">Processing Payment</h1>
            <p className="text-white/80 mb-6">{message}</p>
            <p className="text-white/60 text-sm">
              This may take a few minutes. Please don't close this page.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-500 text-6xl mb-6">✓</div>
            <h1 className="text-2xl font-bold mb-4 text-green-400">Payment Successful!</h1>
            <p className="text-white/80 mb-4">{message}</p>
            {expiresAt && (
              <p className="text-white/60 text-sm mb-6">
                Premium expires: {new Date(expiresAt).toLocaleDateString()}
              </p>
            )}
            <p className="text-white/60 text-sm">
              Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="text-red-500 text-6xl mb-6">✗</div>
            <h1 className="text-2xl font-bold mb-4 text-red-400">Payment Failed</h1>
            <p className="text-white/80 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/buy"
                className="block w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all"
              >
                Try Again
              </Link>
              <Link
                href="/contact"
                className="block w-full py-3 px-4 border border-white/20 text-white/80 hover:bg-white/10 rounded-lg transition-all"
              >
                Contact Support
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}