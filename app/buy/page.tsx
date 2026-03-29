import Link from 'next/link';
import { redirect } from 'next/navigation';

const BUY_DISABLED = process.env.NEXT_PUBLIC_BUY_DISABLED !== 'false';

export const metadata = {
  title: 'Buy Premium – UEFN DevKit',
  description: 'Manual purchase flow until automatic payments are implemented.',
};

export default function BuyPage() {
  if (!BUY_DISABLED) {
    redirect('/premium');
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-8 sm:p-10 shadow-xl shadow-blue-500/20">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-300 mb-4 flex items-center gap-2">
          <span>🛒</span>
          Buy Premium
        </h1>
        <p className="mb-4 text-white/80">
          The automatic premium checkout system is not implemented yet. Please contact us and we will guide you through
          the manual purchase process while we finish the automatic payment system.
        </p>
        <ul className="space-y-3 text-white/80 mb-6">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">1️.</span>
            <span>Join our Discord or use the contact form</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">2️.</span>
            <span>Tell us your server details and desired plan</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">3️.</span>
            <span>We send manual payment instructions and activate premium</span>
          </li>
        </ul>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 font-semibold text-white hover:shadow-lg transition-all"
          >
            Contact Us
          </Link>
          <Link
            href="/premium"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-white/20 text-white/90 hover:bg-white/10 transition-all"
          >
            View Premium Info
          </Link>
        </div>
      </div>
    </main>
  );
}
