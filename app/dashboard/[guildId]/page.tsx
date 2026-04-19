// app/dashboard/[guildId]/page.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/components/ToastProvider';
import { useBotHealth } from '@/hooks/useBotHealth';
import { OfflineBanner } from '@/components/OfflineBanner';
import MaskedEmail from '@/components/MaskedEmail';
import { extractErrorMessage } from '@/lib/api-error';

interface User { id: string; username: string; email: string; avatar: string | null; patreon_verified?: boolean; patreon_guild_id?: string }
interface GuildInfo { id: string; name: string; icon: string | null }
interface Stats { customers: number; verse_scripts: number; members: number; trackers: number; command_logs: number }

interface GuildConfig {
  id?: number;
  guild_id?: string;
  log_channel_id: string | null;
  default_customer_role_id: string | null;
  encryption_enabled: boolean;
  key_stored_on_server: boolean;
  server_encryption_key: string | null;
  admin_allowed_roles: string[];
  // read-only display fields
  settings?: string;
  server_tier?: string;
  updated_at?: string;
}

type TabId = 'overview' | 'customers' | 'logs' | 'members' | 'verse_scripts' | 'trackers' | 'config' | 'reports' | 'editor' | 'profile';
type LoadState = 'checking' | 'loading' | 'ready' | 'forbidden' | 'error';

const VALID_TABS: TabId[] = ['overview', 'customers', 'logs', 'members', 'verse_scripts', 'trackers', 'config', 'reports', 'editor', 'profile'];

function getTabFromPath(): TabId {
  if (typeof window === 'undefined') return 'overview';
  const pathParts = window.location.pathname.split('/');
  const urlTab = pathParts[pathParts.length - 1];
  if (VALID_TABS.includes(urlTab as TabId)) {
    return urlTab as TabId;
  }
  return 'overview';
}

