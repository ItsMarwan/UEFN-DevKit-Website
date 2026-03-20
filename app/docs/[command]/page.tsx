'use client';

import { getCommandByName, getAllCategories } from '@/lib/commands';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface PageProps {
  params: Promise<{
    command: string;
  }>;
}

export default function CommandDocPage({ params }: PageProps) {
  const [command, setCommand] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      const cmd = getCommandByName(resolvedParams.command);
      if (!cmd) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCommand(cmd);
      
      const relatedCmds = cmd.relatedCommands
        .map((name: string) => getCommandByName(name))
        .filter(Boolean);
      setRelated(relatedCmds);
      setLoading(false);
    })();
  }, [params]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center pt-24">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-white/60 mb-8">Command not found</p>
        <Link href="/docs" className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all">
          Back to Commands
        </Link>
      </div>
    );
  }

  if (loading || !command) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen pt-24">
      {/* Breadcrumb */}
      <div className="bg-black/50 border-b border-white/10 sticky top-20 z-40 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link href="/docs" className="text-blue-400 hover:text-blue-300 transition-colors">
            ← Back to Docs
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-fadeIn">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              /{command.name}
            </h1>
            <p className="text-xl text-white/70 mb-6">
              {command.description}
            </p>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="feature-card p-4 rounded-lg">
                <p className="text-white/50 text-sm font-semibold mb-2">CATEGORY</p>
                <p className="text-lg font-bold">{command.category}</p>
              </div>
              <div className="feature-card p-4 rounded-lg">
                <p className="text-white/50 text-sm font-semibold mb-2">PERMISSION</p>
                <p className="text-lg font-bold text-blue-400">{command.permission}</p>
              </div>
              <div className="feature-card p-4 rounded-lg">
                <p className="text-white/50 text-sm font-semibold mb-2">TIER</p>
                <p className="text-lg font-bold text-green-400">Free</p>
              </div>
              <div className="feature-card p-4 rounded-lg">
                <p className="text-white/50 text-sm font-semibold mb-2">STATUS</p>
                <p className="text-lg font-bold text-green-400">Available</p>
              </div>
            </div>
          </div>

          {/* Usage */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">Usage</h2>
            <div className="bg-black/50 border border-white/10 rounded-lg p-4">
              <code className="text-cyan-400 font-mono text-lg">{command.usage}</code>
            </div>
          </div>

          {/* Description */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">Description</h2>
            <div className="feature-card p-6 rounded-lg">
              <p className="text-white/80 text-lg leading-relaxed">
                {command.details}
              </p>
            </div>
          </div>

          {/* Examples */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">Examples</h2>
            <div className="space-y-4">
              {command.examples.map((example: string, idx: number) => (
                <div
                  key={idx}
                  className="feature-card p-4 rounded-lg border-l-4 border-blue-500"
                >
                  <code className="text-blue-300 font-mono">{example}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Related Commands */}
          {related.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4 text-white">Related Commands</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {related.map((relatedCmd: any) => (
                  <Link
                    key={relatedCmd.name}
                    href={`/docs/${relatedCmd.name}`}
                    className="command-card feature-card p-4 rounded-lg hover:border-blue-500/50"
                  >
                    <h3 className="font-bold text-blue-400 hover:text-blue-300 transition-colors">
                      /{relatedCmd.name}
                    </h3>
                    <p className="text-sm text-white/60 mt-2">
                      {relatedCmd.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
