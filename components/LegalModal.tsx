'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface LegalModalProps {
  type: 'privacy' | 'tos';
  onClose: () => void;
}

const PRIVACY_CONTENT = (
  <div className="space-y-8">
    <div>
      <h2 className="text-2xl font-bold text-blue-400 mb-3">Privacy Policy</h2>
      <p className="text-white/50 text-sm">Last updated: 12 April 2026</p>
    </div>

    <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
      <p className="text-blue-300 font-semibold text-lg mb-1">🔒 The short version</p>
      <p className="text-white/80">
        We only collect the information needed to run UEFN DevKit and support your Discord community.
        Essential cookies are required for login and sessions. Analytics are only enabled when you explicitly consent.
        We never sell or trade your personal data.
      </p>
    </div>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">1. What Data We Collect</h3>
      <p className="text-white/70 mb-3">
        UEFN DevKit collects information you provide directly through bot commands, Discord OAuth, or website interactions.
        We do not passively harvest personal data beyond what is necessary for the bot and website to function.
      </p>
      <ul className="space-y-2 text-white/70 list-disc list-inside">
        <li>Discord account details from OAuth login: user ID, username, display name, avatar, email</li>
        <li>Discord guild membership and permission metadata</li>
        <li>Customer records and seller profile data created through bot commands</li>
        <li>Verse script uploads and related metadata</li>
        <li>Redeem codes, reports, session delivery details, and server settings</li>
        <li>Premium subscription, Patreon linking, and plan verification data</li>
        <li>Session cookies for authentication, security, and page navigation</li>
      </ul>
      <p className="text-white/60 mt-3 text-sm">
        We do <strong className="text-white">not</strong> collect private Discord messages, voice data, IP addresses, or browsing history unless you provide that information explicitly.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">2. Lawful Basis and GDPR Rights</h3>
      <p className="text-white/70 mb-3">
        For EU/EEA users, our lawful bases for processing personal data include:
      </p>
      <ul className="space-y-2 text-white/70 list-disc list-inside">
        <li><strong>Performance of a contract</strong> — to deliver the bot and dashboard features.</li>
        <li><strong>Consent</strong> — for optional analytics and non-essential tracking.</li>
        <li><strong>Legitimate interest</strong> — for security, fraud prevention, and service improvement.</li>
      </ul>
      <p className="text-white/70 mt-3">
        If you are in the EU/EEA, you have the right to:
      </p>
      <ul className="space-y-2 text-white/70 list-disc list-inside">
        <li>Access your personal data</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Restrict or object to processing</li>
        <li>Request portability of your data</li>
        <li>Withdraw consent at any time</li>
      </ul>
      <p className="text-white/60 mt-3 text-sm">
        To exercise these rights, contact us via the <a href="/contact" className="text-blue-400 hover:text-blue-300 underline">contact page</a> or Discord.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">3. Cookies and Analytics</h3>
      <p className="text-white/70 mb-3">
        Cookies are used to maintain login sessions and support core site functionality.
        Analytics cookies are only activated after you choose <strong className="text-white">Accept All</strong> in the consent banner.
      </p>
      <ul className="space-y-2 text-white/70 list-disc list-inside">
        <li>Essential cookies: required for Discord login, authentication, and security.</li>
        <li>Analytics cookies: optional, used for anonymous usage tracking and site improvement.</li>
      </ul>
      <p className="text-white/60 mt-3 text-sm">
        If you decline analytics cookies, no Google Analytics scripts will run on your browser.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">4. Data Retention &amp; Deletion</h3>
      <p className="text-white/70 mb-3">
        We keep personal data only as long as needed to provide the service and meet our legal obligations.
        After a bot removal or deletion request, associated data is purged within 30 days.
      </p>
      <p className="text-white/60 text-sm">
        If you request deletion, we will remove your information from active systems and disable further processing.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">5. Third-Party Services</h3>
      <p className="text-white/70">
        UEFN DevKit uses Discord, Supabase, and other service providers only as needed to run the bot and website.
        We send only the minimum data required for each feature to function, and those providers have their own privacy policies.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">6. Security</h3>
      <p className="text-white/70">
        We apply industry-standard security measures to protect your data in transit and at rest.
        Sensitive fields are encrypted before storage, and authentication data is protected via secure session cookies.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">7. Contact</h3>
      <p className="text-white/70">
        For privacy requests, data access, or deletion inquiries, contact us through the
        <a href="/contact" className="text-blue-400 hover:text-blue-300 underline"> contact page</a> or our
        <a href="/discord" className="text-blue-400 hover:text-blue-300 underline"> Discord server</a>.
        EU/EEA residents may also lodge a complaint with their local data protection authority.
      </p>
    </section>
  </div>
);

