'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-light mb-4">404</h1>
        <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Page Not Found
        </p>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-gradient-primary text-white font-bold rounded-lg hover:shadow-lg transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