function guildIcon(g: GuildInfo) {
  return g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;
}
function avatarUrl(u: User) {
  return u.avatar
    ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(u.id) % 5}.png`;
}
function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString();
}

/** Extract server_tier from the JSON settings blob if present */
function extractTier(config: GuildConfig): string {
  try {
    if (config.settings) {
      const parsed = JSON.parse(config.settings);
      return parsed.server_tier ?? 'free';
    }
  } catch { /* ignore */ }
  return config.server_tier ?? 'free';
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className={`p-5 rounded-xl border ${color} bg-black/40`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white tabular-nums">{fmt(value)}</div>
      <div className="text-white/50 text-xs mt-1">{label}</div>
    </div>
  );
}

function VerseScriptViewer({ scriptName, scriptContent, onClose }: { scriptName: string; scriptContent: string; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [monacoLoaded, setMonacoLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    // Check if Monaco is already available
    if (typeof (window as any).monaco !== 'undefined') {
      setMonacoLoaded(true);
      return;
    }

    // Load Monaco dynamically
    const loadMonaco = async () => {
      try {
        // Load Monaco loader
        const loaderScript = document.createElement('script');
        loaderScript.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.41.0/min/vs/loader.js';
        loaderScript.onload = () => {
          // Configure Monaco
          (window as any).require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.41.0/min/vs' } });
          (window as any).require(['vs/editor/editor.main'], () => {
            // Register Verse language
            const monaco = (window as any).monaco;

            monaco.languages.register({ id: 'verse' });

            monaco.languages.setLanguageConfiguration('verse', {
              comments: {
                lineComment: '#',
                blockComment: ['<#', '#>']
              },
              brackets: [['{', '}'], ['[', ']'], ['(', ')']],
              autoIndent: 'advanced',
              indentationRules: {
                increaseIndentPattern: /^[^#]*([:]|[!]|[:][\>]|[\<][#][\>]|[=]|[\.])[\s\t]*($|[#])/,
                decreaseIndentPattern: /.^/
              }
            });

            monaco.languages.setMonarchTokensProvider('verse', {
              defaultToken: 'variable',
              tokenPostfix: '.verse',

              tokenizer: {
                root: [
                  [/<#(?!>)/, { token: 'comment', next: '@blockcomment' }],
                  [/(?<!<)#(?!>)[^\n]*/, 'comment'],
                  [/\/[A-Za-z0-9_][A-Za-z0-9_\-.]*(?:\/[A-Za-z0-9_.@-]*)*/, 'constant.language'],
                  [/"/, { token: 'string', next: '@string_double' }],
                  [/'(?=[^'\n]*')/, { token: 'string', next: '@string_single' }],
                  [/0x[0-9A-Fa-f]+/, 'constant.numeric'],
                  [/[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?(?:%|[A-Za-z_][A-Za-z0-9_]*)?/, 'constant.numeric'],
                  [/<(?:override|suspends|decides|transacts|computes|converges|abstract|final|public|private|internal|protected|native|no_rollback|persist|epic_internal|allow_multiple|component|editable|serialized|unique|localizes|attaches|wears|constructor|immunity|event|parametric|checked)>/, 'punctuation.definition.tag'],
                  [/:=/, 'punctuation.definition.tag'],
                  [/@/, 'punctuation.definition.tag'],
                  [/&/, 'punctuation.definition.tag'],
                  [/\b(and|or|not)\b/, 'keyword.operator.logical'],
                  [/\b(return|yield|break|continue)\b/, 'keyword.control'],
                  [/\b(is|over|when|where|while|next|in|var|set|ref|alias|live|with|do|until|catch|then|else|of|at)\b/, 'keyword.declaration'],
                  [/[A-Za-z_][A-Za-z0-9_]*(?=\s*(?::=|\s*:[^=)\n][^=\n]*=))/, 'entity.name.function'],
                  [/[A-Za-z_][A-Za-z0-9_]*/, 'variable'],
                  [/[|]|[.][.]|=>|[+\-*/]=/, 'keyword.operator'],
                  [/[+\-*/]|->/, 'keyword.operator.arithmetic'],
                  [/=(?!=)|<>|<=|<|>=|>/, 'keyword.operator.comparison'],
                  [/[:.](?=\s*(#|$))/, 'punctuation.definition.tag'],
                  [/[;,]/, 'punctuation.definition.tag'],
                  [/[{}\[\]()]/, 'delimiter.bracket'],
                  [/[.]/, 'delimiter'],
                ],

                blockcomment: [
                  [/<#(?!>)/, { token: 'comment', next: '@push' }],
                  [/(?<!<)#>/, { token: 'comment', next: '@pop' }],
                  [/./, 'comment'],
                  [/$/, 'comment']
                ],

                string_double: [
                  [/[^"\\{]+/, 'string'],
                  [/\\./, 'constant.character.escape'],
                  [/\{/, { token: 'constant.character.escape', next: '@interp' }],
                  [/"/, { token: 'string', next: '@pop' }],
                  [/$/, { token: 'string', next: '@pop' }]
                ],

                string_single: [
                  [/[^'\\]+/, 'string'],
                  [/\\./, 'constant.character.escape'],
                  [/'/, { token: 'string', next: '@pop' }],
                  [/$/, { token: 'string', next: '@pop' }]
                ],

                interp: [
                  [/\}/, { token: 'constant.character.escape', next: '@pop' }],
                  { include: '@root' }
                ]
              }
            });

            // Define Verse dark theme
            monaco.editor.defineTheme('verse-dark', {
              base: 'vs-dark',
              inherit: false,
              rules: [
                { token: 'invalid', foreground: 'f44747' },
                { token: 'comment', foreground: '77B06B' },
                { token: 'constant.language', foreground: '569cd6' },
                { token: 'constant.numeric', foreground: 'c2ddb4' },
                { token: 'constant.regexp', foreground: '646695' },
                { token: 'constant.character.escape', foreground: 'B89047' },
                { token: 'string', foreground: 'C09077' },
                { token: 'keyword', foreground: '569cd6' },
                { token: 'keyword.control', foreground: '569cd6' },
                { token: 'keyword.operator', foreground: '77AFAF' },
                { token: 'keyword.operator.logical', foreground: '77AFAF' },
                { token: 'keyword.operator.arithmetic', foreground: '77AFAF' },
                { token: 'keyword.operator.comparison', foreground: '77AFAF' },
                { token: 'keyword.other.unit', foreground: '92a788' },
                { token: 'keyword.declaration', foreground: '8499b7' },
                { token: 'punctuation.definition.tag', foreground: '8499b7' },
                { token: 'entity.name.function', foreground: 'e5c2ff' },
                { token: 'variable', foreground: 'b9d6ff' },
                { token: 'storage', foreground: '569CD6' },
                { token: 'storage.type', foreground: '569CD6' },
                { token: 'storage.modifier', foreground: '569CD6' },
                { token: 'delimiter.bracket', foreground: 'D4D4D4' },
                { token: 'delimiter', foreground: 'D4D4D4' },
                { token: '', foreground: 'D4D4D4', background: '000000' },
              ],
              colors: {
                'editor.background': '#000000',
                'editor.foreground': '#D4D4D4',
                'editor.lineHighlightBackground': '#12002C',
                'editor.lineHighlightBorder': '#12002C',
                'editor.inactiveSelectionBackground': '#3A3D41',
                'editor.selectionHighlightBackground': '#ADD6FF26',
                'editorIndentGuide.background': '#404040',
                'editorIndentGuide.activeBackground': '#707070',
                'list.dropBackground': '#383B3D',
                'activityBarBadge.background': '#007ACC',
                'sideBarTitle.foreground': '#BBBBBB',
                'statusBarItem.remoteBackground': '#16825D',
                'statusBarItem.remoteForeground': '#FFF',
                'editor.selectionBackground': '#264F78',
                'editorCursor.foreground': '#AEAFAD',
                'editorLineNumber.foreground': '#858585',
                'editorLineNumber.activeForeground': '#C6C6C6',
                'editorGutter.background': '#000000',
                'editorWhitespace.foreground': '#3B3B3B',
                'editorRuler.foreground': '#5A5A5A',
                'editorBracketMatch.background': '#0D3A58',
                'editorBracketMatch.border': '#888888',
                'scrollbarSlider.background': '#79797966',
                'scrollbarSlider.hoverBackground': '#646464B3',
                'scrollbarSlider.activeBackground': '#BFBFBF66',
                'minimap.background': '#000000',
                'minimap.selectionHighlight': '#264F78',
                'minimapSlider.background': '#79797933',
                'minimapSlider.hoverBackground': '#64646459',
                'minimapSlider.activeBackground': '#BFBFBF33',
                'editorSuggestWidget.background': '#252526',
                'editorSuggestWidget.border': '#454545',
                'editorSuggestWidget.foreground': '#D4D4D4',
                'editorSuggestWidget.highlightForeground': '#0097FB',
                'editorSuggestWidget.selectedBackground': '#094771',
                'editorHoverWidget.background': '#252526',
                'editorHoverWidget.border': '#454545',
                'editorOverviewRuler.border': '#7F7F7F4D',
                'editorError.foreground': '#F44747',
                'editorWarning.foreground': '#CCA700',
                'editorInfo.foreground': '#75BEFF',
                'widget.shadow': '#000000',
              }
            });

            setMonacoLoaded(true);
          });
        };
        document.head.appendChild(loaderScript);
      } catch (error) {
        console.error('Failed to load Monaco Editor:', error);
      }
    };

    loadMonaco();
  }, []);

  useEffect(() => {
    if (monacoLoaded && containerRef.current && !editorRef.current) {
      const monaco = (window as any).monaco;
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: scriptContent,
        language: 'verse',
        theme: 'verse-dark',
        automaticLayout: true,
        readOnly: true,
        minimap: { enabled: true, side: 'right' },
        fontFamily: "Consolas, 'Courier New', monospace",
        fontSize: 13,
        lineHeight: 20,
        renderLineHighlight: 'all',
        smoothScrolling: true,
        cursorBlinking: 'blink',
        mouseWheelZoom: true,
        padding: { top: 4, bottom: 4 }
      });
      setLoading(false);
    }
  }, [monacoLoaded, scriptContent]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[9999]">
      <div className="bg-[#1e1e1e] rounded-lg shadow-2xl text-white w-[95vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/50">
          <div>
            <h3 className="text-lg font-bold text-white">{scriptName}</h3>
            <p className="text-xs text-white/50 mt-0.5">Read-only Verse Script Viewer</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white text-2xl font-bold w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded transition-colors"
          >
            ×
          </button>
        </div>

        {/* Monaco Editor Container */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="w-full max-w-2xl p-6 bg-black/80 rounded-xl animate-pulse">
                <div className="h-5 bg-white/10 rounded mb-4 w-3/4" />
                <div className="h-4 bg-white/10 rounded mb-2 w-1/2" />
                <div className="h-4 bg-white/10 rounded mb-6 w-full" />
                <div className="h-3 bg-white/10 rounded mb-2 w-5/6" />
                <div className="h-3 bg-white/10 rounded mb-2 w-4/6" />
                <div className="h-3 bg-white/10 rounded w-3/6" />
                <p className="mt-3 text-white/60 text-sm">Loading the Verse viewer... {loadingProgress}%</p>
              </div>
            </div>
          )}
          <div ref={containerRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}

function VerseScriptsUploadForm({ guildId, onUploadSuccess }: { guildId: string; onUploadSuccess: () => void }) {
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({ script_name: '', script_content: '', description: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.script_name.trim() || !formData.script_content.trim()) {
      showToast('warning', 'Missing Fields', 'Please enter both a name and content');
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch('/api/v1/verse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Discord-Server-ID': guildId,
          'Authorization': 'Bearer placeholder',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        showToast('error', 'Upload Failed', 'Could not upload verse script');
        return;
      }

      showToast('success', 'Script Uploaded', `${formData.script_name} has been uploaded`);
      setFormData({ script_name: '', script_content: '', description: '' });
      setShowForm(false);
      onUploadSuccess();
    } catch (error) {
      showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to upload script');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mb-6 p-4 rounded-lg border border-blue-500/30 bg-blue-500/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-sm">Upload New Verse Script</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 text-blue-400 rounded transition-colors"
        >
          {showForm ? '− Collapse' : '+ Upload'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={formData.script_name}
            onChange={e => setFormData({ ...formData, script_name: e.target.value })}
            placeholder="Script name (e.g., MyScript)"
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 text-sm"
          />
          <textarea
            value={formData.script_content}
            onChange={e => setFormData({ ...formData, script_content: e.target.value })}
            placeholder="Paste your Verse script code here..."
            rows={6}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 text-sm font-mono resize-none"
          />
          <input
            type="text"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 text-blue-400 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : '✓ Upload Script'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 rounded-lg font-medium text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function VerseScriptsTable({ data, loading, guildId }: { data: Record<string, unknown>[] | null; loading: boolean; guildId: string }) {
  const [viewingScript, setViewingScript] = useState<{ name: string; content: string; id: string } | null>(null);

  // Check URL parameters on mount to auto-open viewer
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const scriptId = urlParams.get('v');
      if (scriptId && data) {
        const script = data.find(row => String(row.file_id || row.id) === scriptId);
        if (script) {
          const scriptName = String(script.title || script.name || script.file_id || 'Untitled');
          const scriptContent = String(script.content ?? script.code ?? script.script ?? '');
          setViewingScript({ name: scriptName, content: scriptContent, id: scriptId });
        }
      }
    }
  }, [data]);

  const handleViewScript = (script: Record<string, unknown>) => {
    const scriptId = String(script.file_id || script.id);
    const scriptName = String(script.title || script.name || script.file_id || 'Untitled');
    const scriptContent = String(script.content ?? script.code ?? script.script ?? '');

    // Update URL
    const newUrl = `/dashboard/${guildId}/verse_scripts?v=${encodeURIComponent(scriptId)}`;
    window.history.replaceState({ scriptId }, '', newUrl);

    setViewingScript({ name: scriptName, content: scriptContent, id: scriptId });
  };

  const handleCloseViewer = () => {
    // Remove URL parameter
    const newUrl = `/dashboard/${guildId}/verse_scripts`;
    window.history.replaceState({}, '', newUrl);

    setViewingScript(null);
  };

  if (loading) return (
    <div className="py-16">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-white/10 rounded w-3/4 mx-auto" />
        <div className="h-4 bg-white/10 rounded w-1/2 mx-auto" />
        <div className="h-4 bg-white/10 rounded w-1/3 mx-auto" />
        <div className="h-40 rounded-xl bg-white/10 mx-auto" />
      </div>
    </div>
  );
  if (!data || data.length === 0) return (
    <div className="text-center py-16 text-white/30">No scripts found</div>
  );

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-4 py-3 text-left text-white/50 font-medium text-xs uppercase tracking-wide whitespace-nowrap">Name</th>
              <th className="px-4 py-3 text-left text-white/50 font-medium text-xs uppercase tracking-wide whitespace-nowrap">Created</th>
              <th className="px-4 py-3 text-left text-white/50 font-medium text-xs uppercase tracking-wide whitespace-nowrap">Size</th>
              <th className="px-4 py-3 text-left text-white/50 font-medium text-xs uppercase tracking-wide whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const scriptName = String(row.title || row.name || row.file_id || 'Untitled');
              const scriptContent = String(row.content ?? row.code ?? row.script ?? '');
              const createdAt = row.updated_at || row.created_at ? new Date(String(row.updated_at || row.created_at)).toLocaleDateString() : '—';
              const sizeKb = row.file_size_kb !== undefined && row.file_size_kb !== null
                ? String(Number(row.file_size_kb).toFixed(2))
                : scriptContent.length > 0
                ? (scriptContent.length / 1024).toFixed(2)
                : '0.00';

              return (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white/80 font-mono text-xs">
                    <span className="text-blue-400">{scriptName}</span>
                  </td>
                  <td className="px-4 py-3 text-white/80 text-xs">{createdAt}</td>
                  <td className="px-4 py-3 text-white/80 text-xs">{sizeKb} KB</td>
                  <td className="px-4 py-3 text-white/80">
                    <button
                      onClick={() => handleViewScript(row)}
                      className="px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 border border-blue-500/30 rounded transition-colors"
                    >
                      👁️ View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viewingScript && (
        <VerseScriptViewer
          scriptName={viewingScript.name}
          scriptContent={viewingScript.content}
          onClose={handleCloseViewer}
        />
      )}
    </>
  );
}

function DataTable({ data, loading }: { data: Record<string, unknown>[] | null; loading: boolean }) {
  if (loading) return (
    <div className="py-12">
      <div className="animate-pulse space-y-3">
        <div className="h-5 bg-white/10 rounded w-24" />
        {[...Array(6)].map((_, idx) => (
          <div key={idx} className="h-8 bg-white/10 rounded" />
        ))}
      </div>
    </div>
  );
  if (!data || data.length === 0) return (
    <div className="text-center py-16 text-white/30">No records found</div>
  );

  const cols = Object.keys(data[0]).filter(k => {
    const v = data[0][k];
    return typeof v !== 'object' || v === null;
  });
  const allCols = cols.length > 0 ? cols : Object.keys(data[0]).slice(0, 6);

  function renderCell(val: unknown): string {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'object') return JSON.stringify(val).slice(0, 60) + '…';
    const s = String(val);
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return new Date(s).toLocaleDateString();
    return s.length > 60 ? s.slice(0, 60) + '…' : s;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            {allCols.map(col => (
              <th key={col} className="px-4 py-3 text-left text-white/50 font-medium text-xs uppercase tracking-wide whitespace-nowrap">
                {col.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              {allCols.map(col => (
                <td key={col} className="px-4 py-3 text-white/80 whitespace-nowrap font-mono text-xs">
                  {renderCell(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomerDetail({ row }: { row: Record<string, unknown> }) {
  const cd = (row.customer_data ?? {}) as Record<string, unknown>;
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
        {String(cd.display_name ?? cd.username ?? '?').charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-white font-medium text-sm">{String(cd.display_name ?? cd.username ?? 'Unknown')}</p>
        <p className="text-white/40 text-xs">@{String(cd.username ?? '—')}</p>
        <p className="text-white/50 text-xs mt-0.5">{String(cd.reason ?? '—')}</p>
      </div>
      <div className="ml-auto text-right flex-shrink-0">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
          {String(row.status ?? 'manual')}
        </span>
        <p className="text-white/30 text-xs mt-1">{String(cd.added_by ?? '—')}</p>
      </div>
    </div>
  );
}

function EditorSoon() {
  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-black/70 backdrop-blur-sm">
        <div className="text-center px-6 max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚡</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold mb-3">
            COMING SOON
          </div>
          <h3 className="text-white font-bold text-xl mb-2">Dashboard Editor</h3>
          <p className="text-white/60 text-sm leading-relaxed mb-5">
            Run bot commands, manage data, and edit server settings directly from the dashboard — no Discord required.
            This is a <span className="text-blue-400 font-semibold">Premium</span> feature.
          </p>
          <button disabled className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500/50 to-cyan-500/50 text-white/50 rounded-lg font-semibold text-sm cursor-not-allowed">
            ⭐ Premium Features Disabled
          </button>
          <p className="text-white/30 text-xs mt-3">Contact support for more information</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/40 p-5 select-none pointer-events-none" aria-hidden>
        <div className="mb-4 flex gap-2">
          {['Add Customer', 'Create Coupon', 'Upload Script', 'Start Session'].map(label => (
            <div key={label} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/20 text-xs font-medium">{label}</div>
          ))}
        </div>
        <div className="h-10 bg-white/5 border border-white/10 rounded-lg mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-white/5 border border-white/10 rounded-lg" />
          <div className="h-24 bg-white/5 border border-white/10 rounded-lg" />
        </div>
        <div className="mt-3 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg" />
      </div>
    </div>
  );
}


function IslandToolsTab({ guildId }: { guildId: string }) {
  const { showToast } = useToast();
  const [islandCode, setIslandCode] = useState('');
  const [lookupData, setLookupData] = useState<any | null>(null);
  const [predictData, setPredictData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'lookup' | 'predict'>('lookup');

  const handleIslandLookup = async () => {
    if (!islandCode.trim()) {
      showToast('warning', 'Missing Code', 'Please enter an island code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/island/lookup?island_code=${encodeURIComponent(islandCode.trim())}`, {
        headers: {
          'X-Discord-Server-ID': guildId,
          'Authorization': 'Bearer placeholder',
        },
      });

      if (!res.ok) {
        const error = await res.json();
        showToast('error', 'Lookup Failed', error.error || error.message || 'Failed to fetch island data');
        setLookupData(null);
        return;
      }

      const result = await res.json();
      if (result.data?.data) {
        setLookupData(result.data.data);
        setActiveTab('lookup');
        showToast('success', 'Island Found', `Data loaded for ${result.data.data.map_name}`);
      } else {
        showToast('error', 'No Data', 'No island data found for this code');
        setLookupData(null);
      }
    } catch (error) {
      showToast('error', 'Connection Error', error instanceof Error ? error.message : 'Failed to connect');
      setLookupData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleIslandPredict = async () => {
    if (!islandCode.trim()) {
      showToast('warning', 'Missing Code', 'Please enter an island code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/island/predict?island_code=${encodeURIComponent(islandCode.trim())}`, {
        headers: {
          'X-Discord-Server-ID': guildId,
          'Authorization': 'Bearer placeholder',
        },
      });

      if (!res.ok) {
        const error = await res.json();
        showToast('error', 'Prediction Failed', error.error || error.message || 'Failed to get prediction');
        setPredictData(null);
        return;
      }

      const result = await res.json();
      if (result.data?.data) {
        setPredictData(result.data.data);
        setActiveTab('predict');
        showToast('success', 'Prediction Generated', `Analysis complete for ${result.data.data.map_name || 'your island'}`);
      } else {
        showToast('error', 'No Data', 'Could not generate prediction');
        setPredictData(null);
      }
    } catch (error) {
      showToast('error', 'Connection Error', error instanceof Error ? error.message : 'Failed to connect');
      setPredictData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="p-4 sm:p-6 rounded-xl border border-blue-500/30 bg-black/40">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <span>🏝️</span> Island Tools
        </h3>
        <p className="text-white/50 text-sm mb-4">Look up island statistics and get discovery predictions powered by AI analytics.</p>
        
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            value={islandCode}
            onChange={e => setIslandCode(e.target.value.toUpperCase())}
            placeholder="Island code (e.g., 1234-5678-9012)"
            maxLength={14}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 font-mono text-sm transition-colors"
          />
          <button
            onClick={handleIslandLookup}
            disabled={loading}
            className="px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 text-blue-400 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {loading && activeTab === 'lookup' ? <div className="w-4 h-4 rounded-full bg-blue-400/60 animate-pulse" /> : '🔍'}
            Lookup
          </button>
          <button
            onClick={handleIslandPredict}
            disabled={loading}
            className="px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/30 text-purple-400 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {loading && activeTab === 'predict' ? <div className="w-4 h-4 rounded-full bg-purple-400/60 animate-pulse" /> : '🤖'}
            Predict
          </button>
        </div>

        {/* Results Tabs */}
        {(lookupData || predictData) && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('lookup')}
                disabled={!lookupData}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'lookup' && lookupData
                    ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                    : 'bg-white/5 border border-white/10 text-white/50 disabled:opacity-50'
                }`}
              >
                📊 Statistics
              </button>
              <button
                onClick={() => setActiveTab('predict')}
                disabled={!predictData}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'predict' && predictData
                    ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400'
                    : 'bg-white/5 border border-white/10 text-white/50 disabled:opacity-50'
                }`}
              >
                🤖 Prediction
              </button>
            </div>

            {/* Lookup Results */}
            {activeTab === 'lookup' && lookupData && (
              <div className="space-y-3 mt-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="text-white font-bold mb-3">{lookupData.map_name}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide">Creator</p>
                      <p className="text-white font-mono text-xs mt-1">{lookupData.creator_code || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide">Category</p>
                      <p className="text-white font-mono text-xs mt-1">{lookupData.category || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide">Plays</p>
                      <p className="text-white font-bold text-sm mt-1">{lookupData.plays?.toLocaleString() || '—'}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide">Unique Players</p>
                      <p className="text-white font-bold text-sm mt-1">{lookupData.unique_players?.toLocaleString() || '—'}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide">Peak CCU</p>
                      <p className="text-white font-bold text-sm mt-1">{lookupData.peak_ccu?.toLocaleString() || '—'}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide">Avg Time</p>
                      <p className="text-white font-bold text-sm mt-1">{lookupData.avg_time?.toFixed(1) || '—'} min</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide">Favorites</p>
                      <p className="text-white font-bold text-sm mt-1">{lookupData.favorites?.toLocaleString() || '—'}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide">Minutes Played</p>
                      <p className="text-white font-bold text-sm mt-1">{lookupData.minutes_played?.toLocaleString() || '—'}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide">Day 1 Retention</p>
                      <p className="text-white font-bold text-sm mt-1">{lookupData.d1_retention ? (lookupData.d1_retention * 100).toFixed(1) + '%' : '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Prediction Results */}
            {activeTab === 'predict' && predictData && (
              <div className="space-y-3 mt-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-bold">{predictData.map_name}</h4>
                    <span className="text-2xl">{predictData.color_indicator}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide">Discovery Probability</p>
                      <p className="text-white font-bold text-lg mt-1">{predictData.probability?.toFixed(1) || '—'}%</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide">Confidence</p>
                      <p className="text-white font-bold text-lg mt-1">{predictData.confidence?.toFixed(1) || '—'}%</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide">Trending</p>
                      <p className="text-white font-bold text-lg mt-1">{predictData.is_trending ? '🔥 Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide">CCU Momentum</p>
                      <p className={`font-bold text-sm mt-1 ${predictData.ccu_momentum >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {predictData.ccu_momentum?.toFixed(2) || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide">Should Update</p>
                      <p className="text-white font-bold text-sm mt-1">{predictData.should_update ? '✅ Yes' : '❌ No'}</p>
                    </div>
                  </div>

                  {predictData.update_reason && (
                    <div className="mb-4 p-3 rounded bg-white/5 border border-white/10">
                      <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Update Recommendation</p>
                      <p className="text-white text-sm">{predictData.update_reason}</p>
                    </div>
                  )}

                  {predictData.discovery_tabs && Object.keys(predictData.discovery_tabs).length > 0 && (
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wide mb-2">Discovery Tabs</p>
                      <div className="space-y-1">
                        {Object.entries(predictData.discovery_tabs)
                          .sort((a, b) => (b[1] as number) - (a[1] as number))
                          .slice(0, 5)
                          .map(([tab, pct]) => (
                            <div key={tab} className="flex items-center justify-between">
                              <span className="text-white/60 text-xs">{tab}</span>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-white font-bold text-xs w-8 text-right">{(pct as number).toFixed(1)}%</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feature Info */}
      <div className="p-4 sm:p-6 rounded-xl border border-white/10 bg-black/40">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <span>ℹ️</span> About Island Tools
        </h3>
        <div className="space-y-3 text-sm text-white/60">
          <p>
            <span className="text-white font-semibold">🔍 Island Lookup</span> — Get real-time statistics for any Fortnite Creative island including player counts, engagement metrics, and retention rates.
          </p>
          <p>
            <span className="text-white font-semibold">🤖 Discovery Prediction</span> — AI-powered analysis of discovery probability, trending status, and recommendations for when to update your island.
          </p>
          <p className="pt-2 border-t border-white/10">
            Island Tools is a <span className="text-blue-400 font-semibold">Premium</span> feature. Both Discord commands and API access are available for premium servers.
          </p>
        </div>
      </div>
    </div>
  );
}



function ReportsTab({ guildId }: { guildId: string }) {
  const { showToast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/reports', {
        headers: {
          'X-Discord-Server-ID': guildId,
          'Authorization': 'Bearer placeholder',
        },
      });

      if (!res.ok) {
        showToast('error', 'Failed to Load Reports', 'Could not fetch reports');
        setReports([]);
        return;
      }

      const data = await res.json();
      setReports(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to fetch reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-6 rounded-xl border border-orange-500/30 bg-black/40">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <span>🚩</span> Reports
          </h3>
        </div>

        {loading ? (
          <div className="py-8">
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-white/10 rounded w-24" />
              <div className="h-3 bg-white/10 rounded w-28" />
              <div className="h-3 bg-white/10 rounded w-20" />
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-white/30">No reports yet</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {reports.map((report, i) => {
              const reportedUserId = String(report.reported_user_id ?? report.reported_id ?? '—');
              return (
                <div key={i} className="px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-mono text-sm">User: {reportedUserId}</p>
                      <p className="text-white/60 text-xs mt-1">{report.reason || 'No reason provided'}</p>
                      {report.details && <p className="text-white/40 text-xs mt-1">{report.details}</p>}
                    </div>
                    <span className="text-white/30 text-xs whitespace-nowrap ml-2">
                      {report.created_at ? new Date(report.created_at).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ServerConfigTab({ guildId }: { guildId: string }) {
  const { showToast } = useToast();
  const [config, setConfig] = useState<GuildConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editable local state
  const [logChannel, setLogChannel] = useState('');
  const [defaultRole, setDefaultRole] = useState('');
  const [encEnabled, setEncEnabled] = useState(false);
  const [keyOnServer, setKeyOnServer] = useState(false);
  const [encKey, setEncKey] = useState('');
  const [adminRoles, setAdminRoles] = useState('');

  // Redeem code
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAbortController = useRef<AbortController | null>(null);
  const hasFetched = useRef(false);

  const fetchConfig = useCallback(async () => {
    // Cancel any existing request
    if (fetchAbortController.current) {
      fetchAbortController.current.abort();
    }

    const abortController = new AbortController();
    fetchAbortController.current = abortController;

    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/server-config?guildId=${guildId}`);

      if (!res.ok) {
        const errorMsg = await extractErrorMessage(res);
        showToast('error', 'Failed to Load Config', errorMsg);
        return;
      }
      const json = await res.json();

      // Flask response structure: { success, data: { endpoint, data: {...settings} }, request_id }
      let raw: GuildConfig;
      if (json?.data?.endpoint === 'guild_settings' && json?.data?.data) {
        raw = json.data.data as GuildConfig;
      } else if (json?.data?.data && typeof json.data.data === 'object' && !Array.isArray(json.data.data)) {
        raw = json.data.data as GuildConfig;
      } else if (json?.data?.[0]) {
        raw = json.data[0] as GuildConfig;
      } else if (json?.data && typeof json.data === 'object') {
        raw = json.data as GuildConfig;
      } else {
        raw = json as GuildConfig;
      }

      // Warn if guild IDs do not match; continue to render so page is not stuck
      // if (raw.guild_id && String(raw.guild_id) !== guildId) {
      //   showToast('warning', 'Guild ID Mismatch', `Server response guild_id ${raw.guild_id} does not match requested guild ${guildId}.`);
      // }

      setConfig(raw);
      setLogChannel(raw.log_channel_id ?? '');
      setDefaultRole(raw.default_customer_role_id ?? '');
      setEncEnabled(raw.encryption_enabled ?? false);
      setKeyOnServer(raw.key_stored_on_server ?? false);
      setEncKey('');
      const roles = Array.isArray(raw.admin_allowed_roles)
        ? raw.admin_allowed_roles
        : typeof raw.admin_allowed_roles === 'string'
        ? (() => { try { return JSON.parse(raw.admin_allowed_roles) ?? []; } catch { return []; } })()
        : [];
      setAdminRoles(roles.join(', '));
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        showToast('warning', 'Request Aborted', 'Config request was aborted.');
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        showToast('error', 'Connection Error', errorMsg);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
      if (fetchAbortController.current === abortController) {
        fetchAbortController.current = null;
      }
    }
  }, [guildId, showToast]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchConfig();

    return () => {
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
      }
    };
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);

    const rolesArr = adminRoles
      .split(',')
      .map(s => s.trim())
      .filter(s => /^\d{17,20}$/.test(s));

    const payload: Record<string, unknown> = {};

    if (encEnabled !== undefined) payload.encryption_enabled = encEnabled;
    if (keyOnServer !== undefined) payload.key_stored_on_server = keyOnServer;
    if (rolesArr.length > 0) payload.admin_allowed_roles = rolesArr;
    if (logChannel.trim()) payload.log_channel_id = logChannel.trim();
    if (defaultRole.trim()) payload.default_customer_role_id = defaultRole.trim();
    if (encKey.trim()) payload.server_encryption_key = encKey.trim();

    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 15000); // 15 second timeout

      const res = await fetch(`/api/dashboard/server-config?guildId=${guildId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);
      const json = await res.json();
      if (!res.ok) {
        const errorMsg = json.error ?? 'Save failed';
        setSaveMsg({ type: 'error', text: errorMsg });
        showToast('error', 'Save Failed', errorMsg);
      } else {
        const successMsg = 'Settings saved successfully!';
        setSaveMsg({ type: 'success', text: successMsg });
        showToast('success', 'Settings Saved', successMsg);
        setEncKey('');
        hasFetched.current = false;
        fetchConfig();
      }
    } catch (e) {
      const errorMsg = String(e);
      setSaveMsg({ type: 'error', text: errorMsg });
      showToast('error', 'Error', errorMsg);
    }
    setSaving(false);
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeemLoading(true);
    setRedeemMsg(null);
    try {
      const res = await fetch(`/api/dashboard/redeem?guildId=${guildId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        const errorMsg = json.error ?? 'Redemption failed';
        setRedeemMsg({ type: 'error', text: errorMsg });
        showToast('error', 'Redemption Failed', errorMsg);
      } else {
        const successMsg = json.message ?? 'Code redeemed!';
        setRedeemMsg({ type: 'success', text: successMsg });
        showToast('success', 'Code Redeemed', successMsg);
        setRedeemCode('');
        hasFetched.current = false;
        fetchConfig();
      }
    } catch (e) {
      const errorMsg = String(e);
      setRedeemMsg({ type: 'error', text: errorMsg });
      showToast('error', 'Error', errorMsg);
    }
    setRedeemLoading(false);
  };

  if (loading) return (
    <div className="py-16">
      <div className="animate-pulse space-y-3 max-w-xl mx-auto">
        <div className="h-5 bg-white/10 rounded w-40" />
        <div className="h-5 bg-white/10 rounded w-52" />
        <div className="h-5 bg-white/10 rounded w-36" />
      </div>
    </div>
  );

  const tier = config ? extractTier(config) : 'free';
  const tierColor =
    tier === 'enterprise' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    : tier === 'premium'  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    : 'bg-white/10 text-white/50 border-white/10';

  return (
    <div className="space-y-8">

      {/* Current Status */}
      <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-black/40">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
          <span>📊</span> Server Status
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="space-y-1">
            <p className="text-white/40 text-xs uppercase tracking-wide">Tier</p>
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${tierColor}`}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-white/40 text-xs uppercase tracking-wide">Encryption</p>
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${encEnabled ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-white/5 text-white/30 border-white/10'}`}>
              {encEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-white/40 text-xs uppercase tracking-wide">Key Storage</p>
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${keyOnServer ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 'bg-white/5 text-white/30 border-white/10'}`}>
              {keyOnServer ? 'Server' : 'None'}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-white/40 text-xs uppercase tracking-wide">Updated</p>
            <p className="text-white/60 text-xs font-mono">
              {config?.updated_at ? new Date(config.updated_at).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Redeem Code */}
      <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-black/40">
        <h3 className="text-white font-bold mb-1 flex items-center gap-2 text-sm sm:text-base">
          <span>🎟️</span> Redeem Code / Activate Premium
        </h3>
        <p className="text-white/40 text-xs mb-4">Enter a redeem code to activate premium or unlock features for this server.</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <input
            type="text"
            value={redeemCode}
            onChange={e => setRedeemCode(e.target.value.replace(/[^a-zA-Z0-9_\-]/g, ''))}
            placeholder="e.g. PREMIUM-ABC123"
            maxLength={64}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 font-mono transition-colors"
          />
          <button
            onClick={handleRedeem}
            disabled={redeemLoading || !redeemCode.trim()}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm whitespace-nowrap"
          >
            {redeemLoading ? <div className="w-4 h-4 rounded-full bg-white/30 animate-pulse" /> : '✓'}
            Redeem
          </button>
        </div>
        {redeemMsg && (
          <div className={`mt-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm border ${redeemMsg.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {redeemMsg.text}
          </div>
        )}
        <p className="text-white/30 text-xs mt-3">
          Premium redeem codes are currently unavailable.
        </p>
      </div>

      {/* Editable Settings */}
      <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-black/40">
        <h3 className="text-white font-bold mb-1 flex items-center gap-2 text-sm sm:text-base">
          <span>⚙️</span> Server Settings
        </h3>
        <p className="text-white/40 text-xs mb-5">Changes are saved immediately. Server tier and IDs cannot be edited here.</p>

        <div className="space-y-4 sm:space-y-5">
          {/* Log Channel */}
          <div>
            <label className="block text-white/60 text-xs font-semibold mb-1.5 uppercase tracking-wide">
              Log Channel ID
            </label>
            <input
              type="text"
              value={logChannel}
              onChange={e => setLogChannel(e.target.value.replace(/\D/g, '').slice(0, 20))}
              placeholder="Discord channel snowflake ID (leave empty to clear)"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 font-mono text-sm transition-colors"
            />
            <p className="text-white/30 text-xs mt-1">Bot will send activity logs to this channel.</p>
          </div>

          {/* Default Customer Role */}
          <div>
            <label className="block text-white/60 text-xs font-semibold mb-1.5 uppercase tracking-wide">
              Default Customer Role ID
            </label>
            <input
              type="text"
              value={defaultRole}
              onChange={e => setDefaultRole(e.target.value.replace(/\D/g, '').slice(0, 20))}
              placeholder="Discord role snowflake ID (leave empty to clear)"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 font-mono text-sm transition-colors"
            />
            <p className="text-white/30 text-xs mt-1">Assigned to new customers via <code className="text-cyan-400">/customer add</code>.</p>
          </div>

          {/* Admin Allowed Roles */}
          <div>
            <label className="block text-white/60 text-xs font-semibold mb-1.5 uppercase tracking-wide">
              Admin Allowed Role IDs
            </label>
            <input
              type="text"
              value={adminRoles}
              onChange={e => setAdminRoles(e.target.value)}
              placeholder="Comma-separated role snowflake IDs, e.g. 1234567890, 9876543210"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 font-mono text-sm transition-colors"
            />
            <p className="text-white/30 text-xs mt-1">Roles that can use admin bot commands. Separate multiple IDs with commas.</p>
          </div>

          {/* Encryption */}
          <div className="pt-2 border-t border-white/5">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-3">🔒 Encryption</p>
            <div className="space-y-3">
              <label className="flex items-start sm:items-center gap-2 sm:gap-3 cursor-pointer group">
                <button
                  type="button"
                  role="switch"
                  aria-checked={encEnabled}
                  onClick={() => setEncEnabled(v => !v)}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5 sm:mt-0 ${encEnabled ? 'bg-blue-500' : 'bg-white/20'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${encEnabled ? 'translate-x-5' : ''}`} />
                </button>
                <div>
                  <span className="text-white text-xs sm:text-sm font-medium">Enable encryption</span>
                  <p className="text-white/30 text-xs">Encrypts sensitive data fields at rest.</p>
                </div>
              </label>

              <label className="flex items-start sm:items-center gap-2 sm:gap-3 cursor-pointer group">
                <button
                  type="button"
                  role="switch"
                  aria-checked={keyOnServer}
                  onClick={() => setKeyOnServer(v => !v)}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5 sm:mt-0 ${keyOnServer ? 'bg-yellow-500' : 'bg-white/20'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${keyOnServer ? 'translate-x-5' : ''}`} />
                </button>
                <div>
                  <span className="text-white text-xs sm:text-sm font-medium">Store key on server</span>
                  <p className="text-white/30 text-xs">Disabling this means only you can decrypt your data (zero-knowledge).</p>
                </div>
              </label>

              <div>
                <label className="block text-white/60 text-xs font-semibold mb-1.5 uppercase tracking-wide">
                  Encryption Passphrase
                </label>
                <input
                  type="password"
                  value={encKey}
                  onChange={e => setEncKey(e.target.value)}
                  placeholder="Enter new passphrase to update (leave blank to keep current)"
                  autoComplete="new-password"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 font-mono text-sm transition-colors"
                />
                <p className="text-white/30 text-xs mt-1">⚠️ If you lose your passphrase, encrypted data cannot be recovered.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {saving ? <div className="w-4 h-4 rounded-full bg-white/30 animate-pulse" /> : '💾'}
            Save Settings
          </button>
          <button
            onClick={() => { hasFetched.current = false; fetchConfig(); }}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white font-medium rounded-lg transition-all text-sm"
          >
            ↻ Reset
          </button>
        </div>

        {saveMsg && (
          <div className={`mt-4 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm border ${saveMsg.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {saveMsg.text}
          </div>
        )}
      </div>

      {/* Read-only reminder */}
      <div className="p-4 rounded-xl border border-white/5 bg-white/3 text-white/30 text-xs">
        <strong className="text-white/50">Note:</strong> Server ID, tier, and encrypted settings blob are read-only and cannot be changed here. Use bot commands like{' '}
        <code className="text-cyan-400">/premium</code> or{' '}
        <code className="text-cyan-400">/config encryption-info</code> for advanced management.
      </div>
    </div>
  );
}

export default function GuildDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const botHealth = useBotHealth();
  const guildId = params?.guildId as string;

  const [user, setUser] = useState<User | null>(null);
  const [guild, setGuild] = useState<GuildInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('checking');
  const [errorMsg, setErrorMsg] = useState('');
  // Initialize activeTab from URL immediately (client-side only)
  const [activeTab, setActiveTab] = useState<TabId>(() => getTabFromPath());

  const [tabData, setTabData] = useState<Record<string, Record<string, unknown>[] | null>>({});
  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({});
  const [logsPreview, setLogsPreview] = useState<Record<string, unknown>[] | null>(null);

  const fetched = useRef(false);
  const pendingRequests = useRef<Record<string, AbortController>>({});

  // Sync URL with activeTab
  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    const newUrl = `/dashboard/${guildId}/${tab}`;
    if (typeof window !== 'undefined') {
      window.history.replaceState({ tab }, '', newUrl);
    }
  }, [guildId]);

  // Cleanup abort controllers on unmount
  useEffect(() => {
    return () => {
      Object.values(pendingRequests.current).forEach(controller => controller.abort());
      pendingRequests.current = {};
    };
  }, []);

  const health = useBotHealth();

  useEffect(() => {
    if (!guildId || fetched.current) return;

    // Wait for health check to complete (not 'checking')
    if (health.status === 'checking') return;

    // Block if offline
    if (health.status === 'offline') {
      fetched.current = true;
      setErrorMsg('Connection not found');
      showToast('error', 'Connection Error', 'Cannot connect to the server. Please try again later.');
      setLoadState('error');
      return;
    }

    fetched.current = true;

    const load = async () => {
      try {
        const accessRes = await fetch(`/api/dashboard/verify-access?guildId=${guildId}`);
        if (accessRes.status === 401) { router.replace('/api/dashboard/login'); return; }
        if (!accessRes.ok) {
          const err = await accessRes.json();
          const errorText =
            err.reason === 'no_permission' ? `You don't have Manage Server permission in this server.`
            : err.reason === 'not_in_guild' ? `You're not a member of this server.`
            : err.reason === 'bot_not_in_guild' ? `Bot is not in this server. Please invite the bot first.`
            : err.error || 'Access denied.';
          setErrorMsg(errorText);
          showToast('error', 'Access Denied', errorText);
          setLoadState('forbidden'); return;
        }

        const accessData = await accessRes.json();
        setGuild(accessData.guild);
        setLoadState('loading');

        const sessionRes = await fetch('/api/dashboard/session?lightweight=true');
        if (!sessionRes.ok) {
          const sessionErr = await extractErrorMessage(sessionRes);
          showToast('error', 'Session Error', sessionErr);
          router.replace('/api/dashboard/login');
          return;
        }
        const sessionData = await sessionRes.json();
        setUser(sessionData.user);

        // Small delay to ensure session is fully propagated
        await new Promise(resolve => setTimeout(resolve, 50));

        const statsRes = await fetch(`/api/dashboard/stats?guildId=${guildId}`);
        if (statsRes.ok) setStats(await statsRes.json());
        else {
          const statsErr = await extractErrorMessage(statsRes);
          showToast('warning', 'Stats Failed', statsErr);
        }

        // Fetch logs preview for the overview section
        try {
          const logsRes = await fetch(`/api/dashboard/data?guildId=${guildId}&endpoint=logs&limit=5`);
          if (logsRes.ok) {
            const logsJson = await logsRes.json();
            const rows = logsJson?.data?.data ?? logsJson?.data ?? [];
            setLogsPreview(Array.isArray(rows) ? rows.slice(0, 5) : []);
          }
        } catch {
          // Silently ignore logs preview errors
        }

        setLoadState('ready');
      } catch (error) {
        const errorText = error instanceof Error ? error.message : 'Failed to load server dashboard.';
        setErrorMsg(errorText);
        setLoadState('error');
        showToast('error', 'Dashboard Error', errorText);
      }
    };
    load();
  }, [guildId, router, showToast, health.status]);

  const fetchTabData = useCallback(async (tab: TabId) => {
    if (tab === 'overview' || tab === 'editor' || tab === 'config') return;
    if (tabData[tab] !== undefined) return;

    // Ensure user session is loaded before making API calls
    if (!user) {
      console.warn(`User session not loaded yet, skipping ${tab} data fetch`);
      return;
    }

    // Cancel any existing request for this tab
    if (pendingRequests.current[tab]) {
      pendingRequests.current[tab].abort();
    }

    const abortController = new AbortController();
    pendingRequests.current[tab] = abortController;

    setTabLoading(p => ({ ...p, [tab]: true }));

    try {
      // Add a small delay to ensure session is fully established
      await new Promise(resolve => setTimeout(resolve, 100));

      const res = await fetch(`/api/dashboard/data?guildId=${guildId}&endpoint=${tab}`, {
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) return;

      if (res.ok) {
        const json = await res.json();
        const rows = json?.data?.data ?? json?.data ?? [];
        setTabData(p => ({ ...p, [tab]: Array.isArray(rows) ? rows : [] }));
      } else {
        // If we get a 401/403, it might be a session issue - retry once after a longer delay
        if (res.status === 401 || res.status === 403) {
          console.warn(`Access denied for ${tab}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 500));

          const retryRes = await fetch(`/api/dashboard/data?guildId=${guildId}&endpoint=${tab}`, {
            signal: abortController.signal,
          });

          if (retryRes.ok) {
            const json = await retryRes.json();
            const rows = json?.data?.data ?? json?.data ?? [];
            setTabData(p => ({ ...p, [tab]: Array.isArray(rows) ? rows : [] }));
            return;
          }
        }

        const errorMsg = await extractErrorMessage(res);
        showToast('error', 'Failed to Load Data', errorMsg);
        setTabData(p => ({ ...p, [tab]: [] }));
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      showToast('error', 'Connection Error', errorMsg);
      setTabData(p => ({ ...p, [tab]: [] }));
    } finally {
      if (!abortController.signal.aborted) {
        setTabLoading(p => ({ ...p, [tab]: false }));
      }
      delete pendingRequests.current[tab];
    }
  }, [guildId, tabData, showToast, user]);

  useEffect(() => {
    if (loadState === 'ready' && user) fetchTabData(activeTab);
  }, [activeTab, loadState, fetchTabData, user]);

  if (loadState === 'checking' || loadState === 'loading') {
    return (
      <div className="bg-black text-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* header skeleton */}
          <div className="space-y-4 animate-pulse">
            <div className="h-4 rounded-full bg-white/10 w-32" />
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10" />
                <div className="space-y-2">
                  <div className="h-5 rounded bg-white/10 w-48" />
                  <div className="h-3 rounded bg-white/10 w-40" />
                </div>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="space-y-1">
                  <div className="h-4 rounded bg-white/10 w-24" />
                  <div className="h-3 rounded bg-white/10 w-32" />
                </div>
                <div className="h-8 rounded-lg bg-white/10 w-20" />
              </div>
            </div>

            {/* tabs skeleton */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[...Array(7)].map((_, idx) => (
                <div key={idx} className="h-9 rounded-lg bg-white/10 w-24" />
              ))}
            </div>
          </div>

          {/* content skeleton */}
          <div className="mt-6 animate-pulse">
            <div className="h-8 rounded bg-white/10 w-56 mb-4" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="h-28 rounded-xl bg-white/10" />
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-56 rounded-xl bg-white/10" />
              <div className="h-56 rounded-xl bg-white/10" />
            </div>

            <div className="mt-6 h-6 rounded bg-white/10 w-48" />
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="h-20 rounded-lg bg-white/10" />
              ))}
            </div>

            <p className="mt-6 text-white/60">{loadState === 'checking' ? 'Verifying access…' : 'Loading dashboard…'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadState === 'forbidden') {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/60 mb-6">{errorMsg}</p>
          <Link href="/dashboard" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold text-white">
            Back to Servers
          </Link>
        </div>
      </div>
    );
  }

  if (loadState === 'error') {
    const isConnectionError = errorMsg === 'Connection not found';

    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
            isConnectionError
              ? 'bg-red-500/20 border border-red-500/30'
              : 'bg-yellow-500/20 border border-yellow-500/30'
          }`}>
            <div className="text-5xl">{isConnectionError ? '🔌' : '⚠️'}</div>
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${isConnectionError ? 'text-red-400' : 'text-yellow-400'}`}>
            {isConnectionError ? 'Connection Lost' : 'Error Loading Dashboard'}
          </h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            {isConnectionError
              ? 'Cannot connect to the server. The Flask server may be down or unreachable.'
              : errorMsg}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              ↻ Try Again
            </button>
            <Link
              href="/dashboard"
              className="block px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold text-white transition-all"
            >
              Back to Servers
            </Link>
          </div>
          {isConnectionError && (
            <p className="text-white/40 text-xs mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
              💡 Make sure the Flask server is running and accessible before trying again.
            </p>
          )}
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: string; soon?: boolean }[] = [
    { id: 'overview',      label: 'Overview',      icon: '📊' },
    { id: 'customers',     label: 'Customers',     icon: '💸' },
    { id: 'logs',          label: 'Command Logs',  icon: '📋' },
    { id: 'members',       label: 'Members',       icon: '👥' },
    { id: 'verse_scripts', label: 'Verse Scripts', icon: '📦' },
    { id: 'trackers',      label: 'Trackers',      icon: '⏱️' },
    { id: 'reports',       label: 'Reports',       icon: '🚩' },
    { id: 'config',        label: 'Server Config', icon: '⚙️' },
    // { id: 'editor',        label: 'Editor',        icon: '⚡', soon: true },
  ];

  const icon = guild ? guildIcon(guild) : null;

  function renderTabContent() {
    if (activeTab === 'editor') return <EditorSoon />;
    if (activeTab === 'reports') return <ReportsTab guildId={guildId} />;
    if (activeTab === 'config') return <ServerConfigTab guildId={guildId} />;

    if (activeTab === 'overview') {
      return (
        <div className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">Server Stats</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <StatCard icon="💸" label="Customers"    value={stats?.customers ?? 0}     color="border-blue-500/30" />
              <StatCard icon="📦" label="Verse Scripts" value={stats?.verse_scripts ?? 0} color="border-purple-500/30" />
              <StatCard icon="👥" label="Members"      value={stats?.members ?? 0}       color="border-green-500/30" />
              <StatCard icon="⏱️" label="Trackers"     value={stats?.trackers ?? 0}      color="border-orange-500/30" />

              {/* Console Preview for Command Logs */}
              <div className="lg:col-span-2 p-4 rounded-xl border border-cyan-500/30 bg-black/40">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">Command Logs Console</p>
                  <span className="text-white/40 text-xs">{logsPreview?.length ?? 0} entries</span>
                </div>
                <div className="bg-black border border-white/10 rounded-lg overflow-hidden font-mono text-xs">
                  <div className="bg-white/5 border-b border-white/10 px-3 py-2">
                    <span className="text-white/50">server@discord ~ $ command-logs</span>
                  </div>
                  <div className="max-h-[180px] overflow-y-auto p-3 space-y-1">
                    {logsPreview && logsPreview.length > 0 ? (
                      logsPreview.map((row, i) => {
                        const timestamp = row.timestamp ? new Date(String(row.timestamp)) : new Date();
                        const timeStr = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        const commandName = String(row.command_name ?? 'unknown');

                        return (
                          <div key={i} className="text-white/80 hover:bg-white/5 px-1 transition-colors">
                            <span className="text-white/50">{timeStr}</span>
                            {' '}
                            <span className="text-cyan-400 font-semibold">{commandName}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-white/40">server@discord ~ $ # No logs available</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleTabChange('logs')}
                  className="mt-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  View Full Log Console →
                </button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {[
                { label: 'Customers',  tab: 'customers'     as TabId, icon: '👥', desc: `${fmt(stats?.customers)}` },
                { label: 'Logs',    tab: 'logs'          as TabId, icon: '📋', desc: `View console` },
                { label: 'Scripts',   tab: 'verse_scripts' as TabId, icon: '📦', desc: `${fmt(stats?.verse_scripts)}` },
                { label: 'Config',   tab: 'config'        as TabId, icon: '⚙️', desc: 'Settings' },
              ].map(a => (
                <button
                  key={a.tab}
                  onClick={() => handleTabChange(a.tab)}
                  className="p-2 sm:p-4 rounded-xl border border-white/10 bg-black/40 hover:border-blue-500/50 transition-all text-left group"
                >
                  <div className="text-lg sm:text-xl mb-1 sm:mb-2">{a.icon}</div>
                  <p className="text-white font-semibold text-xs sm:text-sm group-hover:text-blue-400 transition-colors">{a.label}</p>
                  <p className="text-white/40 text-xs hidden sm:block mt-0.5">{a.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">Bot Commands Reference</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                { cmd: '/customer add',           desc: 'Register a new customer' },
                { cmd: '/verse',                  desc: 'Upload a Verse script' },
                { cmd: '/session start',          desc: 'Start a service session' },
                { cmd: '/island predict',         desc: 'Predict island stats' },
                { cmd: '/island lookup',          desc: 'Look up island stats by code' },
                { cmd: '/stats',                  desc: 'View server dashboard metrics' },
                { cmd: '/export data',            desc: 'Export all server data' },
                { cmd: '/redeem <code>',          desc: 'Redeem a feature code' },
              ].map(c => (
                <div key={c.cmd} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <code className="text-cyan-400 font-mono text-xs bg-black/40 px-2 py-1 rounded flex-shrink-0">{c.cmd}</code>
                  <span className="text-white/60 text-xs">{c.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-center">
              <Link href="/commands" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                View all 50+ commands →
              </Link>
            </div>
          </div>
        </div>
      );
    }

    const rows = tabData[activeTab];
    const isLoading = tabLoading[activeTab] ?? false;

    if (activeTab === 'customers') {
      return (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-white font-bold text-sm sm:text-base">
              Customers <span className="text-white/30 font-normal text-xs sm:text-sm ml-1">{rows ? `(${rows.length})` : ''}</span>
            </h2>
            <button onClick={() => { setTabData(p => { const n = {...p}; delete n.customers; return n; }); fetchTabData('customers'); }}
              className="text-white/40 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors">↻ Refresh</button>
          </div>
          {isLoading || !rows ? (
            <div className="py-16">
              <div className="animate-pulse space-y-3 max-w-xl mx-auto">
                <div className="h-4 bg-white/10 rounded w-40" />
                <div className="h-10 bg-white/10 rounded" />
                <div className="h-10 bg-white/10 rounded" />
                <div className="h-10 bg-white/10 rounded" />
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 text-white/30">No customers yet</div>
          ) : (
            <div className="space-y-2">
              {rows.map((row, i) => <CustomerDetail key={i} row={row} />)}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'logs') {
      return (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold">Command Logs Console</h2>
            <button onClick={() => { setTabData(p => { const n = {...p}; delete n.logs; return n; }); fetchTabData('logs'); }}
              className="text-white/40 hover:text-white text-xs transition-colors">↻ Refresh</button>
          </div>
          <div className="text-white/50 text-xs mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
            📖 Real-time command execution logs from your Discord bot. Shows every command run by users in your server (automatically cleaned up after 12 hours).
          </div>
          {isLoading || !rows ? (
            <div className="py-16">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-white/10 rounded w-56" />
                <div className="h-4 bg-white/10 rounded w-48" />
                <div className="h-4 bg-white/10 rounded w-40" />
                <div className="h-40 bg-white/10 rounded" />
              </div>
            </div>
          ) : (
            <div className="bg-black border border-white/10 rounded-lg overflow-hidden font-mono text-sm">
              <div className="bg-white/5 border-b border-white/10 px-4 py-2 flex items-center justify-between">
                <span className="text-white/50">server@discord ~ $ command-logs</span>
                <span className="text-white/30 text-xs">{rows?.length || 0} entries</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {rows && rows.length > 0 ? (
                  <div className="p-4 space-y-0">
                    {rows.map((row, i) => {
                      const timestamp = row.timestamp ? new Date(String(row.timestamp)) : new Date();
                      const timeStr = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      const commandName = String(row.command_name ?? 'unknown');
                      const userId = String(row.user_id ?? '?');
                      const args = row.args ? String(row.args) : '';

                      return (
                        <div key={i} className="text-white/80 hover:bg-white/5 px-2 py-1 transition-colors">
                          <span className="text-white/50">{timeStr}</span>
                          {' '}
                          <span className="text-cyan-400 font-semibold">{commandName}</span>
                          {' '}
                          <span className="text-white/40">@{userId}</span>
                          {args && <span className="text-white/30"> {args}</span>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-white/40">server@discord ~ $ # No logs available</div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'verse_scripts') {
      return (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold">
              Verse Scripts <span className="text-white/30 font-normal text-sm ml-1">{rows ? `(${rows.length})` : ''}</span>
            </h2>
            <button onClick={() => { setTabData(p => { const n = {...p}; delete n.verse_scripts; return n; }); fetchTabData('verse_scripts'); }}
              className="text-white/40 hover:text-white text-xs transition-colors">↻ Refresh</button>
          </div>
          <div className="text-white/50 text-xs mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
            📜 View and inspect your uploaded Verse scripts. Click the view button to open any script in a read-only Monaco editor. Use the form below to upload new scripts.
          </div>
          <VerseScriptsUploadForm guildId={guildId} onUploadSuccess={() => { setTabData(p => { const n = {...p}; delete n.verse_scripts; return n; }); fetchTabData('verse_scripts'); }} />
          <VerseScriptsTable data={rows ?? null} loading={isLoading} guildId={guildId} />
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold capitalize">
            {activeTab.replace('_', ' ')} <span className="text-white/30 font-normal text-sm ml-1">{rows ? `(${rows.length})` : ''}</span>
          </h2>
          <button onClick={() => { setTabData(p => { const n = {...p}; delete n[activeTab]; return n; }); fetchTabData(activeTab); }}
            className="text-white/40 hover:text-white text-xs transition-colors">↻ Refresh</button>
        </div>
        <DataTable data={rows ?? null} loading={isLoading} />
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <OfflineBanner health={botHealth} />
      {/* Header */}
      <section className="py-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="text-white/50 hover:text-blue-400 transition-colors text-sm inline-block mb-4">
            ← Back to Servers
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {icon ? (
                <Image src={icon} alt={guild!.name} width={48} height={48} className="w-12 h-12 rounded-xl" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{guild?.name?.charAt(0)}</span>
                </div>
              )}
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">{guild?.name}</h1>
                <p className="text-white/40 text-xs font-mono mt-0.5">ID: {guildId}</p>
              </div>
            </div>
            {user && (
              <div className="hidden sm:flex items-center gap-3">
                <Image src={avatarUrl(user)} alt={user.username} width={32} height={32} className="w-8 h-8 rounded-full border-2 border-blue-500/50" />
                <div>
                  <p className="text-white text-sm font-medium">{user.username}</p>
                  <MaskedEmail email={user.email} className="text-white/40 text-xs mt-0.5" />
                </div>
                <a href="/api/dashboard/logout" className="ml-2 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/70 hover:text-white">
                  Logout
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-white/10 sticky top-0 z-40 bg-black/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto overflow-y-hidden pb-2 pt-2 px-4 sm:px-0 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/40">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-sm sm:text-base">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.soon && (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 leading-none">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h1 className="text-lg sm:text-2xl font-bold text-white">
              {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
            </h1>
            {(['customers', 'logs', 'members', 'verse_scripts', 'trackers'].includes(activeTab)) && (
              <button
                onClick={() => {
                  setTabData(p => {
                    const n = {...p};
                    delete n[activeTab];
                    return n;
                  });
                  fetchTabData(activeTab as TabId);
                }}
                className="px-3 py-1.5 text-xs sm:text-sm bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg transition-colors"
              >
                🔄 Refresh Data
              </button>
            )}
          </div>
          {renderTabContent()}
        </div>
      </section>
    </div>
  );
}