const TOS_CONTENT = (
  <div className="space-y-8">
    <div>
      <h2 className="text-2xl font-bold text-blue-400 mb-3">Terms of Service</h2>
      <p className="text-white/50 text-sm">Last updated: 12 April 2026 · Effective immediately upon use of the bot.</p>
    </div>

    <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
      <p className="text-yellow-300 font-semibold text-lg mb-1">⚠️ The short version</p>
      <p className="text-white/80">
        Use the bot for its intended purpose, keep your use lawful, and do not abuse the service.
        If you break the rules or violate Discord policy, we may restrict access or terminate service.
      </p>
    </div>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h3>
      <p className="text-white/70">
        By adding UEFN DevKit to your Discord server or using any of its commands, you agree to these terms.
        If you do not agree, remove the bot and discontinue use. These terms apply to all users, server owners, administrators, and anyone who interacts with the bot.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">2. Permitted Use</h3>
      <p className="text-white/70 mb-3">UEFN DevKit is designed for:</p>
      <ul className="space-y-2 text-white/70 list-disc list-inside">
        <li>Managing customers and service delivery within Discord</li>
        <li>Organizing island development and Verse scripts</li>
        <li>Tracking Fortnite UEFN island analytics</li>
        <li>Running secure service delivery sessions</li>
        <li>Managing seller profiles and reputation</li>
        <li>Creating and managing redeem codes</li>
        <li>Using bulk import and export features responsibly</li>
        <li>Configuring bot encryption, roles, and server settings</li>
        <li>Premium subscription and Patreon tier verification</li>
        <li>API and dashboard access for approved integrations</li>
      </ul>
      <p className="text-white/70">
        Use of the website and bot is also subject to Discord&apos;s Terms of Service and community guidelines.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">3. Prohibited Use</h3>
      <p className="text-white/70 mb-3">You may <strong className="text-white">not</strong> use UEFN DevKit to:</p>
      <ul className="space-y-2 text-white/70 list-disc list-inside">
        <li>Store unrelated files or use the bot as a general storage host</li>
        <li>Abuse rate limits or spam commands</li>
        <li>Attempt unauthorized access to other servers or data</li>
        <li>Use the bot in violation of Discord policy or applicable law</li>
        <li>Automate commands in unsupported ways</li>
        <li>Impersonate other users or manipulate seller profiles</li>
        <li>Post illegal or abusive content via the service</li>
        <li>Fraudulently monetize the service or perform scams</li>
        <li>Reverse-engineer or copy the core bot functionality</li>
        <li>Circumvent bans, blocks, or feature limitations</li>
        <li>Use the website for scraping, unauthorized access, or privacy violations</li>
        <li>Share encryption keys or credentials insecurely</li>
      </ul>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">4. Storage &amp; Fair Use</h3>
      <p className="text-white/70 mb-3">
        UEFN DevKit includes storage capabilities as part of its functionality. Free tier storage is intended for normal bot usage,
        not as a general file hosting service.
      </p>
      <p className="text-white/70 mb-3">
        If you need higher storage or heavier usage, Premium is the appropriate option. Premium subscribers receive larger limits,
        better retention, and the infrastructure to support higher volume use.
      </p>
      <p className="text-white/70">
        We may remove or limit storage that appears abusive, malicious, or outside the intended scope of bot features.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">5. Account &amp; Server Responsibility</h3>
      <p className="text-white/70">
        Server owners are responsible for how UEFN DevKit is used in their community. Servers using the bot improperly may be suspended or banned.
        Ensure your moderators and administrators understand and follow these terms.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">6. Service Availability</h3>
      <p className="text-white/70">
        The service is provided &quot;as is&quot; and &quot;as available.&quot; We do not guarantee uninterrupted access.
        Maintenance, updates, or outages may affect availability, and we are not liable for indirect losses.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">7. Premium Subscriptions</h3>
      <p className="text-white/70 mb-3">
        Premium plans are billed as described in the app. Subscriptions auto-renew unless cancelled.
        Refunds may be granted within 30 days of purchase at our discretion. Pricing and availability may change with 30 days&apos; notice.
      </p>
      <p className="text-white/70">
        Abuse of Premium features may result in termination of the plan and forfeiture of paid amounts.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">8. Termination</h3>
      <p className="text-white/70">
        We may suspend or permanently ban any user or server that violates these terms.
        Upon termination, data may be retained for up to 30 days before permanent deletion unless you request earlier removal.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">9. Limitation of Liability</h3>
      <p className="text-white/70">
        UEFN DevKit is not liable for indirect, incidental, special, or consequential damages arising from use of the service.
        Our total liability is limited to the amount paid in the 30 days prior to the claim, if any.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">10. Changes to Terms</h3>
      <p className="text-white/70">
        We may update these terms from time to time. Significant changes will be announced on Discord and reflected by an updated date.
        Continued use after changes means you accept the updated terms.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">11. Governing Law</h3>
      <p className="text-white/70">
        These terms are governed by applicable law. Disputes should be resolved in good faith and may proceed to binding arbitration if necessary.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">12. Contact</h3>
      <p className="text-white/70">
        Questions about these terms? Contact us via the
        <a href="/contact" className="text-blue-400 hover:text-blue-300 underline"> contact page</a> or our
        <a href="/discord" className="text-blue-400 hover:text-blue-300 underline"> Discord server</a>.
      </p>
    </section>
  </div>
);

export function LegalModal({ type, onClose }: LegalModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    window.setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-black/80 ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`} />

      {/* Modal */}
      <div className={`relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl shadow-black/50 ${isClosing ? 'animate-scaleOut' : 'animate-scaleIn'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{type === 'privacy' ? '🔒' : '📄'}</span>
            <span className="text-white font-bold text-lg">
              {type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-6 flex-1 overscroll-contain hide-scrollbar">
          {type === 'privacy' ? PRIVACY_CONTENT : TOS_CONTENT}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex-shrink-0 flex justify-end">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}