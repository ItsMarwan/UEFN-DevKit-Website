'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ToastProvider';
import { extractErrorMessage } from '@/lib/api-error';
import Link from 'next/link';

declare global {
  interface Window {
    hcaptcha: any;
    onHcaptchaLoad: () => void;
  }
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const SUPPORT_TEMPLATE = `**Issue Description:**
[Describe what is happening]

**Steps to Reproduce:**
1. 
2. 

**Expected Behavior:**
[What did you expect to happen?]

**Additional Context / Server ID:**
[Enter details]`;

const SUBJECT_OPTIONS = [
  "General Question",
  "Technical Support",
  "Premium / Billing",
  "Custom Payment Method",
  "Enterprise Quote Request",
  "Bug Report",
  "Feature Request",
  "Privacy / Data Request",
  "Partnership",
  "Other"
];

export default function ContactPage() {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Quote specific fields
  const [duration, setDuration] = useState('');
  const [budget, setBudget] = useState('');
  const [serverSize, setServerSize] = useState('');
  const [serverId, setServerId] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  
  // States
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReady, setCaptchaReady] = useState(false);
  
  const widgetRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isTemplateSubject = subject === 'Custom Payment Method' || subject === 'Enterprise Quote Request';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Apply template when switching to Technical Support
  useEffect(() => {
    if (subject === 'Technical Support' && message.trim() === '') {
      setMessage(SUPPORT_TEMPLATE);
    }
  }, [subject, message]);

  // hCaptcha configuration
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

  const renderCaptcha = useCallback(() => {
    if (!window.hcaptcha || !containerRef.current || widgetRef.current !== null || !siteKey) return;
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
      // Catch duplicate renders
    }
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey) return;
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
  }, [renderCaptcha, siteKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const urlSubject = searchParams.get('subject');
    if (urlSubject && SUBJECT_OPTIONS.includes(urlSubject)) setSubject(urlSubject);
    
    if (searchParams.get('name')) setName(searchParams.get('name')!);
    if (searchParams.get('email')) setEmail(searchParams.get('email')!);
    if (searchParams.get('duration')) setDuration(searchParams.get('duration')!);
    if (searchParams.get('budget')) setBudget(searchParams.get('budget')!);
    if (searchParams.get('serverSize')) setServerSize(searchParams.get('serverSize')!);
    if (searchParams.get('serverId')) setServerId(searchParams.get('serverId')!);
    if (searchParams.get('inviteUrl')) setInviteUrl(searchParams.get('inviteUrl')!);
    
    if (searchParams.get('message')) {
      setMessage(searchParams.get('message')!);
    } else if (urlSubject === 'Technical Support') {
      setMessage(SUPPORT_TEMPLATE);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (siteKey && !captchaToken) {
      setErrorMsg('Please complete the human verification challenge.');
      showToast('error', 'Verification Required', 'Please complete the captcha challenge.');
      return;
    }

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMsg('Please fill in all standard fields.');
      showToast('error', 'Missing Fields', 'Please complete all required fields.');
      return;
    }

    setStatus('loading');

    try {
      const payload = {
        name, email, subject, message: message.trim(), captchaToken,
        ...(isTemplateSubject && { duration, budget, serverSize, serverId, inviteUrl })
      };

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transmission failed.');

      setStatus('success');
      setName(''); setEmail(''); setSubject(''); setMessage('');
      setDuration(''); setBudget(''); setServerSize(''); setServerId(''); setInviteUrl('');
      setCaptchaToken('');
      if (window.hcaptcha && widgetRef.current !== null) window.hcaptcha.reset(widgetRef.current);
      showToast('success', 'Message Sent', 'Our team will review your inquiry shortly.');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to send message.');
      showToast('error', 'Delivery Failed', err.message);
    }
  };

  return (
    <div className="min-h-screen text-neutral-200 selection:bg-blue-500/30">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">Get in Touch</h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            Contact our team for support, feature requests, or enterprise solutions.
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-12 text-center backdrop-blur-xl animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Transmission Successful</h2>
            <p className="text-neutral-400 mb-8 max-w-md mx-auto">We've securely received your message. Expected response: 24-48 hours.</p>
            <button onClick={() => setStatus('idle')} className="px-6 py-3 bg-white text-black hover:bg-neutral-200 font-semibold rounded-xl transition-all">
              Send Another Inquiry
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Form Section */}
            <div className="max-w-3xl mx-auto bg-neutral-900/40 border border-neutral-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Your Name <span className="text-red-500">*</span></label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none" required disabled={status === 'loading'} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Email Address <span className="text-red-500">*</span></label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none" required disabled={status === 'loading'} />
                  </div>
                </div>

                {/* Custom Subject Dropdown */}
                <div className="space-y-2 relative" ref={dropdownRef}>
                  <label className="text-sm font-medium text-neutral-300">Inquiry Subject <span className="text-red-500">*</span></label>
                  <div 
                    onClick={() => status !== 'loading' && setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 text-white cursor-pointer flex justify-between items-center transition-all ${isDropdownOpen ? 'ring-1 ring-blue-500/50 border-blue-500/50' : ''}`}
                  >
                    <span className={subject ? 'text-white' : 'text-neutral-600'}>{subject || 'Select a topic...'}</span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      {SUBJECT_OPTIONS.map((opt) => (
                        <div
                          key={opt}
                          onClick={() => { setSubject(opt); setIsDropdownOpen(false); }}
                          className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-white/5 transition-colors ${subject === opt ? 'text-blue-400 bg-blue-500/5 font-medium' : 'text-neutral-400'}`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {isTemplateSubject && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl animate-in fade-in duration-300">
                    <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration (e.g. 6 Months)" className="bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/50" />
                    <input type="text" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Budget (e.g. €500)" className="bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/50" />
                    <input type="text" value={serverSize} onChange={(e) => setServerSize(e.target.value)} placeholder="Server Size (e.g. 50k)" className="bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/50" />
                    <input type="text" value={serverId} onChange={(e) => setServerId(e.target.value)} placeholder="Discord Server ID" className="bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/50" />
                    <input type="url" value={inviteUrl} onChange={(e) => setInviteUrl(e.target.value)} placeholder="Invite URL" className="md:col-span-2 bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/50" />
                  </div>
                )}

                <div className="space-y-2">
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your inquiry..." rows={6} className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-y" required disabled={status === 'loading'} />
                </div>

                {/* Centered Captcha */}
                {siteKey && (
                  <div className="flex flex-col items-center justify-center space-y-3 py-2">
                    <div className="rounded-xl overflow-hidden border border-neutral-800 shadow-lg">
                      <div ref={containerRef} />
                    </div>
                  </div>
                )}

                {errorMsg && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{errorMsg}</div>}

                <button type="submit" disabled={status === 'loading' || (!!siteKey && !captchaToken)} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {status === 'loading' ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Send Transmission'}
                </button>
              </form>
            </div>

            {/* Info Section Below Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 backdrop-blur-sm flex items-start gap-4">
                <div className="w-12 h-12 bg-[#5865F2]/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#5865F2]/20 text-[#7289da]">
                  <svg width="24" height="24" viewBox="0 0 71 55" fill="currentColor">
                    <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a.2.2 0 0 0-.2.1c-.6 1.1-1.3 2.6-1.8 3.7a54 54 0 0 0-16.3 0A37 37 0 0 0 25.4.5a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.5 4.9a.2.2 0 0 0-.1.1C1.5 18.1-.9 31 .3 43.7c0 .1.1.1.1.2a58.8 58.8 0 0 0 17.7 9 .2.2 0 0 0 .2-.1 42 42 0 0 0 3.6-5.9.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4l1.1-.9a.2.2 0 0 1 .2 0c11.5 5.3 24 5.3 35.4 0a.2.2 0 0 1 .2 0l1.1.9a.2.2 0 0 1 0 .4 36 36 0 0 1-5.5 2.6.2.2 0 0 0-.1.3 47 47 0 0 0 3.6 5.9.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.7-9 .2.2 0 0 0 .1-.2C72.9 29.3 69.2 16.5 60.2 5a.2.2 0 0 0-.1-.1ZM23.7 36.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 3.9-2.8 7.2-6.4 7.2Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 3.9-2.8 7.2-6.4 7.2Z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Instant Support</h3>
                  <p className="text-sm text-neutral-400 mb-3">Join our Discord for real-time help from our community.</p>
                  <a href="/discord" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">Join Discord Server →</a>
                </div>
              </div>

              <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Avg. Response Times
                </h3>
                <ul className="text-xs space-y-2.5">
                  <li className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-neutral-400">Premium / Billing</span>
                    <span className="text-white font-medium">Under 12h</span>
                  </li>
                  <li className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-neutral-400">Technical Support</span>
                    <span className="text-white font-medium">24 - 48h</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-neutral-400">General Inquiries</span>
                    <span className="text-white font-medium">~ 48h</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}