'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ToastProvider';
import { extractErrorMessage } from '@/lib/api-error';

declare global {
  interface Window {
    hcaptcha: any;
    onHcaptchaLoad: () => void;
  }
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ContactPage() {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReady, setCaptchaReady] = useState(false);
  const widgetRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // hCaptcha site key — require in production
  const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

  if (!HCAPTCHA_SITE_KEY) {
    if (process.env.NODE_ENV === 'production') {
      // console.error('NEXT_PUBLIC_HCAPTCHA_SITE_KEY environment variable is required in production');
      // Fallback to test key (unsafe, but page won't break)
    } else {
      // Development: use test key for local testing
      // console.warn('⚠️ Using test hCaptcha key (development only)');
    }
  }

  const siteKey = HCAPTCHA_SITE_KEY;

  const renderCaptcha = useCallback(() => {
    if (!window.hcaptcha || !containerRef.current || widgetRef.current !== null) return;
    try {
      widgetRef.current = window.hcaptcha.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'dark',
        callback: (token: string) => setCaptchaToken(token),
        'expired-callback': () => setCaptchaToken(''),
        'error-callback': () => setCaptchaToken(''),
      });
      setCaptchaReady(true);
    } catch {
      // already rendered or not ready
    }
  }, [siteKey]);

  useEffect(() => {
    if (window.hcaptcha) {
      renderCaptcha();
      return;
    }

    window.onHcaptchaLoad = renderCaptcha;

    const script = document.createElement('script');
    script.src = 'https://js.hcaptcha.com/1/api.js?onload=onHcaptchaLoad&render=explicit';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // cleanup
    };
  }, [renderCaptcha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!captchaToken) {
      setErrorMsg('Please complete the captcha challenge.');
      showToast('error', 'Captcha Required', 'Please complete the captcha challenge.');
      return;
    }

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMsg('Please fill in all fields.');
      showToast('error', 'Missing Fields', 'Please fill in all fields.');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message, captchaToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || await extractErrorMessage(res) || 'Something went wrong.';
        throw new Error(errorMsg);
      }

      setStatus('success');
      setName(''); setEmail(''); setSubject(''); setMessage('');
      setCaptchaToken('');
      if (window.hcaptcha && widgetRef.current !== null) {
        window.hcaptcha.reset(widgetRef.current);
      }
      showToast('success', 'Message Sent!', 'Thanks for reaching out. We\'ll get back to you soon.');
    } catch (err: any) {
      setStatus('error');
      const error = err.message || 'Failed to send. Please try again.';
      setErrorMsg(error);
      showToast('error', 'Send Failed', error);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen pt-16">
      {/* Header */}
      <section className="py-12 md:py-20 border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute w-96 h-96 bg-blue-500 rounded-full filter blur-3xl top-0 left-0" />
          <div className="absolute w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl bottom-0 right-0" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-xl text-white/70">
            Have a question, feedback, or need support? We&apos;re here to help.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4">

          {status === 'success' ? (
            <div className="text-center py-16 animate-fadeIn">
              <div className="text-6xl mb-6">✅</div>
              <h2 className="text-2xl font-bold text-white mb-3">Message Sent!</h2>
              <p className="text-white/60 mb-8">
                Thanks for reaching out. We&apos;ll get back to you as soon as possible,
                usually within 24–48 hours.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                    disabled={status === 'loading'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                    disabled={status === 'loading'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">
                  Subject <span className="text-red-400">*</span>
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  required
                  disabled={status === 'loading'}
                >
                  <option value="" className="text-white/30">Select a topic...</option>
                  <option value="General Question">General Question</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Premium / Billing">Premium / Billing</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Privacy / Data Request">Privacy / Data Request</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question or issue in detail..."
                  rows={7}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  required
                  disabled={status === 'loading'}
                />
                <p className="text-white/30 text-xs mt-1 text-right">{message.length}/2000</p>
              </div>

              {/* hCaptcha */}
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-3">
                  Human Verification <span className="text-red-400">*</span>
                </label>
                <div ref={containerRef} />
                {!captchaReady && (
                  <p className="text-white/30 text-xs mt-2">Loading captcha...</p>
                )}
              </div>

              {/* Error */}
              {(errorMsg || status === 'error') && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {errorMsg || 'Something went wrong. Please try again.'}
                </div>
              )}

              {/* Discord alternative */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-start gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <p className="text-white font-semibold text-sm">Prefer Discord?</p>
                  <p className="text-white/50 text-sm mt-0.5">
                    Join our{' '}
                    <a href="/discord" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                      support server
                    </a>{' '}
                    for faster responses from our team and community.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading' || !captchaToken}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>✉️ Send Message</>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}