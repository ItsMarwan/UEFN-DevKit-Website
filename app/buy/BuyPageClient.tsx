'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import { useSearchParams } from 'next/navigation';

type PlanType = 'premium';

interface UserServer {
  id: string;
  name: string;
  icon: string | null;
}

export function BuyPageClient() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('premium');
  const [premiumDuration, setPremiumDuration] = useState<number>(1);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [userServers, setUserServers] = useState<UserServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [serverMenuOpen, setServerMenuOpen] = useState(false);
  const [authToastShown, setAuthToastShown] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showProcessingPopup, setShowProcessingPopup] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [processingMessage, setProcessingMessage] = useState('Processing payment...');
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  const selectedServerData = useMemo(
    () => userServers.find((server) => server.id === selectedServer) ?? null,
    [selectedServer, userServers]
  );

  const isAuthenticated = isLoggedIn === true;
  const authDisabled = !isAuthenticated;

  const currentPremiumPlan = useMemo(() => {
    const duration = premiumDuration;
    // Simplified pricing - actual prices are set in Patreon
    const prices: Record<number, number> = {
      1: 5.99,
      2: 11.99,
      3: 17.99,
      6: 35.99,
      12: 71.99,
    };
    return {
      duration,
      price: prices[duration] || 5.99,
    };
  }, [premiumDuration]);

  // Check login status on mount
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const res = await fetch('/api/dashboard/session?lightweight=true');
        if (res.ok) {
          const data = await res.json();
          setIsLoggedIn(!!data?.user);
          setIsOwner(data?.user?.isOwner || false);
          if (data?.user) {
            // Fetch user's servers (guilds where user is owner/admin and bot is installed)
            try {
              const serversRes = await fetch('/api/dashboard/servers');
              if (serversRes.ok) {
                const servers = await serversRes.json();
                setUserServers(servers || []);
              } else {
                console.warn('Failed to fetch servers:', serversRes.status);
              }
            } catch (error) {
              console.error('Error fetching servers:', error);
            }
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    };
    checkLoginStatus();
  }, []);

  // Handle Patreon auth success
  useEffect(() => {
    const patreonAuth = searchParams.get('patreon_auth');
    const plan = searchParams.get('plan');
    const serverId = searchParams.get('serverId');

    if (patreonAuth === 'success' && plan && serverId) {
      // Set the selected plan and server
      const duration = parseInt(plan.replace('months', ''));
      if (duration && [1,2,3,6,12].includes(duration)) {
        setPremiumDuration(duration);
        setSelectedServer(serverId);
      }

      // Clear the URL params
      const url = new URL(window.location.href);
      url.searchParams.delete('patreon_auth');
      url.searchParams.delete('plan');
      url.searchParams.delete('serverId');
      window.history.replaceState({}, '', url.toString());

      // Show success and redirect to post
      setProcessingStatus('success');
      setProcessingMessage('Patreon linked. Redirecting to purchase...');
      setShowProcessingPopup(true);

      fetch('/api/patreon/post-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('Failed to get Patreon post URL');
        }
      })
      .catch(error => {
        console.error('Error getting post URL:', error);
        setProcessingStatus('error');
        setProcessingMessage('Failed to redirect to Patreon. Please try again.');
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (isLoggedIn === false && !authToastShown) {
      showToast(
        'info',
        'Login required',
        'Log in so the bot knows which server to activate and complete your purchase. Payment is one-time upfront, not a recurring monthly or yearly charge.'
      );
      setAuthToastShown(true);
    }
  }, [isLoggedIn, authToastShown, showToast]);

  const handlePatreonCheckout = () => {
    if (!isLoggedIn || !selectedServer) {
      return;
    }

    setCheckoutError(null);
    setCheckoutLoading(true);
    setProcessingStatus('processing');
    setShowProcessingPopup(true);

    const plan = `${premiumDuration}months`;

    // Owner bypass: show confirmation page instead of OAuth
    if (isOwner) {
      setProcessingMessage('Owner detected. Processing purchase...');
      const popup = window.open('', 'patreon_oauth', 'width=600,height=780');

      if (!popup) {
        const message = 'Popup blocked. Allow popups and try again.';
        setCheckoutError(message);
        setProcessingStatus('error');
        setProcessingMessage(message);
        setShowProcessingPopup(true);
        setCheckoutLoading(false);
        return;
      }

      popup.document.write('<div style="font-family: system-ui, sans-serif; color: white; background: black; padding: 24px;">Processing purchase...</div>');
      popup.document.close();

      // Redirect popup to confirmation page
      const confirmUrl = `/premium/confirm?plan=${encodeURIComponent(plan)}&serverId=${encodeURIComponent(selectedServer)}&isOwner=true`;
      popup.location.href = confirmUrl;

      // Listen for confirmation
      const handleMessage = (event: MessageEvent) => {
        if (event.source !== popup) {
          return;
        }

        const payload = event.data;
        if (payload?.type === 'PURCHASE_COMPLETE') {
          window.removeEventListener('message', handleMessage);
          setProcessingStatus('success');
          setProcessingMessage('Premium activated! You can close this window.');
          setCheckoutLoading(false);

          // Close popup after a delay
          setTimeout(() => {
            try {
              popup.close();
            } catch {
              // ignore
            }
            setShowProcessingPopup(false);
          }, 2000);
          return;
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup closed
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          if (processingStatus === 'processing') {
            setProcessingStatus('success');
            setProcessingMessage('Purchase completed. Redirecting...');
            setCheckoutLoading(false);
          }
        }
      }, 1000);

      return;
    }

    setProcessingMessage('Starting Patreon authorization...');
    const popup = window.open('', 'patreon_oauth', 'width=600,height=780');

    if (!popup) {
      const message = 'Popup blocked. Allow popups and try again.';
      setCheckoutError(message);
      setProcessingStatus('error');
      setProcessingMessage(message);
      setShowProcessingPopup(true);
      setCheckoutLoading(false);
      return;
    }

    popup.document.write('<div style="font-family: system-ui, sans-serif; color: white; background: black; padding: 24px;">Opening Patreon authorization...</div>');
    popup.document.close();

    try {
      // Open Patreon auth popup
      const authUrl = `/auth/patreon/start?plan=${plan}&serverId=${selectedServer}`;
      popup.location.href = authUrl;

      // Listen for auth success message
      const handleMessage = (event: MessageEvent) => {
        if (event.source !== popup) {
          return;
        }

        const payload = event.data;
        if (!payload) {
          return;
        }

        if (payload.type === 'PATREON_AUTH_SUCCESS' && payload.linked) {
          window.removeEventListener('message', handleMessage);

          setProcessingStatus('success');
          setProcessingMessage('Patreon linked. Redirecting to purchase...');

          fetch('/api/patreon/post-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan }),
          })
          .then(res => res.json())
          .then(data => {
            if (data.url) {
              window.location.href = data.url;
            } else {
              throw new Error('Failed to get Patreon post URL');
            }
          })
          .catch(error => {
            console.error('Error getting post URL:', error);
            setProcessingStatus('error');
            setProcessingMessage('Failed to redirect to Patreon. Please try again.');
          });
          return;
        }

        if (payload.type === 'PATREON_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          const errorMessage = payload.error || 'Patreon authorization failed. Please try again.';
          setCheckoutError(errorMessage);
          setProcessingStatus('error');
          setProcessingMessage(errorMessage);
          try {
            popup.close();
          } catch {
            // ignore
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Handle popup close without success
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          if (processingStatus === 'processing') {
            setProcessingStatus('error');
            setProcessingMessage('Patreon authorization was cancelled.');
            setCheckoutLoading(false);
          }
        }
      }, 1000);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Checkout failed';
      setCheckoutError(message);
      setProcessingStatus('error');
      setProcessingMessage(message);
      setShowProcessingPopup(true);
      try {
        popup.close();
      } catch {
        // ignore
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleLoginClick = () => {
    window.location.href = '/api/dashboard/login';
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Background gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-10 top-20 left-10 animate-pulse"></div>
      </div>

      {/* Hero Section */}
      <section className="relative py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
              Get Started
            </h1>
            <p className="text-white/60">Choose a plan and start building</p>
          </div>


        </div>
      </section>

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {selectedPlan === 'premium' && (
            <div className="space-y-6">
              {/* Premium Card */}
              <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-black to-black backdrop-blur-sm p-8 md:p-10">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left: Product Info */}
                  <div>
                    <div className="mb-6 flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30">
                        <span className="text-xs font-bold text-blue-300">⭐ MOST POPULAR</span>
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-3">Premium</h2>
                    <p className="text-white/60 mb-6">Perfect for growing communities & creators "showcase only, cannot be used yet"</p>
                    <div className="space-y-2 mb-6">
                      <p className="flex items-center gap-2 text-white/80"><span className="text-blue-400">✓</span> 5,000 customers</p>
                      <p className="flex items-center gap-2 text-white/80"><span className="text-blue-400">✓</span> Priority support</p>
                      <p className="flex items-center gap-2 text-white/80"><span className="text-blue-400">✓</span> Advanced tools</p>
                      <p className="flex items-center gap-2 text-white/80"><span className="text-blue-400">✓</span> 10 Max Trackers</p>
                      <p className="flex items-center gap-2 text-white/80"><span className="text-blue-400">✓</span> Higher Fortnite map pulling rate</p>
                      <p className="flex items-center gap-2 text-white/80"><span className="text-blue-400">✓</span> 512KB Verse File upload limit</p>
                      <p className="flex items-center gap-2 text-white/80"><span className="text-blue-400">✓</span> All Features</p>
                      <p className="flex items-center gap-2 text-white/80"><span className="text-blue-400">✓</span> Premium API Access</p>
                    </div>
                  </div>

                  {/* Right: Pricing & Options */}
                  <div className="space-y-6">
                    {/* Price */}
                    <div className="p-6 rounded-xl bg-blue-500/5 border border-blue-400/20">
                      <div className="flex items-center gap-2">
                        <div className="text-4xl font-bold text-white">€{currentPremiumPlan.price.toFixed(2)}</div>
                      </div>
                      <p className="text-white/60 text-sm mt-2">
                        One-time payment for {premiumDuration} Month{premiumDuration > 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Duration */}
                    <div>
                      <h3 className="text-sm font-bold text-white/80 mb-3">Duration</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 6, 12].map((duration) => (
                          <button
                            key={duration}
                            onClick={() => {
                              setPremiumDuration(duration);
                            }}
                            disabled={authDisabled}
                            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all border-2 ${
                              premiumDuration === duration
                                ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                : 'border-white/10 bg-slate-900 text-white/50 hover:border-blue-500/50 hover:text-white'
                            } ${authDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {duration} Month{duration > 1 ? 's' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Server Selection & Checkout */}
                    <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                      {isLoggedIn === false && (
                        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                          <p className="text-yellow-300 text-sm font-semibold mb-2">Login required</p>
                          <p className="text-yellow-200 text-sm mb-3">
                            Log in so the bot knows which server to activate and complete your purchase. Payment is one-time upfront, not a recurring monthly or yearly charge.
                          </p>
                          <button
                            onClick={handleLoginClick}
                            className="w-full py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all"
                          >
                            Login to Continue
                          </button>
                        </div>
                      )}

                      <>
                        {/* Server Picker */}
                        <div>
                          <h3 className="text-sm font-bold text-white/80 mb-3">Activate On</h3>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              if (authDisabled) return;
                              setServerMenuOpen((open) => !open);
                            }}
                            disabled={authDisabled}
                            className={`w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-white/10 ${authDisabled ? 'bg-slate-900 opacity-50 cursor-not-allowed' : 'bg-slate-900/95 hover:border-white/20'} text-left transition-all`}
                          >
                            <span className="flex items-center gap-3">
                              {selectedServerData ? (
                                selectedServerData.icon ? (
                                  <img
                                    src={`https://cdn.discordapp.com/icons/${selectedServerData.id}/${selectedServerData.icon}.png?size=64`}
                                    alt={selectedServerData.name}
                                    className="w-8 h-8 rounded-full object-cover bg-slate-900"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-white/60">
                                    S
                                  </div>
                                )
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-white/60">
                                  S
                                </div>
                              )}
                              <span className="flex-1 text-sm font-semibold text-white">
                                {selectedServerData ? selectedServerData.name : 'Select a server to activate on'}
                              </span>
                            </span>
                            <span className="text-white/60">▾</span>
                          </button>

                          {serverMenuOpen && (
                            <div className="absolute z-20 mt-2 w-full max-h-72 overflow-auto rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
                              {userServers.length > 0 ? (
                                userServers.map((server) => (
                                  <button
                                    key={server.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedServer(server.id);
                                      setServerMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                                      selectedServer === server.id ? 'bg-blue-500/10 text-white' : 'text-white/80 hover:bg-white/5'
                                    }`}
                                  >
                                    {server.icon ? (
                                      <img
                                        src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=64`}
                                        alt={server.name}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-white/60">
                                        S
                                      </div>
                                    )}
                                    <span className="font-semibold">{server.name}</span>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-4 text-sm text-white/60">Loading servers or no eligible servers found.</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                        {/* Checkout Button */}
                        <button
                          onClick={handlePatreonCheckout}
                          disabled={authDisabled || !selectedServer}
                          className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-3 ${
                            authDisabled || !selectedServer
                              ? 'bg-white/50 text-black/50 cursor-not-allowed'
                              : 'bg-white hover:bg-white/90 text-black'
                          }`}
                        >
                          <span className="text-2xl">🎨</span>
                          <span>Purchase on Patreon</span>
                        </button>
                      </>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-white/50">
                  <span>🔒 Secure Payment</span>
                  <span>⚡ Instant Activation</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20 border-t border-white/10 bg-slate-900/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">How Premium Works</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Select Duration</h3>
              <p className="text-white/60 text-sm">Choose how long you want premium (1-12 months)</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-400 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Pick Server</h3>
              <p className="text-white/60 text-sm">Select which Discord server to activate premium on</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto mb-3">
                <span className="text-green-400 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Pay on Patreon</h3>
              <p className="text-white/60 text-sm">One-time payment via Patreon (secure & instant)</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-400/30 flex items-center justify-center mx-auto mb-3">
                <span className="text-orange-400 font-bold">4</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Use Premium</h3>
              <p className="text-white/60 text-sm">Premium features activated immediately on your server</p>
            </div>
          </div>

          {/* Post-Purchase Guide */}
          <div className="mt-12 p-6 rounded-lg border border-blue-500/30 bg-blue-500/5">
            <h3 className="text-lg font-bold text-blue-400 mb-3">📖 What Happens Next?</h3>
            <ul className="space-y-2 text-white/80 text-sm">
              <li>✓ You'll be redirected to the Patreon purchase page</li>
              <li>✓ Complete payment (one-time charge, no subscription)</li>
              <li>✓ You'll become a patron at the tier you purchased</li>
              <li>✓ Premium features activate on your server instantly</li>
              <li>✓ Your plan is valid for the {premiumDuration} month{premiumDuration > 1 ? 's' : ''} you selected</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Questions?</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Is this a subscription?',
                a: 'No. All purchases are one-time payments with no auto-renewal. You own your plan for the duration you selected.',
              },
              {
                q: 'When do I get access?',
                a: 'Premium access is activated instantly after successful payment.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'no refunds, but if you have any issues with your purchase, contact us and we will do our best to help you out.',
              },
              {
                q: 'Can I switch servers later?',
                a: 'Yes, you will have to contact support to switch the server your plan is active on, but we will assist you with that at any time.',
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-white/10 bg-white/5"
              >
                <h3 className="font-semibold text-white mb-1">{item.q}</h3>
                <p className="text-white/60 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Processing Popup */}
      {showProcessingPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              {processingStatus === 'processing' && (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <h2 className="text-xl font-bold text-white mb-2">Processing Payment</h2>
                  <p className="text-white/80 mb-4">{processingMessage}</p>
                  <p className="text-white/60 text-sm">
                    Redirecting you to Patreon to complete your purchase. This popup will update automatically once authorization is completed.
                  </p>
                </>
              )}
              {processingStatus === 'success' && (
                <>
                  <div className="text-green-500 text-4xl mb-4">✓</div>
                  <h2 className="text-xl font-bold text-white mb-2">Payment Successful!</h2>
                  <p className="text-white/80 mb-4">{processingMessage}</p>
                  <button
                    onClick={() => {
                      setShowProcessingPopup(false);
                      setProcessingStatus('processing');
                      setProcessingMessage('Processing payment...');
                    }}
                    className="w-full py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all"
                  >
                    Close
                  </button>
                </>
              )}
              {processingStatus === 'error' && (
                <>
                  <div className="text-red-500 text-4xl mb-4">✕</div>
                  <h2 className="text-xl font-bold text-white mb-2">Payment Failed</h2>
                  <p className="text-white/80 mb-4">{processingMessage}</p>
                  <button
                    onClick={() => {
                      setShowProcessingPopup(false);
                      setProcessingStatus('processing');
                      setProcessingMessage('Processing payment...');
                    }}
                    className="w-full py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-all"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
